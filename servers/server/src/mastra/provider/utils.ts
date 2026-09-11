import { type LanguageModelMiddleware, type wrapLanguageModel } from "ai";

import { isLlmRecordingEnabled } from "@/recording/exchange-record";
import { recordExchange } from "@/recording/recording-fetch";

/** `wrapLanguageModel` 接受的 model 类型别名，供各 provider 的 createThinkingModel 复用。 */
export type WrapLMModel = Parameters<typeof wrapLanguageModel>[0]["model"];

// ============================================================
// reasoning 往返处理（provider 无关）
//
// 历史上这些逻辑绑在 deepseek provider 上，模型配置化后所有「OpenAI 兼容 + 用
// reasoning_content 传思考」的端点共用同一套：DeepSeek / GLM / 经网关的 gemini 都符合。
// ============================================================

/**
 * 剥离 reasoning 文本里所有 `<think>` / `<thought>` 开闭标签（不区分大小写、可重复/嵌套）。
 *
 * 为让只认字符串标签的 extractReasoningMiddleware 承接原生 reasoning_content，本层在响应侧用
 * `<think>` 包裹、请求侧再抽出。但「包」「拆」不严格互逆——每轮无条件加一层，标签会随
 * reasoning_content 回灌越滚越多。这里自己把标签清干净，保证发出去的永远是无标签纯文本。
 */
export const stripReasoningTags = (text: string): string => text.replace(/<\/?(?:think|thought)\s*>/gi, "").trim();

/** 走后台 fire-and-forget 派发的委派工具名（其 dispatch 占位只进 SSE、不进消息，落到请求体 content 为空） */
const BACKGROUND_DELEGATION_TOOLS = new Set(["agent-swExecutorAgent"]);

/** 空窗期回填给 LLM 的占位文本：强调「派发成功、勿重发、报告稍后注入」 */
const BACKGROUND_DISPATCH_PLACEHOLDER =
  "[后台任务已派发] 子 agent 已在后台开始执行——这是「派发成功」的确认，不是失败、也不是空结果。" +
  "请勿因为此处暂无执行结果而重复调用本工具：同一任务只派发一次。" +
  "子 agent 完成后，真实的执行报告（<execution_report>）会自动注入本对话，届时再继续处理。";

interface WireMessage {
  role?: string;
  content?: unknown;
  tool_call_id?: string;
  tool_calls?: Array<{ id?: string; function?: { name?: string } }>;
}

/**
 * 兜底回填后台委派工具的空 tool 结果（原地改最终 wire body）。
 *
 * agent-swExecutorAgent 走 Mastra background task：dispatch 时占位只进 SSE，落到请求体是
 * `{ role:"tool", content:"" }`。空结果会让主 agent 误判「委派没成功」而重复派发。这里在请求
 * 发出前把空的后台结果填上明确占位（transient：只改本次 body，不动 memory）。
 */
const backfillEmptyBackgroundToolResults = (messages: WireMessage[]): void => {
  const toolNameById = new Map<string, string>();
  for (const m of messages) {
    if (m?.role === "assistant" && Array.isArray(m.tool_calls)) {
      for (const tc of m.tool_calls) {
        if (tc?.id && tc?.function?.name) {
          toolNameById.set(tc.id, tc.function.name);
        }
      }
    }
  }

  for (const m of messages) {
    if (m?.role !== "tool" || (m.content !== "" && m.content != null)) {
      continue;
    }
    const toolName = m.tool_call_id ? toolNameById.get(m.tool_call_id) : undefined;
    if (toolName && BACKGROUND_DELEGATION_TOOLS.has(toolName)) {
      m.content = BACKGROUND_DISPATCH_PLACEHOLDER;
      console.log(`[bg-backfill] 回填空的后台结果 toolName=${toolName} toolCallId=${m.tool_call_id}`);
    }
  }
};

/**
 * prompt 传给 provider 前，把 assistant 消息里的 reasoning part 内联为 `<think>…</think>`
 * 前缀塞回首个 text part。
 *
 * `@ai-sdk/openai` 的 chat converter 只识别 `text` / `tool-call`，`reasoning` part 会被静默丢弃；
 * 上一轮含 tool_call 时到 fetch 层就只剩 content/tool_calls，无法还原 reasoning_content，
 * DeepSeek thinking 模式会报错。
 */
export const inlineReasoningMiddleware: LanguageModelMiddleware = {
  specificationVersion: "v3",
  transformParams: async ({ params }) => {
    const prompt = params.prompt.map((message) => {
      if (message.role !== "assistant") {
        return message;
      }

      let reasoningText = "";
      const otherParts: typeof message.content = [];
      for (const part of message.content) {
        if (part.type === "reasoning") {
          reasoningText += part.text;
        } else {
          otherParts.push(part);
        }
      }

      if (!reasoningText) {
        return message;
      }

      const thinkPrefix = `<think>${stripReasoningTags(reasoningText)}</think>`;
      const firstTextIdx = otherParts.findIndex((part) => part.type === "text");
      if (firstTextIdx >= 0) {
        const textPart = otherParts[firstTextIdx] as { type: "text"; text: string };
        otherParts[firstTextIdx] = { ...textPart, text: thinkPrefix + textPart.text };
      } else {
        otherParts.unshift({ type: "text", text: thinkPrefix });
      }

      return { ...message, content: otherParts };
    });

    return { ...params, prompt };
  }
};

/**
 * 构造一个通用的 OpenAI 兼容 fetch。所有模型角色共用：
 * - `thinking` 非 null 时往 chat body 注入 `thinking:{type}`（DeepSeek 风格；非 DeepSeek 端点
 *   一般忽略未知字段，个别端点报错则该模型改用 vision 那套 thinking:null）
 * - 把 `<think>…</think>` 前缀（由 inlineReasoningMiddleware 塞的）抽回 `reasoning_content` 字段
 * - 回填空的后台委派 tool 结果
 * - 响应侧：录制 + SSE reasoning_content → `<think>` 改写（`finalizeReasoningResponse`）
 */
export const createGenericFetch =
  ({ record, thinking }: { record: boolean; thinking: "enabled" | "disabled" | null }) =>
  async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    const isChat = url.includes("/chat/completions");

    if (isChat && init?.body && typeof init.body === "string") {
      try {
        const body = JSON.parse(init.body);
        if (thinking) {
          body.thinking = { type: thinking };
        }

        if (Array.isArray(body.messages)) {
          body.messages = body.messages.map((msg: Record<string, unknown>) => {
            // 纯 tool_call 助理消息序列化后 content 可能缺失，补空串避免 422
            const m = msg.content === undefined ? { ...msg, content: "" } : msg;
            if (m.role !== "assistant" || typeof m.content !== "string") {
              return m;
            }
            const match = m.content.match(/^<think>([\s\S]*?)<\/think>([\s\S]*)$/);
            if (!match) {
              return m;
            }
            const [, rawReasoning, rawContent] = match;
            return {
              ...m,
              reasoning_content: stripReasoningTags(rawReasoning),
              content: stripReasoningTags(rawContent)
            };
          });

          backfillEmptyBackgroundToolResults(body.messages as WireMessage[]);
        }

        init = { ...init, body: JSON.stringify(body) };
      } catch {
        // 非 JSON body，原样放行
      }
    }

    const requestStartedAt = Date.now();
    const res = await fetch(input as RequestInfo, init);

    const contentType = res.headers.get("content-type") ?? "";
    const isStream = isChat && res.ok && !!res.body && contentType.includes("text/event-stream");

    return finalizeReasoningResponse(res, {
      url,
      requestBody: init?.body && typeof init.body === "string" ? init.body : undefined,
      isStream,
      record: record && isChat,
      requestStartedAt
    });
  };

/**
 * 配合 SSE 改写。Aihubmix / DeepSeek 等 thinking 模型把推理内容放在
 * `delta.reasoning_content` 里,这里改写成 `delta.content` 并用 `<think>...</think>`
 * 包裹,后续由 `extractReasoningMiddleware({ tagName: "think" })` 抽成 reasoning part。
 */
export const rewriteReasoningStream = (): TransformStream<Uint8Array, Uint8Array> => {
  let buffer = "";
  let inThink = false;
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const rewriteEvent = (event: string): string => {
    const lines = event.split("\n");
    const out = lines.map((line) => {
      if (!line.startsWith("data: ")) {
        return line;
      }
      const payload = line.slice(6);
      if (payload === "[DONE]") {
        return line;
      }
      try {
        const json = JSON.parse(payload) as {
          choices?: {
            delta?: { content?: string | null; reasoning_content?: string | null; reasoning?: string | null };
          }[];
        };
        const delta = json.choices?.[0]?.delta;
        if (!delta) {
          return line;
        }

        // 部分网关(如 n1n 转发 gemini)会同时下发 `reasoning` 与 `reasoning_content` 两个
        // 内容相同的镜像字段。我们只以 reasoning_content 作为思考来源,删掉冗余的 reasoning,
        // 避免下游把同一段思考重复注入。
        if ("reasoning" in delta) {
          delete delta.reasoning;
        }

        if (delta.reasoning_content != null) {
          const text = (inThink ? "" : "<think>") + delta.reasoning_content;
          delta.content = text;
          delete delta.reasoning_content;
          inThink = true;
        } else if (inThink) {
          delta.content = "</think>" + (delta.content ?? "");
          inThink = false;
        }
        return "data: " + JSON.stringify(json);
      } catch {
        return line;
      }
    });
    return out.join("\n");
  };

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const event = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        controller.enqueue(encoder.encode(rewriteEvent(event) + "\n\n"));
      }
    },
    flush(controller) {
      if (buffer) {
        controller.enqueue(encoder.encode(rewriteEvent(buffer)));
      }
    }
  });
};

/** 把上游流经 `rewriteReasoningStream` 改写后重新包成 Response，沿用原始 status / headers。 */
const pipeReasoning = (source: ReadableStream<Uint8Array>, res: Response): Response =>
  new Response(source.pipeThrough(rewriteReasoningStream()), {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers
  });

/**
 * thinking provider 响应侧的公共收尾:录制 + reasoning_content 改写。
 *
 * - `record` 为 true 且开启录制时:用 `recordExchange` tee 出客户端分支,流式则继续走
 *   reasoning 改写,非流式 / 错误直接返回原响应(录制走的是 `res.clone()`)。
 * - 未录制时:流式走 reasoning 改写,非流式原样返回。
 *
 * `record` 与 `isStream` 由各 provider 依据自身路由(chat / responses 等)自行判定后传入,
 * 以保持与原有逐 provider 的录制门控行为一致。
 */
export const finalizeReasoningResponse = (
  res: Response,
  opts: { url: string; requestBody?: string; isStream: boolean; record: boolean; requestStartedAt: number }
): Response => {
  const { url, requestBody, isStream, record, requestStartedAt } = opts;

  if (record && isLlmRecordingEnabled()) {
    const clientBranch = recordExchange({ url, requestBody, res, isStream, requestStartedAt });
    if (isStream && clientBranch) {
      return pipeReasoning(clientBranch, res);
    }
    return res;
  }

  if (!isStream) {
    return res;
  }

  return pipeReasoning(res.body!, res);
};
