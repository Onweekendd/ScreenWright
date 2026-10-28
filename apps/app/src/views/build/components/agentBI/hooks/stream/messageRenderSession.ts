import type { UIMessage } from "ai";

type MessagePart = UIMessage["parts"][number];

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

export const DEFAULT_BATCH_INTERVAL_MS = 500;

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
    // 后台工具的首次回执只是占位，完成时仍会替换 output，不能提前冻结渲染引用。
    const output = (part as { output?: unknown }).output;
    const isBackgroundPlaceholder = typeof output === "string" && /^Background task started/.test(output);
    return state === "output-available" && !(part as { preliminary?: boolean }).preliminary && !isBackgroundPlaceholder;
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
 * 单条流的渲染会话。只管理普通 TypeScript 状态，不依赖 Vue 响应式对象。
 *
 * 流累积器会就地修改同一个消息引用；会话在提交时将它转换为引用稳定的渲染快照。
 * 首帧立即提交，后续帧可按固定窗口只提交最新的全量快照。
 */
export class MessageRenderSession {
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
