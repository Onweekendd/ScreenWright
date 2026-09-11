/**
 * 后台任务 chunk 的改形：mastra 原生 background-task-* → 前端 wire 的 data-background-task-*
 *
 * 本模块全是纯函数，只依赖类型与 @mastra/core/stream 的两个 converter，不碰 swAgent / memory，
 * 故可脱离整个 mastra runtime 单独测试。改形规则见 renameBackgroundChunk。
 */

import type { ChunkType } from "@mastra/core/stream";
import { convertFullStreamChunkToUIMessageStream, convertMastraChunkToAISDKv5 } from "@mastra/core/stream";

import type { BackgroundTaskOutputData, BackgroundTaskOutputRawPayload } from "../../types/bi-chat";

/**
 * 原地删掉子 agent chunk 上的重字段，给透传瘦身。
 *
 * step-start 的 payload.request、step-finish 的 payload.response 里挂着完整 messages + 整个 tools 数组，
 * 单帧可达数百 KB；前端用不到，透传前删掉。ChunkType 是联合类型，object/object-result 等成员没有 payload，
 * 故先用 in 收窄；StepStartPayload.request 在库里是必填，cast 成可选才能 delete。
 */
const stripHeavyFields = (chunk: ChunkType | undefined): void => {
  if (!chunk || !("payload" in chunk)) {
    return;
  }
  const payload = chunk.payload as { request?: unknown; response?: unknown };

  delete payload.request;
  delete payload.response;
};

/**
 * 拍平 background-task-output：取最内层 { output, toolCallId, toolName } 作为前端 wire 形态，
 * 顺手记录子 agent runId（用于过滤其原生 data-tool-agent 去重）并瘦身重字段。
 *
 * raw.payload 名义上是 tool-output chunk，其 .payload 就是要透传的最内层；
 * output 是子 agent 的增量 chunk，其 runId 即 subRunId。
 */
export const flattenBackgroundOutput = (
  raw: BackgroundTaskOutputRawPayload,
  bgSubRunIds?: Set<string>
): BackgroundTaskOutputData => {
  // raw.payload 名义上是 tool-output chunk，其 .payload 才是最内层 { output, toolCallId, toolName }；
  // 此处 output 还是子 agent 的原始 Mastra chunk（下面转成 UIMessageChunk）。
  // 但 outputWriter 实际会转发子 agent 的任意 chunk（object / object-result 等没有 .payload），
  // 此时 inner / subChunk 为空，整帧按「无法映射」丢弃（output 置空），与下面 converter 失败一致。
  const inner = raw.payload?.payload as { output?: ChunkType; toolCallId?: string; toolName?: string } | undefined;
  const subChunk = inner?.output;
  if (!inner || !subChunk) {
    return { output: undefined, toolCallId: inner?.toolCallId ?? "", toolName: inner?.toolName ?? "" };
  }

  // 记录 subRunId，用于后续过滤其原生 data-tool-agent（去重）
  if (subChunk.runId && bgSubRunIds) {
    bgSubRunIds.add(subChunk.runId);
  }
  // 原地瘦身：删掉子 chunk 上的重字段（mutate 的是 inner.output 引用的同一对象）
  stripHeavyFields(subChunk);

  // Mastra chunk → AI-SDK fullStream part → UIMessageChunk。无法映射的类型：
  // convertMastraChunkToAISDKv5 返回 undefined；convertFullStreamChunkToUIMessageStream 对未知类型会抛错。
  // 两种情况都按「丢弃」处理（output 置空），避免单个意外 chunk 炸掉整条流。
  let output: BackgroundTaskOutputData["output"];
  try {
    const aiSdkChunk = convertMastraChunkToAISDKv5({ chunk: subChunk, mode: "stream" });
    output = (
      aiSdkChunk
        ? convertFullStreamChunkToUIMessageStream({
            part: aiSdkChunk as Parameters<typeof convertFullStreamChunkToUIMessageStream>[0]["part"],
            sendReasoning: true, // 需要推理流就开
            sendSources: false,
            onError: (e) => String(e),
            sendStart: true,
            sendFinish: true
          })
        : undefined
    ) as BackgroundTaskOutputData["output"];
  } catch {
    output = undefined; // converter 不认识该类型，丢弃该帧
  }

  return { output, toolCallId: inner.toolCallId ?? "", toolName: inner.toolName ?? "" };
};

/**
 * 单个 chunk 的改名/拍平（toAISdkStream 只透传 data- 前缀类型，且 payload 必须搬到 data 字段）：
 * - 非 background-task-*：原样返回。
 * - background-task-output：改名 + 拍平，data 取最内层 { output, toolCallId, toolName }；
 *   若 output 映射不出 UIMessageChunk（outputWriter 转发的 object / object-result 等没有 .payload，
 *   或 converter 不认识该类型），返回 null 表示丢弃该帧。
 * - 其余 background-task-*：仅改名，data 原样透传 payload。
 */
export const renameBackgroundChunk = (chunk: ChunkType, bgSubRunIds?: Set<string>): ChunkType | null => {
  const { type } = chunk;
  if (typeof type !== "string" || !type.startsWith("background-task")) {
    return chunk;
  }

  const { payload } = chunk as Extract<ChunkType, { type: `background-task-${string}` }>;

  if (type === "background-task-output") {
    const data = flattenBackgroundOutput(payload as BackgroundTaskOutputRawPayload, bgSubRunIds);
    // 空 output（无法映射的 chunk）直接丢弃，避免前端收到只能跳过的空帧
    if (!data.output) {
      return null;
    }
    return { type: `data-${type}`, data } as unknown as ChunkType;
  }

  return { type: `data-${type}`, data: payload } as unknown as ChunkType;
};

/**
 * 把 background-task-* chunk 改名为 data-background-task-*，返回代理后的 stream。
 *
 * toAISdkStream 内部只透传 data- 前缀的类型，payload 必须移到 data 字段
 * （convertMastraChunkToAISDKBase 见到 payload 会将其 spread 进根对象，data 字段会丢失）。
 * fullStream 是只读 getter，用 Proxy 拦截而非直接赋值；并显式按 DOM ReadableStream 走
 * pipeThrough，避免全局 ReadableStream/TransformStream 与之类型不兼容。
 *
 * Reflect.get 不传 receiver：默认回退成 target，让 target 自身的 getter 以 this === target 执行。
 * 若传 Proxy 作 receiver，target 里任何读 #private 字段的 getter 都会抛 TypeError。
 */
export const withRenamedBackgroundChunks = <T extends { fullStream: unknown }>(
  mastraStream: T,
  bgSubRunIds: Set<string>
): T => {
  const patchedFullStream = (mastraStream.fullStream as ReadableStream<ChunkType>).pipeThrough(
    new TransformStream<ChunkType, ChunkType>({
      transform(chunk, controller) {
        const renamed = renameBackgroundChunk(chunk, bgSubRunIds);
        if (renamed) {
          controller.enqueue(renamed);
        }
      }
    })
  ) as T["fullStream"];

  return new Proxy(mastraStream, {
    get(target, prop) {
      if (prop === "fullStream") {
        return patchedFullStream;
      }
      return Reflect.get(target, prop);
    }
  });
};
