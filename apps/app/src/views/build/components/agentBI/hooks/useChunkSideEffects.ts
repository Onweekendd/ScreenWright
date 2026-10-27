import type { Ref } from "vue";

import type { AgentMode, SuspendType } from "@screenwright/server/rpc";
import { apiClient, SuspendTypeSchema } from "@screenwright/server/rpc";
import type { UIMessageChunk } from "ai";
import { ElMessage } from "element-plus";

import type { UsageInfo } from "../type";
import type { StreamState, SuspendedToolInfo } from "./useAgentBIStream";
import { useComponentStreamUpdater } from "./useComponentStreamUpdater";

type ChunkSideEffectHandler = (chunk: { type: string; data: unknown }) => Promise<void> | void;

interface ResolvedSuspend {
  suspendType: SuspendType;
  resumeData: Record<string, unknown>;
}

/**
 * 管理流 chunk 副作用处理，可独立注入到任何消费 SSE 流的场景（主 agent、子 agent 等）。
 * 暴露 createSideEffectTransform 工厂，按需为每次流请求创建隔离的 TransformStream。
 */
export function useChunkSideEffects({
  applyLocalMode = () => {},
  lastUsage,
  activeThreadId,
  sessionId,
  onVersionCommitted
}: {
  applyLocalMode?: (mode: AgentMode) => void;
  lastUsage?: Ref<UsageInfo | null>;
  /** 当前线程 id；suspend 时用它把 resume 轮灌回同一条会话流（缺省则跳过 resume 触发） */
  activeThreadId?: Ref<string | undefined>;
  /** 所属会话 id；转发给 useComponentStreamUpdater 用于审批弹窗按 tab 隔离 */
  sessionId: string;
  /** 后端 close() 提交版本快照落地后顺流推 data-version-committed，收到即刷新回退列表 */
  onVersionCommitted?: () => void;
}) {
  const { suspendHandlers } = useComponentStreamUpdater(sessionId, { applyLocalMode });

  /**
   * fire-and-forget 触发 resume：把 resume 轮灌进已存在的会话流（POST /bi-chat/resume），
   * 不把响应当流消费——续接遥测顺着原 outer 流回来（hub 在 suspend 时不关流）。
   */
  const triggerResume = (
    runId: string,
    suspendType: SuspendType,
    resumeData: Record<string, unknown>,
    toolName: string,
    toolCallId: string
  ) => {
    const threadId = activeThreadId?.value;
    if (!threadId) {
      console.warn("[data-tool-call-suspended] 缺少 threadId，无法触发 resume", { toolName, toolCallId });
      return;
    }
    void apiClient.customApi["bi-chat"].resume
      .$post({ json: { threadId, runId, toolCallId, suspendType, resumeData } })
      .then(async (res) => {
        const { piped } = (await res.json()) as { piped?: boolean };
        if (!piped) {
          // 会话已被空闲关闭 / 进程重启丢失 → 后续阶段走重连兜底
          console.warn("[data-tool-call-suspended] resume 未命中会话(piped=false)", { threadId, runId });
        }
      })
      .catch((err) => {
        console.error("[data-tool-call-suspended] resume 请求失败", { err, threadId, runId });
      });
  };

  /**
   * 把一个 suspend 载荷分发到对应 suspendHandler，返回类型明确的 resume 上下文
   * （取消/校验失败/未注册 → null）。
   * 主 agent 工具级挂起(data-tool-call-suspended)与后台子任务挂起(data-background-task-suspended)共用同一套分发。
   */
  const resolveSuspend = async (info: SuspendedToolInfo): Promise<ResolvedSuspend | null> => {
    const { toolName, toolCallId, suspendPayload, ...rest } = info;
    const suspendType = (suspendPayload as { type?: string }).type;

    if (!suspendType) {
      console.warn("[suspend] suspendPayload 缺少 type 字段", { toolName, toolCallId });
      return null;
    }
    const parsedSuspendType = SuspendTypeSchema.safeParse(suspendType);
    if (!parsedSuspendType.success) {
      ElMessage.error(`未知的 suspend type: "${suspendType}"`);
      console.warn(`[suspend] 未知的 suspend type: "${suspendType}"`, { toolName, toolCallId });
      return null;
    }
    const handler = suspendHandlers.get(parsedSuspendType.data);
    if (!handler) {
      ElMessage.error(`未注册的 suspend type: "${suspendType}"`);
      console.warn(`[suspend] 未注册的 suspend type: "${suspendType}"`, { toolName, toolCallId });
      return null;
    }
    const resumeData = await handler({ toolName, suspendPayload, toolCallId, ...rest });
    return resumeData === null ? null : { suspendType: parsedSuspendType.data, resumeData };
  };

  const createHandlers = (state: StreamState): Map<string, ChunkSideEffectHandler> => {
    const handlers = new Map<string, ChunkSideEffectHandler>();

    handlers.set("data-usage", (chunk) => {
      if (lastUsage) {
        lastUsage.value = chunk.data as UsageInfo;
      }
    });

    // 后端本轮提交落地后推来的通知：刷新回退节点列表，让刚发的这条提问拿到撤销锚点。
    // 该帧只作副作用、不进渲染，故命中 handler 即被吞掉。
    handlers.set("data-version-committed", () => {
      onVersionCommitted?.();
    });

    handlers.set("data-tool-call-suspended", async (chunk) => {
      const data = chunk.data as SuspendedToolInfo;
      const resolved = await resolveSuspend(data);
      // resolveSuspend 返回 null（用户取消/校验失败/未注册）：不进入 resume
      if (resolved === null) {
        return;
      }
      const { suspendType, resumeData } = resolved;
      state.suspendedTool = { ...data, resumeData };

      // hub 模型：resume 不再靠"流结束后重发新流"，而是 fire-and-forget 把 resume 轮灌进
      // 同一条会话流——outer 流在 suspend 时不关，consumeSSEResponse 持续读，续接帧顺原流回来。
      triggerResume(data.runId, suspendType, resumeData, data.toolName, data.toolCallId);
    });

    return handlers;
  };

  /**
   * 创建副作用 TransformStream：按 chunk type 分发副作用，无 handler 的 chunk 透传给渲染管线。
   * suspend 弹窗在 transform 内 await，保证 state.suspendedTool 在流结束前写入。
   * @param state - 本次流的可变状态，suspend handler 写入 suspendedTool
   */
  const createSideEffectTransform = (state: StreamState): TransformStream<UIMessageChunk, UIMessageChunk> => {
    const handlers = createHandlers(state);
    return new TransformStream({
      async transform(chunk, controller) {
        const handler = handlers.get((chunk as { type: string }).type);
        if (handler) {
          await handler(chunk as unknown as { type: string; data: unknown });
          return;
        }

        controller.enqueue(chunk);
      }
    });
  };

  return { createSideEffectTransform, resolveSuspend };
}
