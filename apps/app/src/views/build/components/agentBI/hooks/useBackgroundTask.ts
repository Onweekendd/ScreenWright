import { computed, type Ref, type ShallowRef, shallowRef } from "vue";

import type {
  BackgroundTaskOutputData,
  BackgroundTaskRunningData,
  BackgroundTaskStartedData,
  BackgroundTaskSuspendedData
} from "@screenwright/server/rpc";
import { apiClient } from "@screenwright/server/rpc";
import type { UIMessage, UIMessageChunk } from "ai";

import { uuid } from "@/utils/utils";

import { useAgentBIStream } from "./useAgentBIStream";
import { useChunkSideEffects } from "./useChunkSideEffects";

/** 主流消费方注入：后台任务挂起时拿当前 threadId 发 resume-task（resolveSuspend 用本文件自己的实例） */
interface BgSplitContext {
  activeThreadId?: Ref<string | undefined>;
}

/** 后台任务运行状态 */
type BackgroundTaskStatus = "running" | "completed" | "failed";

/** 供 UI 渲染的后台任务视图模型 */
export interface BackgroundTaskView {
  /** 父 agent 委派的 toolCallId，作为任务唯一标识 */
  toolCallId: string;
  /** 后台任务自身 ID */
  taskId: string;
  /** 派发的工具名，如 agent-swExecutorAgent */
  toolName: string;
  /** 该任务的响应式消息列表 */
  messages: ShallowRef<UIMessage[]>;
  /** 运行状态 */
  status: BackgroundTaskStatus;
}

/**
 * 用于接收 后台任务流
 * 渲染后台流消息
 *
 * 每个会话 session 各自实例化一份：多 tab 下各 tab 的后台任务互相隔离，互不串台。
 * @param sessionId - 所属会话 id，转发给 useChunkSideEffects 用于审批弹窗按 tab 隔离
 */
function useBackgroundTask(sessionId: string) {
  /**
   * taskId -> 从主流分离出的后台任务分流
   */
  const backgroundTaskStreams = new Map<string, TransformStream<UIMessageChunk, UIMessageChunk>>();

  /**
   * taskId -> 后台任务分流写操作
   */
  const backgroundTaskWriters = new Map<string, WritableStreamDefaultWriter<UIMessageChunk>>();

  /**
   * taskId -> 后台任务的响应式消息列表，供 UI 渲染
   * */
  const backgroundTaskMessages = new Map<string, ShallowRef<UIMessage[]>>();

  /**
   * toolCallId -> 为该后台任务预生成的 messageId，注入到无 id 的 start chunk
   * */
  const backgroundTaskMessageIds = new Map<string, string>();

  /**
   * 供 UI 渲染的后台任务列表（响应式）。
   * 上面的 Map 都是非响应式的流式管线存储，列表新增/状态变化需要单独的响应式入口驱动视图。
   */
  const backgroundTasks = shallowRef<BackgroundTaskView[]>([]);

  /**
   * 更新某个后台任务的运行状态（不可变替换以触发 shallowRef 重渲）。
   * @param toolCallId - 任务唯一标识
   * @param status - 新状态
   */
  const setTaskStatus = (toolCallId: string, status: BackgroundTaskStatus) => {
    const index = backgroundTasks.value.findIndex((task) => task.toolCallId === toolCallId);
    if (index === -1) {
      return;
    }
    const next = backgroundTasks.value.slice();
    next[index] = { ...next[index], status };
    backgroundTasks.value = next;
  };

  /**
   * 后台任务进入终态：关闭子流 writer 让消费者收尾，并更新状态供 UI 展示。
   * @param toolCallId - 任务唯一标识
   * @param status - 终态（completed / failed）
   */
  const finalizeTask = (toolCallId: string, status: BackgroundTaskStatus) => {
    setTaskStatus(toolCallId, status);
    const writer = backgroundTaskWriters.get(toolCallId);
    if (writer) {
      writer.close().catch(() => {});
      backgroundTaskWriters.delete(toolCallId);
    }
  };

  const { createSideEffectTransform, resolveSuspend } = useChunkSideEffects({ sessionId });

  const { consumeMessageStream } = useAgentBIStream();

  /**
   * 为缺少 messageId 的 start chunk 补充 id，其余 chunk 原样透传。
   * 后台子流的 start chunk 由后端透传，不携带 id，需在前端注入以保证 readUIMessageStream 能正确关联消息。
   * @param chunk - 待处理的原始 chunk
   * @param messageId - 预生成的消息 id，仅在 chunk 为无 id 的 start 时注入
   */
  const injectMessageId = (chunk: UIMessageChunk, messageId: string): UIMessageChunk => {
    if (chunk.type !== "start" || ("messageId" in chunk && chunk.messageId)) {
      return chunk;
    }
    return { ...chunk, messageId } as UIMessageChunk;
  };

  /**
   * 处理后台任务启动事件：初始化该任务的流、writer、消息列表和预生成 messageId，并启动流消费。
   * @param backgroundTaskStartChunk - 主流中类型为 data-background-task-started 的 chunk
   */
  const onBackgroundTaskStart = async (backgroundTaskStartChunk: UIMessageChunk) => {
    /**
     * 这里取 toolCallId 后续都以 toolCallId 做为后台任务的唯一标识
     */
    const {
      data: { toolCallId, taskId, toolName }
    } = backgroundTaskStartChunk as { data: BackgroundTaskStartedData };

    const newBackgroundTaskStream = new TransformStream<UIMessageChunk, UIMessageChunk>();
    backgroundTaskStreams.set(toolCallId, newBackgroundTaskStream);

    const { writable, readable } = newBackgroundTaskStream;
    backgroundTaskWriters.set(toolCallId, writable.getWriter());

    const newBackgroundTaskMessages = shallowRef<UIMessage[]>([]);
    backgroundTaskMessages.set(toolCallId, newBackgroundTaskMessages);
    backgroundTaskMessageIds.set(toolCallId, uuid());

    // 登记到响应式列表，供 UI 渲染
    backgroundTasks.value = [
      ...backgroundTasks.value,
      { toolCallId, taskId, toolName, messages: newBackgroundTaskMessages, status: "running" }
    ];

    consumeMessageStream(readable, [createSideEffectTransform], {
      messages: newBackgroundTaskMessages,
      updateMessagesBy: (fn) => {
        newBackgroundTaskMessages.value = fn();
      },
      // 合帧落地：多个子 agent 并发时把固定间隔（默认 500ms）内的高频 chunk 合并成一次渲染，缓解卡顿且文字连续
      batchRender: true
    }).catch((error) => {
      console.error("Error in background task stream consumer:", error);
    });
  };

  /**
   * 处理后台任务运行中事件。
   * @param backgroundTaskRunningChunk - 主流中类型为 data-background-task-running 的 chunk，携带 toolCallId 和执行参数
   */
  const onBackgroundTaskRunning = (backgroundTaskRunningChunk: UIMessageChunk) => {
    const {
      data: { toolCallId, args }
    } = backgroundTaskRunningChunk as { data: BackgroundTaskRunningData };

    console.log("Background task running:", toolCallId, args);
  };

  /**
   * 处理后台任务输出事件：将子 agent 产出的 chunk 写入对应任务的子流。
   * output 为 undefined 时（后端无法映射的 chunk）直接跳过，不写入流。
   * @param backgroundTaskOutputChunk - 主流中类型为 data-background-task-output 的 chunk
   */
  const onBackgroundTaskOutput = async (backgroundTaskOutputChunk: UIMessageChunk) => {
    const {
      data: { toolCallId, output }
    } = backgroundTaskOutputChunk as { data: BackgroundTaskOutputData };

    const backgroundTaskWriter = backgroundTaskWriters.get(toolCallId);
    if (!backgroundTaskWriter || !output) {
      return;
    }

    const messageId = backgroundTaskMessageIds.get(toolCallId)!;
    await backgroundTaskWriter.write(injectMessageId(output, messageId));
  };

  /**
   * 处理后台任务挂起事件：复用主 agent 的 suspend 分发弹审批拿 resumeData，
   * 再 fire-and-forget 调 POST /bi-chat/resume-task —— 后端 attachTaskStream + bgManager.resume，
   * resume 后的遥测顺同一条会话流回来，按 toolCallId 写回已存在的后台子流渲染。
   * @param backgroundTaskSuspendedChunk - 主流中类型为 data-background-task-suspended 的 chunk
   * @param ctx - 主流消费方注入的上下文（当前 threadId）
   */
  const onBackgroundTaskSuspended = async (backgroundTaskSuspendedChunk: UIMessageChunk, ctx?: BgSplitContext) => {
    const { taskId, toolName, toolCallId, runId, suspendPayload } = (
      backgroundTaskSuspendedChunk as { data: BackgroundTaskSuspendedData }
    ).data;

    const threadId = ctx?.activeThreadId?.value;
    if (!threadId) {
      console.warn("[data-background-task-suspended] 缺少 threadId，无法触发 resume-task", { taskId, toolName });
      return;
    }

    const resolved = await resolveSuspend({ runId, toolCallId, toolName, suspendPayload });
    // resolveSuspend 返回 null（用户取消/校验失败/未注册）：不 resume
    if (resolved === null) {
      return;
    }
    const { suspendType, resumeData } = resolved;

    void apiClient.customApi["bi-chat"]["resume-task"]
      .$post({ json: { threadId, taskId, suspendType, resumeData } })
      .then(async (res) => {
        const { piped } = (await res.json()) as { piped?: boolean };
        if (!piped) {
          // 会话已空闲关闭 / 进程重启丢失 → 后续阶段走重连兜底
          console.warn("[data-background-task-suspended] resume-task 未命中会话(piped=false)", { threadId, taskId });
        }
      })
      .catch((err) => {
        console.error("[data-background-task-suspended] resume-task 请求失败", { err, threadId, taskId });
      });
  };

  /**
   * 处理后台任务终态事件（completed / failed / cancelled）：关闭子流并更新 UI 状态。
   * 后端把 mastra 原生 background-task-completed/failed/cancelled 改名为 data- 前缀透传，
   * data 即 BackgroundTaskRef（含 toolCallId），据此定位任务。
   * @param backgroundTaskFinalChunk - 主流中类型为 data-background-task-completed/failed/cancelled 的 chunk
   * @param status - 映射到 UI 的终态
   */
  const onBackgroundTaskFinalized = (backgroundTaskFinalChunk: UIMessageChunk, status: BackgroundTaskStatus) => {
    const { toolCallId } = (backgroundTaskFinalChunk as { data: { toolCallId: string } }).data;
    finalizeTask(toolCallId, status);
  };

  /**
   * 创建一个 TransformStream，从主流中拦截所有 data-background-task-* 类型的 chunk
   * 并分发给对应的后台任务处理函数；命中后【吞掉】该 chunk（不透传回主流），避免主消息
   * 无意义累积这些不渲染的 data part 造成 O(N²) 卡顿。非后台任务 chunk 原样透传。
   */
  const splitBackgroundTaskChunkFromMainStream = (ctx?: BgSplitContext) => () => {
    return new TransformStream<UIMessageChunk, UIMessageChunk>({
      async transform(chunk, controller) {
        if (chunk.type.startsWith("data-background-task-")) {
          if (chunk.type === "data-background-task-started") {
            await onBackgroundTaskStart(chunk);
          }

          if (chunk.type === "data-background-task-running") {
            onBackgroundTaskRunning(chunk);
          }

          if (chunk.type === "data-background-task-output") {
            await onBackgroundTaskOutput(chunk);
          }

          if (chunk.type === "data-background-task-suspended") {
            await onBackgroundTaskSuspended(chunk, ctx);
          }

          if (chunk.type === "data-background-task-completed") {
            onBackgroundTaskFinalized(chunk, "completed");
          }

          if (chunk.type === "data-background-task-failed" || chunk.type === "data-background-task-cancelled") {
            onBackgroundTaskFinalized(chunk, "failed");
          }

          // 后台任务 chunk 到此已分流给各自子流渲染，主流不再需要它们：直接吞掉、不透传回主流。
          // 这些 chunk 不带顶层 id，若继续透传，会被主消息累积器逐个 push 进主 assistant 消息
          //（uiMessageStream.ts 的 data 分支），而 AssistantMessage 根本不渲染 data-background-task-* part；
          // 每 push 一个就触发主流逐帧 normalizeForRender 全量浅比较，part 数随 chunk 线性堆积成 O(N²)，
          // 是多个子 agent / 大量 edit_files 并发时主线程卡死的根因。
          // 安全性已核实：主流 createSideEffectTransform 只处理 data-node-conversion / data-usage /
          // data-tool-call-suspended，不依赖任何 data-background-task-*（其 suspend 等副作用由 split
          // 内部的 onBackgroundTaskSuspended 自行处理），故丢弃不影响功能。
          return;
        }

        controller.enqueue(chunk);
      }
    });
  };

  /** 正在运行的后台任务数量，供入口图标徽标展示 */
  const runningTaskCount = computed(() => backgroundTasks.value.filter((task) => task.status === "running").length);

  return {
    splitBackgroundTaskChunkFromMainStream,
    backgroundTaskMessages,
    backgroundTaskStreams,
    backgroundTasks,
    runningTaskCount
  };
}

export { useBackgroundTask };
