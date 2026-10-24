import type { MastraDBMessage } from "@mastra/core/agent";
import type { Processor, ProcessorMessageContext } from "@mastra/core/processors";

import { MAX_TOOL_IMAGES, TOOL_IMAGES_FIELD, type ToolImage } from "../provider/image-middleware";
import { storage } from "../storage/storage";

/**
 * 后台任务（`background: { enabled: true }` 的工具，如生图、生视频）跑完后，Mastra 会开一轮「续接」，
 * 并在末尾注入一条 user 消息（`buildContinuationDirective`，@mastra/core 1.66 的文案）：
 *   "IMPORTANT: The following tool-call IDs completed successfully: call_a (createImageTool).
 *    Their results are now in the conversation. Do not call the same tool again — …"
 *
 * 这条消息**只有任务 id，没有结果**，结果要模型自己去更早的消息里找：Mastra 会把当初那条
 * 「Background task started」的占位原地替换成真实结果。模型看到的新信息只有这句「完成了」，
 * 很容易找不到、或者以为结果就是一句话（实测：书法层结果明明在历史里，模型还是去 search_tools 里翻）；
 * 而服务重启过的任务，占位根本没被替换，历史里压根没有结果。
 *
 * 这里在续接轮每一步模型调用前，把结果直接写进这条提示里。结果取自后台任务表（权威来源，
 * 不依赖那次原地替换），取不到再退回历史里已替换的 tool-invocation。
 *
 * 必须挂在 processInputStep 上：续接指令走 `context` 来源、不在用户本轮输入里，processInput 看不到。
 * processInputStep 每一步都会跑，所以改写要幂等（见 NOTE_MARKER）。
 * 改写后仍以 `context` 来源放回——它只给模型看、不落库，不会污染之后的对话。
 */
const COMPLETED_RE = /tool-call IDs completed successfully:\s*(.*?)\.\s+Their results are now/s;
const FAILED_RE = /tool-call IDs failed:\s*(.*?)\.\s+Their failure information/s;

/** 已经补过结果的标记：每一步都会再跑一遍，见到它就说明这条改写过了 */
const NOTE_MARKER = "〔后台任务结果〕";

/** 单个结果摘要的长度上限：url、id、尺寸这些关键信息在前面，超出的部分没有用 */
const MAX_RESULT_CHARS = 1200;

export interface BackgroundTaskOutcome {
  status: string;
  result?: unknown;
  error?: { message?: string } | string | null;
}

/** 按 toolCallId 查后台任务的终态；查不到返回 null */
export type BackgroundTaskLookup = (toolCallId: string) => Promise<BackgroundTaskOutcome | null>;

export const lookupBackgroundTaskInStorage: BackgroundTaskLookup = async (toolCallId) => {
  const store = await storage.getStore("backgroundTasks");
  if (!store) {
    return null;
  }
  const { tasks } = await store.listTasks({ toolCallId, orderBy: "createdAt", orderDirection: "desc", perPage: 1 });
  const task = tasks[0];
  return task ? { status: task.status, result: task.result, error: task.error } : null;
};

interface Entry {
  toolCallId: string;
  toolName?: string;
}

/** "call_a (createImageTool), call_b (createVideoTool)" → 条目列表 */
export function parseEntries(list: string): Entry[] {
  return list
    .split(/,\s*/)
    .map((item) => /^(\S+)(?:\s+\((.+)\))?$/.exec(item.trim()))
    .flatMap((match) => (match ? [{ toolCallId: match[1], toolName: match[2] }] : []));
}

const truncate = (text: string) =>
  text.length > MAX_RESULT_CHARS ? `${text.slice(0, MAX_RESULT_CHARS)}…（已截断）` : text;

const parseResult = (result: unknown): unknown => {
  if (typeof result !== "string") {
    return result;
  }
  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
};

/**
 * 结果里要给模型「看」的图（`imagesForModel`）。只给 url 文本模型是看不懂的——
 * 它们得作为图片 file part 附在消息上，由 image-middleware 读成二进制再发给模型。
 */
export function imagesOfResult(result: unknown): ToolImage[] {
  const images = (parseResult(result) as Record<string, unknown> | null)?.[TOOL_IMAGES_FIELD];
  if (!Array.isArray(images)) {
    return [];
  }
  return images.filter(
    (image): image is ToolImage =>
      typeof image?.url === "string" && /^https?:\/\//i.test(image.url) && typeof image?.label === "string"
  );
}

/**
 * 结果 → 给模型看的一段文字。生图 / 生视频的结果里 `imagesForModel` 的图片本身另外作为图片附上，
 * 同一张图的 url 已经在顶层 `url` 里，这里只留下它的说明（实际尺寸等），别把 url 重复一遍。
 */
export function summarizeResult(result: unknown): string {
  const value = parseResult(result);
  if (typeof value === "string") {
    return truncate(value);
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const { [TOOL_IMAGES_FIELD]: images, ...rest } = value as Record<string, unknown>;
    const labels = Array.isArray(images)
      ? images.flatMap((image) =>
          (image as { label?: unknown })?.label ? [String((image as { label: unknown }).label)] : []
        )
      : [];
    return truncate(JSON.stringify(labels.length > 0 ? { ...rest, imageNotes: labels } : rest));
  }
  return truncate(JSON.stringify(value ?? null));
}

const errorMessage = (error: BackgroundTaskOutcome["error"]): string =>
  (typeof error === "string" ? error : error?.message) || "未知错误";

/** 历史里被 Mastra 原地替换过的真实结果；还是占位（没替换）就当没有 */
export function resultFromHistory(messages: MastraDBMessage[], toolCallId: string): unknown {
  for (const message of messages) {
    for (const part of message.content?.parts ?? []) {
      if (part.type !== "tool-invocation") {
        continue;
      }
      const invocation = part.toolInvocation;
      if (invocation.toolCallId !== toolCallId || invocation.state !== "result") {
        continue;
      }
      const isPlaceholder =
        typeof invocation.result === "string" && /^\[?后台任务|^Background task started/.test(invocation.result);
      return isPlaceholder ? undefined : invocation.result;
    }
  }
  return undefined;
}

interface Described {
  line: string;
  images: ToolImage[];
}

const describeCompleted = async (
  { toolCallId, toolName }: Entry,
  lookup: BackgroundTaskLookup,
  messages: MastraDBMessage[]
): Promise<Described> => {
  const label = `${toolName ?? "未知工具"}（${toolCallId}）`;
  const task = await lookup(toolCallId).catch(() => null);
  const result = task?.result ?? resultFromHistory(messages, toolCallId);
  if (result === undefined || result === null) {
    return {
      line: `- ${label} 已完成，但没能取回结果内容。不要重复调用，告诉用户结果没取到，让用户去素材库 / 画布上确认。`,
      images: []
    };
  }
  return { line: `- ${label} 已完成，结果：${summarizeResult(result)}`, images: imagesOfResult(result) };
};

const describeFailed = async ({ toolCallId, toolName }: Entry, lookup: BackgroundTaskLookup): Promise<Described> => {
  const task = await lookup(toolCallId).catch(() => null);
  return { line: `- ${toolName ?? "未知工具"}（${toolCallId}）失败：${errorMessage(task?.error)}`, images: [] };
};

export interface RewrittenDirective {
  text: string;
  /** 要附在这条消息后面给模型看的图（最近 MAX_TOOL_IMAGES 张，和工具图的上限一致） */
  images: ToolImage[];
}

/** 返回 null 表示不用改写：不是续接指令、已经改写过、或这批里没有完成 / 失败项 */
export async function rewriteDirectiveText(
  text: string,
  lookup: BackgroundTaskLookup,
  messages: MastraDBMessage[]
): Promise<RewrittenDirective | null> {
  if (text.includes(NOTE_MARKER)) {
    return null;
  }
  const completed = parseEntries(COMPLETED_RE.exec(text)?.[1] ?? "");
  const failed = parseEntries(FAILED_RE.exec(text)?.[1] ?? "");
  if (completed.length === 0 && failed.length === 0) {
    return null;
  }
  const described = await Promise.all([
    ...completed.map((entry) => describeCompleted(entry, lookup, messages)),
    ...failed.map((entry) => describeFailed(entry, lookup))
  ]);
  const images = described.flatMap((item) => item.images).slice(-MAX_TOOL_IMAGES);
  const imageNote =
    images.length > 0
      ? [
          `生成的图片已按顺序附在本条消息后面，你可以直接看：${images.map((image, i) => `[${i + 1}] ${image.label}`).join("；")}`
        ]
      : [];
  return {
    text: [
      text.trim(),
      NOTE_MARKER,
      ...described.map((item) => item.line),
      "以上就是这些后台任务的返回内容，要用其中的 url / id 直接取用，不要重复调用同一个工具，也不要再去别处找结果。",
      ...imageNote
    ].join("\n"),
    images
  };
}

/** 按扩展名给出具体的图片类型：通配的 image/* 在 Mastra 先把 url 下载成字节之后不会再被改写，直接发给服务商可能被拒 */
export const imageMimeOf = (url: string): string => {
  const ext = /\.([a-z0-9]{2,5})(?:\?|#|$)/i.exec(url)?.[1]?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") {
    return "image/jpeg";
  }
  return ext === "webp" ? "image/webp" : "image/png";
};

const textOf = (message: MastraDBMessage): string =>
  (message.content?.parts ?? []).map((part) => (part.type === "text" ? part.text : "")).join("");

/**
 * 「挂起还没回执」的前台工具调用，如 createComponentTool：它把操作交给前端执行，前端回传后才有结果。
 * 回传（resume 轮）要排在当前这一轮之后，而这一轮会一直开着等后台任务——期间每个后台任务完成都会开一轮续接。
 *
 * Mastra 构造给模型的历史时，会把没有结果的 tool-call 整个过滤掉，续接轮里的模型就看不见自己刚调过，
 * 于是再调一次、再挂起一次（实测：同一批标题组件连调 3 次，前端画布上留下重复的幽灵组件）。
 * 这里把这些调用以文字补回去，让模型知道「已提交、结果没回来」，不要重复。
 */
const PENDING_MARKER = "〔待回传的工具调用〕";

/** 单个调用入参摘要的长度上限：够模型认出是哪一批操作即可 */
const MAX_ARGS_CHARS = 300;

export interface PendingCall {
  toolCallId: string;
  toolName: string;
  args: unknown;
}

/** 历史里挂起了、还没有结果的调用：状态仍是 call，且所在消息的元数据登记了它是挂起的 */
export function pendingSuspendedCalls(messages: MastraDBMessage[]): PendingCall[] {
  return messages.flatMap((message) => {
    const suspended = (message.content?.metadata as { suspendedTools?: Record<string, unknown> } | undefined)
      ?.suspendedTools;
    if (!suspended) {
      return [];
    }
    return (message.content.parts ?? []).flatMap((part) => {
      if (part.type !== "tool-invocation" || part.toolInvocation.state !== "call") {
        return [];
      }
      const { toolCallId, toolName, args } = part.toolInvocation;
      return toolCallId in suspended ? [{ toolCallId, toolName, args }] : [];
    });
  });
}

export function pendingCallsNote(calls: PendingCall[]): string {
  const lines = calls.map((call) => {
    const args = JSON.stringify(call.args ?? {});
    const shown = args.length > MAX_ARGS_CHARS ? `${args.slice(0, MAX_ARGS_CHARS)}…` : args;
    return `- ${call.toolName}（${call.toolCallId}）入参：${shown}`;
  });
  return [
    PENDING_MARKER,
    "下面这些调用你已经发出，现在交给前端执行了，执行结果还没有回传。它们不在上面的对话记录里，但确实发生过：",
    ...lines,
    "不要重复发起同样的调用——重复会在画布上留下重复的组件。结果回来之后你会在对话里看到；",
    "如果现在要做别的事就继续做别的，或者先结束这一轮；要确认它们是否生效，到工作区里读对应文件，不要凭感觉重试。"
  ].join("\n");
}

/** 把「待回传」说明作为 context 消息放进这一步；上一步放过的先撤掉，状态可能已经变了 */
function syncPendingNote(messageList: ProcessorMessageContext["messageList"], messages: MastraDBMessage[]): void {
  const stale = messages.filter((message) => message.role === "user" && textOf(message).startsWith(PENDING_MARKER));
  const pending = pendingSuspendedCalls(messages);
  if (stale.length > 0) {
    messageList.removeByIds(stale.map((message) => message.id));
  }
  if (pending.length > 0) {
    messageList.add([{ role: "user", content: pendingCallsNote(pending) }], "context");
  }
}

export class InlineBackgroundTaskResults implements Processor {
  id = "inline-background-task-results";

  constructor(private readonly lookup: BackgroundTaskLookup = lookupBackgroundTaskInStorage) {}

  async processInputStep({ messageList }: ProcessorMessageContext) {
    syncPendingNote(messageList, messageList.get.all.db());
    const all = messageList.get.all.db();
    for (const message of all) {
      if (message.role !== "user" || !textOf(message).includes("IMPORTANT: The following tool-call IDs")) {
        continue;
      }
      const images: ToolImage[] = [];
      const parts = message.content.parts.map(async (part) => {
        if (part.type !== "text") {
          return part;
        }
        const rewritten = await rewriteDirectiveText(part.text, this.lookup, all);
        if (rewritten === null) {
          return part;
        }
        images.push(...rewritten.images);
        return { ...part, text: rewritten.text };
      });
      const textParts = await Promise.all(parts);
      if (textParts.every((part, index) => part === message.content.parts[index])) {
        continue;
      }
      // 图片作为 file part 附在后面：image-middleware 会把本系统的图读成二进制，模型才真的看得见
      const newParts = [
        ...textParts,
        ...images.map((image) => ({ type: "file" as const, data: image.url, mimeType: imageMimeOf(image.url) }))
      ];
      // 以 context 来源放回：只给模型看，不落库
      messageList.removeByIds([message.id]);
      messageList.add({ ...message, content: { ...message.content, parts: newParts } }, "context");
    }
    return messageList;
  }
}
