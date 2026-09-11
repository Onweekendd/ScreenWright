import type { UIMessage, UIMessageChunk } from "ai";

import type { AgentBISharedState } from "../type";
import { parseChatSseStream, updateMessageById } from "../utils";
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

type MessagePart = UIMessage["parts"][number];
type MessageTransformFactory = (state: StreamState) => TransformStream<UIMessageChunk, UIMessageChunk>;

interface ConsumeMessageStreamOptions {
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
  /** 流开始前固定的消息列表快照。 */
  initialMessages: UIMessage[];
  /** 续写模式下需要覆盖的既有消息 ID。 */
  mergeIntoId?: string;
  /** 当前流的共享状态。 */
  state: StreamState;
}

/**
 * 纯 TypeScript 渲染会话的配置，不包含任何 Vue 响应式类型。
 */
interface MessageRenderSessionOptions {
  /** 规范化消息时强制使用的既有消息 ID。 */
  mergeIntoId?: string;
  /** 是否合并首帧之后的高频渲染帧。 */
  batchEnabled: boolean;
  /** 合帧提交间隔，单位为毫秒。 */
  batchIntervalMs: number;
  /** 每次产生可渲染消息快照时触发。 */
  onCommit: (message: UIMessage) => void;
}

const DEFAULT_BATCH_INTERVAL_MS = 500;

/**
 * 过滤已经结束且内容为空白的文本 part，避免 UI 渲染空行。
 *
 * 流式中的空文本可能马上收到 delta，因此必须保留。
 *
 * @param parts 待过滤的消息 parts
 * @returns 保留有效内容后的新 parts 数组
 */
function filterEmptyTextParts(parts: UIMessage["parts"]) {
  return parts.filter((part) => {
    if (part.type !== "text") {
      return true;
    }
    if ("state" in part && part.state === "streaming") {
      return true;
    }
    return !!part.text?.trim();
  });
}

/**
 * 已定型的 part 不会再变化，可以永久复用渲染引用。
 * 判断应保持保守：漏判只会多一次比较，误判会漏掉后续更新。
 *
 * @param part 待判断的消息 part
 * @returns 内容是否已经进入不可变的终态
 */
function isMessagePartFinalized(part: MessagePart): boolean {
  const { type } = part;
  const state = (part as { state?: string }).state;

  if (type === "text" || type === "reasoning") {
    return state === "done";
  }

  if (type.startsWith("tool-") || type === "dynamic-tool") {
    if (state === "output-error" || state === "output-denied") {
      return true;
    }
    return state === "output-available" && !(part as { preliminary?: boolean }).preliminary;
  }

  return type === "step-start" || type === "file" || type.startsWith("source-");
}

/**
 * 浅比较 part 的全部可枚举字段。流累积器只会替换一级字段值，浅比较足以捕捉可见变化。
 *
 * @param left 上一次提交给 UI 的 part 快照
 * @param right 当前由流累积器维护的 part
 * @returns 两个 part 的一级字段和值是否相同
 */
function areMessagePartsShallowEqual(left: MessagePart, right: MessagePart): boolean {
  if (left === right) {
    return true;
  }

  const leftRecord = left as Record<PropertyKey, unknown>;
  const rightRecord = right as Record<PropertyKey, unknown>;
  let leftFieldCount = 0;
  let rightFieldCount = 0;

  for (const key in leftRecord) {
    leftFieldCount++;
    if (leftRecord[key] !== rightRecord[key]) {
      return false;
    }
  }
  for (const _key in rightRecord) {
    rightFieldCount++;
  }

  return leftFieldCount === rightFieldCount;
}

/**
 * 为单个 part 生成引用稳定的渲染快照。
 *
 * 新 part 或内容发生变化的 part 会浅拷贝；已定型或未变化的 part 复用上一帧引用。
 *
 * @param previous 上一次提交给 UI 的 part，不存在时表示当前 part 首次出现
 * @param current 流累积器当前维护的 part
 * @returns 可安全交给 Vue 进行引用比较的 part
 */
function stabilizeMessagePart(previous: MessagePart | undefined, current: MessagePart): MessagePart {
  if (!previous) {
    return { ...current };
  }
  if (isMessagePartFinalized(previous) || areMessagePartsShallowEqual(previous, current)) {
    return previous;
  }
  return { ...current };
}

/**
 * 创建响应式消息列表写入函数。
 *
 * 首条消息追加到初始快照；后续快照持续覆盖同一条 assistant 消息。
 * continuation 即使返回新消息 ID，也会保留 UI 中已经建立的消息 ID。
 *
 * @param options 响应式消息列表、初始快照及当前流状态
 * @returns 接收规范化消息并写入响应式列表的函数
 */
function createReactiveMessageWriter({
  messages,
  updateMessagesBy,
  initialMessages,
  mergeIntoId,
  state
}: ReactiveMessageWriterOptions) {
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
      updateMessagesBy(() => [...initialMessages, message]);
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
 * 单条流的渲染会话。只管理普通 TypeScript 状态，不依赖 Vue 响应式对象。
 *
 * 流累积器会就地修改同一个消息引用；会话在提交时将它转换为引用稳定的渲染快照。
 * 首帧立即提交，后续帧可按固定窗口只提交最新的全量快照。
 */
class MessageRenderSession {
  private previousParts: UIMessage["parts"] = [];
  private isFirstFrame = true;
  private pendingMessage: UIMessage | null = null;
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: MessageRenderSessionOptions) {}

  /**
   * 接收流累积器产生的全量消息快照。
   *
   * 首帧立即提交；开启合帧后，后续调用只保留当前时间窗口中的最新快照。
   *
   * @param message 流累积器持续就地修改的原始消息
   */
  schedule(message: UIMessage) {
    if (!this.options.batchEnabled || this.isFirstFrame) {
      this.commit(message);
      this.isFirstFrame = false;
      return;
    }

    this.pendingMessage = message;
    if (this.timerId !== null) {
      return;
    }

    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.commitPending();
    }, this.options.batchIntervalMs);
  }

  /**
   * 取消等待中的定时提交，并立即提交最后一帧。
   *
   * 应在流正常结束、中止或异常退出时调用，避免最后一个合帧窗口丢失。
   */
  flush() {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.commitPending();
  }

  /**
   * 将原始消息转换为渲染快照并交给会话调用方。
   *
   * @param rawMessage 流累积器维护的原始消息
   */
  private commit(rawMessage: UIMessage) {
    this.options.onCommit(this.normalize(rawMessage));
  }

  /**
   * 生成引用稳定的消息快照，使下游可以用 part 引用跳过未变化内容的渲染。
   *
   * @param rawMessage 流累积器维护的原始消息
   * @returns 可写入 UI 状态的消息快照
   */
  private normalize(rawMessage: UIMessage): UIMessage {
    const stableParts = rawMessage.parts.map((part, index) => stabilizeMessagePart(this.previousParts[index], part));
    this.previousParts = stableParts;

    return {
      ...rawMessage,
      ...(this.options.mergeIntoId ? { id: this.options.mergeIntoId } : {}),
      parts: filterEmptyTextParts(stableParts)
    };
  }

  /**
   * 提交当前合帧窗口中最后收到的消息，并清空待提交状态。
   */
  private commitPending() {
    if (!this.pendingMessage) {
      return;
    }
    this.commit(this.pendingMessage);
    this.pendingMessage = null;
  }
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
   * @param options.initialMessages - 流开始前的消息快照，用于首条消息追加，默认为空数组
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
    const state: StreamState = { finalMessage: null, currentMessageId: mergeIntoId ?? "" };
    const writeMessage = createReactiveMessageWriter({
      messages,
      updateMessagesBy,
      initialMessages,
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
    return consumeMessageStream(parseChatSseStream(response) as ReadableStream<UIMessageChunk>, transforms, {
      ...options,
      initialMessages
    });
  };

  return { consumeMessageStream, consumeSSEResponse };
}
