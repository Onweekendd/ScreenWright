import type { UIMessage, UIMessageChunk } from "ai";

import type { AgentBISharedState } from "../../type";
import { parseChatSseStream, updateMessageById } from "../../utils";
import { DEFAULT_BATCH_INTERVAL_MS, MessageRenderSession } from "./messageRenderSession";
// 自实现的累积器：替代 ai 的 readUIMessageStream，去掉其每帧对整条消息的 structuredClone，
// 解决并发后台任务时多条流叠加深克隆导致的主线程卡顿（详见 uiMessageStream.ts 顶部说明）
import { readUIMessageStream } from "./uiMessageStream";

/**
 * 描述一次被挂起、等待用户或客户端补充信息的工具调用。
 *
 * @typeParam SP 挂起时工具提供的上下文数据类型
 * @typeParam RD 恢复工具执行时提交的数据类型
 */
export interface SuspendedToolInfo<SP = { type?: string } & Record<string, unknown>, RD = Record<string, unknown>> {
  /** 后端工具运行 ID。 */
  runId: string;
  /** 当前消息流中工具调用的唯一 ID。 */
  toolCallId: string;
  /** 工具注册名称。 */
  toolName: string;
  /** 工具挂起时交给客户端处理的数据。 */
  suspendPayload: SP;
  /** 客户端处理完成后用于恢复工具执行的数据。 */
  resumeData?: RD;
}

/**
 * 一次消息流消费过程中与外部 transform 共享的状态。
 */
export interface StreamState {
  /** 最近一次已经规范化并提交给 UI 的完整消息。 */
  finalMessage: UIMessage | null;
  /** 本轮流在 UI 消息列表中持续更新的消息 ID。 */
  currentMessageId: string;
  /** 等待恢复的工具调用；仅在工具成功挂起并取得恢复数据后存在。 */
  suspendedTool?: SuspendedToolInfo & { resumeData: Record<string, unknown> };
}

type MessageTransformFactory = (state: StreamState) => TransformStream<UIMessageChunk, UIMessageChunk>;

interface ConsumeMessageStreamOptions {
  /** 与调用方共享状态，流失败时仍能定位已显示的消息。 */
  state?: StreamState;
  /** 当前响应式消息列表。 */
  messages: AgentBISharedState["messages"];
  /** 以新数组替换响应式消息列表的统一入口。 */
  updateMessagesBy: AgentBISharedState["updateMessagesBy"];
  /** 流启动前的消息快照，用于首次追加或寻找续写目标。 */
  initialMessages?: UIMessage[];
  /** 将当前流的结果持续覆盖到指定消息 ID。 */
  mergeIntoId?: string;
  /** 中止当前流消费及其上游管线的信号。 */
  signal?: AbortSignal;
  /**
   * 是否按固定间隔合并渲染帧。每个流快照都是全量消息，因此只会跳过中间态，不会丢失内容。
   */
  batchRender?: boolean;
  /** 合帧间隔（毫秒），仅在 batchRender 为 true 时生效。 */
  batchIntervalMs?: number;
}

type ConsumeSSEResponseOptions = Omit<ConsumeMessageStreamOptions, "initialMessages">;

interface ReactiveMessageWriterOptions {
  /** 当前响应式消息列表。 */
  messages: AgentBISharedState["messages"];
  /** 以新数组替换响应式消息列表的统一入口。 */
  updateMessagesBy: AgentBISharedState["updateMessagesBy"];
  /** 续写模式下需要覆盖的既有消息 ID。 */
  mergeIntoId?: string;
  /** 当前流的共享状态。 */
  state: StreamState;
}

/**
 * 创建响应式消息列表写入函数。
 *
 * 首条消息追加到当前列表末尾；后续快照持续覆盖同一条 assistant 消息。
 * continuation 即使返回新消息 ID，也会保留 UI 中已经建立的消息 ID。
 *
 * @param options 响应式消息列表及当前流状态
 * @returns 接收规范化消息并写入响应式列表的函数
 */
function createReactiveMessageWriter({ messages, updateMessagesBy, mergeIntoId, state }: ReactiveMessageWriterOptions) {
  let isFirstMessage = true;

  const replaceMessage = (messageId: string, message: UIMessage) => {
    updateMessagesBy(() => updateMessageById(messages.value, messageId, () => message));
  };

  return (message: UIMessage) => {
    if (mergeIntoId) {
      replaceMessage(mergeIntoId, message);
      return;
    }

    if (isFirstMessage) {
      // 追加到当前列表而不是开流时的快照：开流后、首条回复前可能插进了别的消息
      // （自动压缩的摘要就在这个窗口里到达），用快照会把它冲掉
      updateMessagesBy(() => [...messages.value, message]);
      state.currentMessageId = message.id;
      isFirstMessage = false;
      return;
    }

    if (message.id === state.currentMessageId) {
      replaceMessage(state.currentMessageId, message);
      return;
    }

    // continuation / resume 可能产生新 ID，但 UI 中仍应持续更新同一条 assistant 消息。
    replaceMessage(state.currentMessageId, { ...message, id: state.currentMessageId });
  };
}

/**
 * 提供 AI 消息流的消费与 SSE 适配能力。
 *
 * 响应式消息写入保留在 composable 内；消息规范化与合帧由纯 TypeScript 的
 * {@link MessageRenderSession} 管理。
 */
export function useAgentBIStream() {
  /**
   * 消费 UIMessageChunk 流，将累积的 UIMessage 写入响应式消息列表。
   * 可用于主流和任意子流（如后台任务流）。
   *
   * @param stream - 待消费的 UIMessageChunk 可读流
   * @param transforms - TransformStream 工厂数组，按顺序链入管线，由调用方注入
   * @param options - 响应式状态及可选配置
   * @param options.messages - 当前消息列表的响应式引用
   * @param options.updateMessagesBy - 更新消息列表的函数
   * @param options.initialMessages - 流开始前的消息快照，用于查找续写时要合并的已有消息，默认为空数组
   * @param options.mergeIntoId - 若传入，将流式结果合并到该 id 对应的已有消息（续写场景）
   * @param options.signal - 用于中止流消费的 AbortSignal
   */
  const consumeMessageStream = async (
    stream: ReadableStream<UIMessageChunk>,
    transforms: MessageTransformFactory[],
    options: ConsumeMessageStreamOptions
  ): Promise<StreamState> => {
    const {
      messages,
      updateMessagesBy,
      initialMessages = [],
      mergeIntoId,
      signal,
      batchRender = false,
      batchIntervalMs = DEFAULT_BATCH_INTERVAL_MS
    } = options;
    const state: StreamState = options.state ?? { finalMessage: null, currentMessageId: mergeIntoId ?? "" };
    const writeMessage = createReactiveMessageWriter({
      messages,
      updateMessagesBy,
      mergeIntoId,
      state
    });

    const renderSession = new MessageRenderSession({
      mergeIntoId,
      batchEnabled: batchRender,
      batchIntervalMs,
      onCommit: (message) => {
        state.finalMessage = message;
        writeMessage(message);
      }
    });

    const existingMessage = mergeIntoId ? initialMessages.find((m) => m.id === mergeIntoId) : undefined;

    const processedStream = transforms.reduce<ReadableStream<UIMessageChunk>>(
      (s, factory) => s.pipeThrough(factory(state)),
      stream
    );

    // abort 时主动 cancel 流，强制让 readUIMessageStream 的异步迭代器立即中止
    // 仅检查 signal.aborted 无法及时打断：readUIMessageStream 会缓冲多个 SSE chunk 再 yield，
    // 导致循环在整条消息结束前都拿不到控制权。cancel 经 pipeThrough 向上游传播。
    const onAbort = () => processedStream.cancel().catch(() => {});
    signal?.addEventListener("abort", onAbort, { once: true });

    try {
      for await (const msg of readUIMessageStream({
        message: existingMessage,
        stream: processedStream
      })) {
        if (signal?.aborted) {
          break;
        }

        renderSession.schedule(msg);
      }
    } finally {
      renderSession.flush();
      signal?.removeEventListener("abort", onAbort);
    }

    return state;
  };

  /**
   * 解析 SSE Response 并消费其 UIMessageChunk 流，是 consumeMessageStream 的 SSE 包装层。
   *
   * 后端 per-event 语义：每个事件在一条流里只发一次，resume 是从挂起点重开（不重发历史），
   * 因此 chunk 层每个事件天然只到达一次，无需任何去重。
   *
   * @param response - 后端 SSE 流式 Response
   * @param initialMessages - 流开始前的消息列表快照，用于追加或查找待合并消息
   * @param transforms - TransformStream 工厂数组，按顺序链入 SSE 管线，由调用方注入
   * @param options - 响应式状态及可选配置，透传给 consumeMessageStream
   */
  const consumeSSEResponse = async (
    response: Response,
    initialMessages: UIMessage[],
    transforms: MessageTransformFactory[],
    options: ConsumeSSEResponseOptions
  ): Promise<StreamState> => {
    if (response.ok === false) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || body?.error || `请求失败（HTTP ${response.status}）`);
    }
    if (!response.body) {
      throw new Error("请求失败：服务器未返回响应内容。");
    }
    return consumeMessageStream(parseChatSseStream(response) as ReadableStream<UIMessageChunk>, transforms, {
      ...options,
      initialMessages
    });
  };

  return { consumeMessageStream, consumeSSEResponse };
}
