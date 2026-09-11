/**
 * 自实现的 UIMessageChunk → UIMessage 累积器，移植自 ai@6 的
 * readUIMessageStream + processUIMessageStream + createStreamingUIMessageState。
 *
 * 为什么自己实现：
 *   1. ai 的 readUIMessageStream 每处理一个 chunk 都对【整条累积消息】做一次 structuredClone
 *      （见 ai/dist/index.mjs 的 `write: () => controller.enqueue(structuredClone(state.message))`）。
 *      那是为 React 不可变 diff 设计的——每帧给一份全新快照，React 才能靠引用判断变化。
 *      但消息越长，单次深克隆越贵，N 个 chunk 累成 O(N²)；并发多个后台任务时多条流叠加，
 *      主线程被同步深克隆占满，表现为"开两个子任务就越跑越卡"。
 *   2. 我们是 Vue：已用 shallowRef + normalizeForRender 自己管理引用稳定性，
 *      根本不需要 SDK 每帧深克隆。每帧直接复用同一 state.message 引用即可，把克隆成本从 O(消息体积) 降到 O(1)。
 *   3. 核心状态机 processUIMessageStream / createStreamingUIMessageState 在 ai 里未公开导出，
 *      无法 import；与其 patch 第三方包，不如把这段纯逻辑搬进自己仓库，整条数据流可断点、可排查。
 *
 * 与原版差异（仅此一处行为差异 + 若干裁剪）：
 *   - write 不再 structuredClone，直接交出 state.message 引用【关键】。
 *     因此消费方必须【同步】取用每帧 msg（读取所需字段后不可异步持有原始引用），
 *     因为下一个 chunk 会继续就地 mutate 同一个 message 对象。useAgentBIStream 的 normalizeForRender 满足此约束。
 *   - 我们从不传 messageMetadataSchema / dataPartSchemas / onToolCall / onData，
 *     故移除了对应的 zod 校验（validateTypes）与回调分支，依赖收敛到 ai 公开导出 + 两个内联小工具。
 *   - chunk 类型处理逻辑与原版逐 case 对齐，未做任何协议层改动。
 */
import type { UIMessage, UIMessageChunk } from "ai";
import { getStaticToolName, isStaticToolUIPart, isToolUIPart, parsePartialJson, UIMessageStreamError } from "ai";

/** 流式累积过程中的可变状态，等价于 ai 的 StreamingUIMessageState */
interface StreamingUIMessageState {
  /** 持续被就地 mutate 的累积消息；每帧 write 直接交出此引用（不克隆） */
  message: UIMessage;
  /** 按 chunk.id 索引当前正在流式的 text part，便于 text-delta 追加 */
  activeTextParts: Record<string, { type: "text"; text: string; state: string; providerMetadata?: unknown }>;
  /** 按 chunk.id 索引当前正在流式的 reasoning part */
  activeReasoningParts: Record<string, { type: "reasoning"; text: string; state: string; providerMetadata?: unknown }>;
  /** 按 toolCallId 暂存正在累积 input JSON 的工具调用 */
  partialToolCalls: Record<
    string,
    { text: string; toolName: string; index: number; dynamic?: boolean; title?: string }
  >;
  /** 最终 finishReason，仅记录用 */
  finishReason?: string;
}

/** 浅判断是否 data-* 类型 chunk（内联自 ai 内部 isDataUIMessageChunk） */
function isDataUIMessageChunk(chunk: { type: string }): boolean {
  return chunk.type.startsWith("data-");
}

/** 深合并两个对象（内联自 ai 内部 mergeObjects），用于 message.metadata 合并 */
function mergeObjects(base: any, overrides: any): any {
  if (base === undefined && overrides === undefined) {
    return undefined;
  }
  if (base === undefined) {
    return overrides;
  }
  if (overrides === undefined) {
    return base;
  }
  const result: any = { ...base };
  for (const key in overrides) {
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      const overridesValue = overrides[key];
      if (overridesValue === undefined) {
        continue;
      }
      const baseValue = key in base ? base[key] : undefined;
      const isSourceObject =
        overridesValue !== null &&
        typeof overridesValue === "object" &&
        !Array.isArray(overridesValue) &&
        !(overridesValue instanceof Date) &&
        !(overridesValue instanceof RegExp);
      const isTargetObject =
        baseValue !== null &&
        baseValue !== undefined &&
        typeof baseValue === "object" &&
        !Array.isArray(baseValue) &&
        !(baseValue instanceof Date) &&
        !(baseValue instanceof RegExp);
      result[key] = isSourceObject && isTargetObject ? mergeObjects(baseValue, overridesValue) : overridesValue;
    }
  }
  return result;
}

/** 初始化累积状态：续写时复用传入的 assistant 消息，否则新建空消息 */
function createStreamingUIMessageState(lastMessage?: UIMessage): StreamingUIMessageState {
  return {
    message:
      lastMessage?.role === "assistant"
        ? lastMessage
        : ({ id: lastMessage?.id ?? "", metadata: undefined, role: "assistant", parts: [] } as UIMessage),
    activeTextParts: {},
    activeReasoningParts: {},
    partialToolCalls: {}
  };
}

/**
 * 把 UIMessageChunk 流逐 chunk 折叠进 state.message，并在每次产生可见更新时调用 write()。
 * 返回的流原样透传 chunk（仅用于驱动 transform 推进），消息更新由 write 回调外发。
 */
function processUIMessageStream(options: {
  stream: ReadableStream<UIMessageChunk>;
  runUpdateMessageJob: (
    job: (ctx: { state: StreamingUIMessageState; write: () => void }) => Promise<void>
  ) => Promise<void>;
  onError?: (error: unknown) => void;
}): ReadableStream<UIMessageChunk> {
  const { stream, runUpdateMessageJob, onError } = options;
  return stream.pipeThrough(
    new TransformStream<UIMessageChunk, UIMessageChunk>({
      async transform(chunk: any, controller) {
        await runUpdateMessageJob(async ({ state, write }) => {
          const parts = state.message.parts as any[];

          function getToolInvocation(toolCallId: string): any {
            const toolInvocation = (parts.filter(isToolUIPart) as any[]).find(
              (invocation) => invocation.toolCallId === toolCallId
            );
            if (toolInvocation == null) {
              throw new UIMessageStreamError({
                chunkType: "tool-invocation",
                chunkId: toolCallId,
                message: `No tool invocation found for tool call ID "${toolCallId}".`
              } as any);
            }
            return toolInvocation;
          }

          function updateToolPart(opts: any): void {
            const part: any = parts.find((p) => isStaticToolUIPart(p) && p.toolCallId === opts.toolCallId);
            if (part != null) {
              part.state = opts.state;
              part.input = opts.input;
              part.output = opts.output;
              part.errorText = opts.errorText;
              part.rawInput = opts.rawInput;
              part.preliminary = opts.preliminary;
              if (opts.title !== undefined) {
                part.title = opts.title;
              }
              part.providerExecuted = opts.providerExecuted ?? part.providerExecuted;
              if (opts.providerMetadata != null) {
                part.callProviderMetadata = opts.providerMetadata;
              }
            } else {
              parts.push({
                type: `tool-${opts.toolName}`,
                toolCallId: opts.toolCallId,
                state: opts.state,
                title: opts.title,
                input: opts.input,
                output: opts.output,
                rawInput: opts.rawInput,
                errorText: opts.errorText,
                providerExecuted: opts.providerExecuted,
                preliminary: opts.preliminary,
                ...(opts.providerMetadata != null ? { callProviderMetadata: opts.providerMetadata } : {})
              });
            }
          }

          function updateDynamicToolPart(opts: any): void {
            const part: any = parts.find((p) => p.type === "dynamic-tool" && p.toolCallId === opts.toolCallId);
            if (part != null) {
              part.state = opts.state;
              part.toolName = opts.toolName;
              part.input = opts.input;
              part.output = opts.output;
              part.errorText = opts.errorText;
              part.rawInput = opts.rawInput ?? part.rawInput;
              part.preliminary = opts.preliminary;
              if (opts.title !== undefined) {
                part.title = opts.title;
              }
              part.providerExecuted = opts.providerExecuted ?? part.providerExecuted;
              if (opts.providerMetadata != null) {
                part.callProviderMetadata = opts.providerMetadata;
              }
            } else {
              parts.push({
                type: "dynamic-tool",
                toolName: opts.toolName,
                toolCallId: opts.toolCallId,
                state: opts.state,
                input: opts.input,
                output: opts.output,
                errorText: opts.errorText,
                preliminary: opts.preliminary,
                providerExecuted: opts.providerExecuted,
                title: opts.title,
                ...(opts.providerMetadata != null ? { callProviderMetadata: opts.providerMetadata } : {})
              });
            }
          }

          function updateMessageMetadata(metadata: any): void {
            if (metadata != null) {
              state.message.metadata = (
                state.message.metadata != null ? mergeObjects(state.message.metadata, metadata) : metadata
              ) as UIMessage["metadata"];
            }
          }

          switch (chunk.type) {
            case "text-start": {
              const textPart = {
                type: "text" as const,
                text: "",
                providerMetadata: chunk.providerMetadata,
                state: "streaming"
              };
              state.activeTextParts[chunk.id] = textPart;
              parts.push(textPart);
              write();
              break;
            }
            case "text-delta": {
              const textPart = state.activeTextParts[chunk.id];
              if (textPart == null) {
                throw new UIMessageStreamError({
                  chunkType: "text-delta",
                  chunkId: chunk.id,
                  message: `Received text-delta for missing text part with ID "${chunk.id}". Ensure a "text-start" chunk is sent before any "text-delta" chunks.`
                } as any);
              }
              textPart.text += chunk.delta;
              textPart.providerMetadata = chunk.providerMetadata ?? textPart.providerMetadata;
              write();
              break;
            }
            case "text-end": {
              const textPart = state.activeTextParts[chunk.id];
              if (textPart == null) {
                throw new UIMessageStreamError({
                  chunkType: "text-end",
                  chunkId: chunk.id,
                  message: `Received text-end for missing text part with ID "${chunk.id}". Ensure a "text-start" chunk is sent before any "text-end" chunks.`
                } as any);
              }
              textPart.state = "done";
              textPart.providerMetadata = chunk.providerMetadata ?? textPart.providerMetadata;
              delete state.activeTextParts[chunk.id];
              write();
              break;
            }
            case "reasoning-start": {
              const reasoningPart = {
                type: "reasoning" as const,
                text: "",
                providerMetadata: chunk.providerMetadata,
                state: "streaming"
              };
              state.activeReasoningParts[chunk.id] = reasoningPart;
              parts.push(reasoningPart);
              write();
              break;
            }
            case "reasoning-delta": {
              const reasoningPart = state.activeReasoningParts[chunk.id];
              if (reasoningPart == null) {
                throw new UIMessageStreamError({
                  chunkType: "reasoning-delta",
                  chunkId: chunk.id,
                  message: `Received reasoning-delta for missing reasoning part with ID "${chunk.id}". Ensure a "reasoning-start" chunk is sent before any "reasoning-delta" chunks.`
                } as any);
              }
              reasoningPart.text += chunk.delta;
              reasoningPart.providerMetadata = chunk.providerMetadata ?? reasoningPart.providerMetadata;
              write();
              break;
            }
            case "reasoning-end": {
              const reasoningPart = state.activeReasoningParts[chunk.id];
              if (reasoningPart == null) {
                throw new UIMessageStreamError({
                  chunkType: "reasoning-end",
                  chunkId: chunk.id,
                  message: `Received reasoning-end for missing reasoning part with ID "${chunk.id}". Ensure a "reasoning-start" chunk is sent before any "reasoning-end" chunks.`
                } as any);
              }
              reasoningPart.providerMetadata = chunk.providerMetadata ?? reasoningPart.providerMetadata;
              reasoningPart.state = "done";
              delete state.activeReasoningParts[chunk.id];
              write();
              break;
            }
            case "file": {
              parts.push({ type: "file", mediaType: chunk.mediaType, url: chunk.url });
              write();
              break;
            }
            case "source-url": {
              parts.push({
                type: "source-url",
                sourceId: chunk.sourceId,
                url: chunk.url,
                title: chunk.title,
                providerMetadata: chunk.providerMetadata
              });
              write();
              break;
            }
            case "source-document": {
              parts.push({
                type: "source-document",
                sourceId: chunk.sourceId,
                mediaType: chunk.mediaType,
                title: chunk.title,
                filename: chunk.filename,
                providerMetadata: chunk.providerMetadata
              });
              write();
              break;
            }
            case "tool-input-start": {
              const toolInvocations = parts.filter(isStaticToolUIPart);
              state.partialToolCalls[chunk.toolCallId] = {
                text: "",
                toolName: chunk.toolName,
                index: toolInvocations.length,
                dynamic: chunk.dynamic,
                title: chunk.title
              };
              const shared = {
                toolCallId: chunk.toolCallId,
                toolName: chunk.toolName,
                state: "input-streaming",
                input: undefined,
                providerExecuted: chunk.providerExecuted,
                title: chunk.title,
                providerMetadata: chunk.providerMetadata
              };
              if (chunk.dynamic) {
                updateDynamicToolPart(shared);
              } else {
                updateToolPart(shared);
              }
              write();
              break;
            }
            case "tool-input-delta": {
              const partialToolCall = state.partialToolCalls[chunk.toolCallId];
              if (partialToolCall == null) {
                throw new UIMessageStreamError({
                  chunkType: "tool-input-delta",
                  chunkId: chunk.toolCallId,
                  message: `Received tool-input-delta for missing tool call with ID "${chunk.toolCallId}". Ensure a "tool-input-start" chunk is sent before any "tool-input-delta" chunks.`
                } as any);
              }
              partialToolCall.text += chunk.inputTextDelta;
              const { value: partialArgs } = await parsePartialJson(partialToolCall.text);
              const shared = {
                toolCallId: chunk.toolCallId,
                toolName: partialToolCall.toolName,
                state: "input-streaming",
                input: partialArgs,
                title: partialToolCall.title
              };
              if (partialToolCall.dynamic) {
                updateDynamicToolPart(shared);
              } else {
                updateToolPart(shared);
              }
              write();
              break;
            }
            case "tool-input-available": {
              const shared = {
                toolCallId: chunk.toolCallId,
                toolName: chunk.toolName,
                state: "input-available",
                input: chunk.input,
                providerExecuted: chunk.providerExecuted,
                providerMetadata: chunk.providerMetadata,
                title: chunk.title
              };
              if (chunk.dynamic) {
                updateDynamicToolPart(shared);
              } else {
                updateToolPart(shared);
              }
              write();
              // 注：原版此处可触发 onToolCall 回调，我们不使用客户端工具自动执行回调，故省略。
              break;
            }
            case "tool-input-error": {
              const existingPart: any = (parts.filter(isToolUIPart) as any[]).find(
                (p) => p.toolCallId === chunk.toolCallId
              );
              const isDynamic = existingPart != null ? existingPart.type === "dynamic-tool" : !!chunk.dynamic;
              if (isDynamic) {
                updateDynamicToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  state: "output-error",
                  input: chunk.input,
                  errorText: chunk.errorText,
                  providerExecuted: chunk.providerExecuted,
                  providerMetadata: chunk.providerMetadata
                });
              } else {
                updateToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: chunk.toolName,
                  state: "output-error",
                  input: undefined,
                  rawInput: chunk.input,
                  errorText: chunk.errorText,
                  providerExecuted: chunk.providerExecuted,
                  providerMetadata: chunk.providerMetadata
                });
              }
              write();
              break;
            }
            case "tool-approval-request": {
              const toolInvocation = getToolInvocation(chunk.toolCallId);
              toolInvocation.state = "approval-requested";
              toolInvocation.approval = { id: chunk.approvalId };
              write();
              break;
            }
            case "tool-output-denied": {
              const toolInvocation = getToolInvocation(chunk.toolCallId);
              toolInvocation.state = "output-denied";
              write();
              break;
            }
            case "tool-output-available": {
              const toolInvocation = getToolInvocation(chunk.toolCallId);
              if (toolInvocation.type === "dynamic-tool") {
                updateDynamicToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: toolInvocation.toolName,
                  state: "output-available",
                  input: toolInvocation.input,
                  output: chunk.output,
                  preliminary: chunk.preliminary,
                  providerExecuted: chunk.providerExecuted,
                  title: toolInvocation.title
                });
              } else {
                updateToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: getStaticToolName(toolInvocation),
                  state: "output-available",
                  input: toolInvocation.input,
                  output: chunk.output,
                  providerExecuted: chunk.providerExecuted,
                  preliminary: chunk.preliminary,
                  title: toolInvocation.title
                });
              }
              write();
              break;
            }
            case "tool-output-error": {
              const toolInvocation = getToolInvocation(chunk.toolCallId);
              if (toolInvocation.type === "dynamic-tool") {
                updateDynamicToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: toolInvocation.toolName,
                  state: "output-error",
                  input: toolInvocation.input,
                  errorText: chunk.errorText,
                  providerExecuted: chunk.providerExecuted,
                  title: toolInvocation.title
                });
              } else {
                updateToolPart({
                  toolCallId: chunk.toolCallId,
                  toolName: getStaticToolName(toolInvocation),
                  state: "output-error",
                  input: toolInvocation.input,
                  rawInput: toolInvocation.rawInput,
                  errorText: chunk.errorText,
                  providerExecuted: chunk.providerExecuted,
                  title: toolInvocation.title
                });
              }
              write();
              break;
            }
            case "start-step": {
              parts.push({ type: "step-start" });
              break;
            }
            case "finish-step": {
              state.activeTextParts = {};
              state.activeReasoningParts = {};
              break;
            }
            case "start": {
              if (chunk.messageId != null) {
                state.message.id = chunk.messageId;
              }
              updateMessageMetadata(chunk.messageMetadata);
              if (chunk.messageId != null || chunk.messageMetadata != null) {
                write();
              }
              break;
            }
            case "finish": {
              if (chunk.finishReason != null) {
                state.finishReason = chunk.finishReason;
              }
              updateMessageMetadata(chunk.messageMetadata);
              if (chunk.messageMetadata != null) {
                write();
              }
              break;
            }
            case "message-metadata": {
              updateMessageMetadata(chunk.messageMetadata);
              if (chunk.messageMetadata != null) {
                write();
              }
              break;
            }
            case "error": {
              onError?.(new Error(chunk.errorText));
              break;
            }
            default: {
              if (isDataUIMessageChunk(chunk)) {
                const dataChunk: any = chunk;
                // transient data part 不进入消息（原版会回调 onData，我们不使用），直接跳过
                if (dataChunk.transient) {
                  break;
                }
                const existingUIPart =
                  dataChunk.id != null
                    ? parts.find((p) => dataChunk.type === p.type && dataChunk.id === (p as any).id)
                    : undefined;
                if (existingUIPart != null) {
                  (existingUIPart as any).data = dataChunk.data;
                } else {
                  parts.push(dataChunk);
                }
                write();
              }
            }
          }
        });
        controller.enqueue(chunk);
      }
    })
  );
}

/**
 * 消费 UIMessageChunk 流，每当累积消息产生可见更新就 yield 一次当前消息。
 *
 * 与 ai 的 readUIMessageStream 接口一致，可直接替换；唯一行为差异：
 * yield 的是【同一个】持续被就地 mutate 的 message 引用（不深克隆）。
 * 调用方必须在拿到每帧后【同步】读取所需字段、不可异步持有原始引用，否则会读到后续被改写的数据。
 *
 * @param options.message - 续写场景下已存在的 assistant 消息（作为累积起点）
 * @param options.stream - 待消费的 UIMessageChunk 流
 * @param options.onError - 流内错误回调
 */
export async function* readUIMessageStream(options: {
  message?: UIMessage;
  stream: ReadableStream<UIMessageChunk>;
  onError?: (error: unknown) => void;
}): AsyncGenerator<UIMessage, void, unknown> {
  const { message, stream, onError } = options;
  const state = createStreamingUIMessageState(message);

  // output 流承载"每帧消息更新"：processUIMessageStream 的 write 回调把当前 state.message 推进这里。
  let outputController!: ReadableStreamDefaultController<UIMessage>;
  const output = new ReadableStream<UIMessage>({
    start(controller) {
      outputController = controller;
    }
  });

  const processed = processUIMessageStream({
    stream,
    onError,
    runUpdateMessageJob: (job) =>
      job({
        state,
        // 原版此处是 controller.enqueue(structuredClone(state.message))；改为直接交出引用，去掉每帧深克隆。
        write: () => outputController.enqueue(state.message)
      })
  });

  // 驱动器：drain processed 流以推进上面的 transform（chunk 本身不需要），结束后关闭 output。
  const processedReader = processed.getReader();
  const driver = (async () => {
    try {
      for (;;) {
        const { done } = await processedReader.read();
        if (done) {
          break;
        }
      }
    } catch (error) {
      onError?.(error);
    } finally {
      try {
        outputController.close();
      } catch {
        // output 可能已关闭，忽略
      }
    }
  })();

  const outputReader = output.getReader();
  try {
    for (;;) {
      const { done, value } = await outputReader.read();
      if (done) {
        break;
      }
      yield value;
    }
  } finally {
    outputReader.releaseLock();
    // 消费方提前退出（break / abort）时取消上游驱动，避免 driver 空转
    await processedReader.cancel().catch(() => {});
  }

  await driver;
}
