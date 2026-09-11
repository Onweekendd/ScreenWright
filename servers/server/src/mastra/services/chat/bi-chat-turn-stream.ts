/**
 * BI Chat 主流程：调用 agent.stream、转换流格式并返回语义化流响应
 *
 * 只负责编排。三簇独立变化的细节已各自成模块：
 * - 后台任务 chunk 改形 → ./background-chunk
 * - resume 的 mode 预判 → ./resume-mode
 * - thread metadata 落库 → ./thread-metadata、./sub-agent-collector
 */

import { toAISdkStream } from "@mastra/ai-sdk";
import type { AgentExecutionOptionsBase } from "@mastra/core/agent";
import { RequestContext } from "@mastra/core/request-context";
import type { ChunkType } from "@mastra/core/stream";
import { jsonSchema } from "ai";

import { swAgent } from "../../runtime";
import { memory } from "../../storage/storage";
import type { CustomStorageThreadType } from "../../types/bi-chat";
import { AgentMode } from "../../types/bi-chat";
import { withRenamedBackgroundChunks } from "./background-chunk";
import { resolveModeFromResumeData } from "./resume-mode";
import { SubAgentSnapshotCollector } from "./sub-agent-collector";
import { patchThreadMetadata } from "./thread-metadata";
import type { BIChatRequest } from "./types";
import { buildWorkflowProgressChunk, isDeliveryWorkflow } from "./workflow-progress";

/**
 * stream 期间在多个闭包间共享的 usage，避免裸的可变变量跨作用域读写。
 * 类型保持 unknown：原样透传给前端的 data-usage，本模块不解读其字段。
 */
interface UsageRef {
  current: unknown;
}

interface MemoryOptions {
  thread: string;
  resource: string;
}

/** 把前端传入的 clientTools 的 inputSchema 规整为 Mastra 可用的 jsonSchema */
const normalizeClientTools = (rawClientTools: BIChatRequest["clientTools"]) => {
  if (!rawClientTools) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(rawClientTools).map(([name, tool]) => {
      const { inputSchema, ...rest } = tool as { inputSchema?: Record<string, unknown>; [k: string]: unknown };
      return [
        name,
        {
          ...rest,
          ...(inputSchema ? { inputSchema: jsonSchema(inputSchema as Parameters<typeof jsonSchema>[0]) } : {})
        }
      ];
    })
  );
};

/**
 * 读 thread 拿当前 mode，按 suspendType + resumeData 预判本轮真实 mode，装进 RequestContext。
 * ModeGuardProcessor 在 processInputStep 里读它来决定剥不剥写工具，故必须在起流前算好。
 */
const buildRequestContext = async (
  threadId: string,
  suspendType: BIChatRequest["suspendType"],
  resumeData: Record<string, unknown> | undefined
) => {
  const currentThread = (await memory.getThreadById({ threadId })) as CustomStorageThreadType;
  const metadataMode = currentThread?.metadata.mode ?? AgentMode.ASK_BEFORE_EDIT;
  const mode = resolveModeFromResumeData(metadataMode, suspendType, resumeData);

  return new RequestContext<{ mode: AgentMode; threadId: string }>([
    ["mode", mode],
    ["threadId", threadId]
  ]);
};

/** 每步结束时把 usage 落 thread metadata，并写入 usageRef 供流末尾注入 data-usage */
const createUsagePersister = (
  threadId: string,
  usageRef: UsageRef
): AgentExecutionOptionsBase<unknown>["onStepFinish"] => {
  return async (event) => {
    if (!event.usage) {
      return;
    }
    // mastra 回调给的 usage 与本仓 ai 包的 LanguageModelUsage 结构对不上（少 inputTokenDetails
    // 等字段，两份 ai 版本并存所致）。落库形态历来如此，唯一的读者 compaction 只取 inputTokens /
    // promptTokens，两边都有；这里显式 cast，把这处不一致标在明面上。
    await patchThreadMetadata(threadId, () => ({
      lastUsage: event.usage as CustomStorageThreadType["metadata"]["lastUsage"]
    }));
    usageRef.current = event.usage;
  };
};

interface SwAgentStreamOptions {
  runId?: string;
  resumeData?: Record<string, unknown>;
  messages: BIChatRequest["messages"];
  clientTools: ReturnType<typeof normalizeClientTools>;
  memoryOptions: MemoryOptions;
  requestContext: RequestContext<{ mode: AgentMode; threadId: string }>;
  abortSignal: AbortSignal;
  onStepFinish: AgentExecutionOptionsBase<unknown>["onStepFinish"];
}

/**
 * 起 swAgent 的流：有 runId 走 resume，否则走 streamUntilIdle。
 *
 * streamUntilIdle: 保持 SSE 流打开，直到后台任务(swExecutorAgent)完成且 LLM 续接处理完。
 * 普通 stream() 在 LLM 给出最终回复后就返回，后台任务结果只会落 memory、不回本次请求。
 * 返回对象与 stream() 同形，fullStream 横跨初始轮 + 续接轮，后续链路无需改动。
 */
const startBIAgentStream = (options: SwAgentStreamOptions) => {
  const { runId, resumeData, messages, clientTools, memoryOptions, requestContext, abortSignal, onStepFinish } =
    options;

  if (runId) {
    return swAgent.resumeStream(resumeData ?? {}, {
      clientTools,
      untilIdle: true,
      memory: memoryOptions,
      runId,
      abortSignal,
      requestContext,
      modelSettings: {
        temperature: 0.2
      }
    });
  }

  return swAgent.stream(messages, {
    untilIdle: true,
    clientTools,
    memory: memoryOptions,
    abortSignal,
    requestContext,
    providerOptions: {
      openai: {
        reasoningEffort: "high"
      }
    },
    modelSettings: {
      temperature: 0.2
    },
    onStepFinish
  });
};

/**
 * 守卫式 controller：流被消费方 cancel 后，Web Streams 规范让 controller 进入 closed 态，
 * 此后 enqueue/close/error 一律抛 ERR_INVALID_STATE。这里把这条约束收在一处，调用侧不必到处 try。
 */
interface GuardedController {
  /** 已断连或已收尾；主循环据此提前退出迭代 */
  readonly isClosed: boolean;
  enqueue(chunk: unknown): void;
  close(): void;
  error(err: unknown): void;
  /** 消费方 cancel（客户端断连）时翻牌，此后一切输出静默 */
  markCancelled(): void;
}

const guardController = (controller: ReadableStreamDefaultController): GuardedController => {
  let closed = false;

  return {
    get isClosed() {
      return closed;
    },
    enqueue(chunk) {
      if (closed) {
        return;
      }
      try {
        controller.enqueue(chunk);
      } catch {
        closed = true; // enqueue 时才发现已关闭（与 cancel 竞态），置位并静默
      }
    },
    close() {
      if (closed) {
        return;
      }
      closed = true;
      try {
        controller.close();
      } catch {
        // 与消费方 cancel 竞态，controller 已关闭，忽略
      }
    },
    error(err) {
      if (closed) {
        return;
      }
      closed = true;
      try {
        controller.error(err);
      } catch {
        // controller 已关闭，无法再上报错误，忽略
      }
    },
    markCancelled() {
      closed = true;
    }
  };
};

/**
 * 单帧路由：返回要下发给前端的 chunk，返回 null 表示丢弃该帧。
 *
 * - data-tool-agent：顺手收子 agent 快照；后台子 agent 的原生帧丢弃（同内容已由
 *   data-background-task-output 透传，不丢会重复渲染）。
 * - 建屏类 workflow（figma / codia / requirementToBI）的进度帧：换成剔除 input/output
 *   并带统计的精简帧。那份 statistics 同时是前端的收尾信号，见 ./workflow-progress。
 * - 其余：原样透传。
 */
const routeChunk = (rawChunk: unknown, snapshots: SubAgentSnapshotCollector, bgSubRunIds: Set<string>): unknown => {
  const chunk = rawChunk as ChunkType;
  const type = chunk?.type;
  const chunkData = (chunk as Record<string, unknown>)?.data;

  // 直接按 inner toolCallId 写入扁平 Map：data-tool-agent.chunk.id 是 sub-agent runId
  // （不是父工具 toolCallId），在 injection 时没法用来反查；inner toolCallId 全局唯一。
  if (type === "data-tool-agent") {
    const id = chunk.id;
    if (!id || bgSubRunIds.has(id)) {
      return null;
    }
    snapshots.collect(chunkData);
    return rawChunk;
  }

  const workflowChunkName = (chunkData as { name?: string })?.name;
  if (type === "data-tool-workflow" && isDeliveryWorkflow(workflowChunkName)) {
    return buildWorkflowProgressChunk(rawChunk);
  }

  return rawChunk;
};

interface ProcessedStreamOptions {
  aiSdkStream: ReadableStream<unknown>;
  snapshots: SubAgentSnapshotCollector;
  threadId: string;
  internalAbort: AbortController;
  usageRef: UsageRef;
  bgSubRunIds: Set<string>; // 子 agent 的 runId，用于过滤其原生 data-tool-agent（去重）
}

/**
 * 消费 aiSdkStream：逐帧路由下发，收尾注入 usage 并持久化子 agent 快照。
 */
const createProcessedStream = (options: ProcessedStreamOptions): ReadableStream => {
  const { aiSdkStream, snapshots, threadId, internalAbort, usageRef, bgSubRunIds } = options;

  // controller 只在 start() 里拿得到，但 cancel() 也要翻同一张牌，故提到外层持有
  let output: GuardedController | undefined;

  return new ReadableStream({
    async start(controller) {
      const out = guardController(controller);
      output = out;

      // 正常收尾与异常收尾只差最后一步：都要先补 usage、再落快照
      const finish = async (settle: () => void) => {
        if (usageRef.current) {
          out.enqueue({ type: "data-usage", data: usageRef.current });
        }
        await snapshots.persist(threadId);
        settle();
      };

      try {
        for await (const rawChunk of aiSdkStream as unknown as AsyncIterable<unknown>) {
          if (out.isClosed) {
            break; // 消费方已取消，无需再迭代（internalAbort 也会让上游尽快结束）
          }
          const outgoing = routeChunk(rawChunk, snapshots, bgSubRunIds);
          if (outgoing !== null) {
            out.enqueue(outgoing);
          }
        }
        await finish(() => out.close());
      } catch (error) {
        console.error("[bi-chat] stream consume error:", error);
        await finish(() => out.error(error));
      }
    },
    cancel() {
      // 客户端断开连接时触发：标记已关闭并中止流迭代
      output?.markCancelled();
      internalAbort.abort();
    }
  });
};

/**
 * 处理 BI Chat 请求，返回语义化流响应。
 * 编排：规整入参 → 起流 → 改名 bg chunk → 转 AI-SDK → 消费 → 返回。
 */
export async function createBIChatTurnStream(
  createTurnStreamArgs: BIChatRequest,
  deps: { abortController: AbortController } // ← 运行时管线,单独放
): Promise<ReadableStream<ChunkType>> {
  try {
    const {
      messages,
      clientTools: rawClientTools,
      threadId,
      resourceId,
      runId,
      suspendType,
      resumeData
    } = createTurnStreamArgs;
    const { abortController } = deps;

    if (!threadId || !resourceId) {
      throw new Error("ThreadId or ResourceId is missing");
    }

    // 录制上下文由上层 BIChatStreamSession.runTurnWithRecording 用 withRecordingTurn 包住整轮注入，
    // 这里及下游的每次 LLM 往返都在那个 turn 里，不必再自己进上下文。

    // 三个跨阶段累加器：usage 由 onStepFinish 写、流末读；快照在消费阶段收、轮末落库；
    // bgSubRunIds 在改名阶段写、消费阶段读（过滤后台子 agent 的原生 data-tool-agent）。
    const usageRef: UsageRef = { current: undefined };
    const snapshots = new SubAgentSnapshotCollector();
    const bgSubRunIds = new Set<string>();

    const requestContext = await buildRequestContext(threadId, suspendType, resumeData);

    const mastraStream = await startBIAgentStream({
      runId,
      resumeData,
      messages,
      clientTools: normalizeClientTools(rawClientTools),
      memoryOptions: { thread: threadId, resource: resourceId },
      requestContext,
      abortSignal: abortController.signal,
      onStepFinish: createUsagePersister(threadId, usageRef)
    });

    const aiSdkStream = toAISdkStream(withRenamedBackgroundChunks(mastraStream, bgSubRunIds), {
      from: "agent",
      sendReasoning: true
    });

    return createProcessedStream({
      aiSdkStream: aiSdkStream as unknown as ReadableStream<unknown>,
      snapshots,
      threadId,
      internalAbort: abortController,
      usageRef,
      bgSubRunIds
    });
  } catch (error) {
    console.error("[turn-stream] setup failed:", error);
    throw error; // ← 抛出去,别返 Response
  }
}
