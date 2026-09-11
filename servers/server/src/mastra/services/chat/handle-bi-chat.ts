/**
 * BI Chat 处理层：把请求体转成会话动作，返回领域结果（流 / ack 数据）。
 * HTTP 包装（createUIMessageStreamResponse / c.json）统一在路由层做。
 * - 一轮流的内部细节在 ./bi-chat-turn-stream
 * - 会话(hub)生命周期在 ./stream-session，取会话一律走 ./session-registry
 */

import { mastra } from "../../index";
import { isRejectedResume } from "./resume-termination";
import { sessionRegistry } from "./session-registry";
import type { BIChatRequest } from "./types";

/** 后台任务在 core 内部被包进的工作流 id（mastra core 常量），其 runId === taskId。 */
const BG_TASK_WORKFLOW_ID = "__background-task";
const resumingBackgroundTasks = new Map<string, Promise<{ piped: boolean }>>();

/**
 * 等待后台任务对应的 workflow snapshot 真正落盘成 suspended 再返回。
 *
 * 竞态根因：core 里「task 表标 suspended + 发 task.suspended 事件」与「workflow snapshot 落盘成
 * suspended」是两次独立写入，且前者(对外信号)可能领先于后者。前端/自动编辑一收到 suspend 信号就
 * 回调 resume-task，此时 bgManager.resume 先查 task 表(已 suspended、通过)，再 run.resume 去查
 * workflow snapshot——若 snapshot 还停在 running，core 抛 "This workflow run was not suspended"
 * 且只在其内部 .catch 打日志(不冒泡到我们)，于是任务卡死、前端空等到 idle 超时。
 *
 * 这里在触发 resume 前先轮询 snapshot.status，等它变 suspended 消除竞态。超时(snapshot 始终非
 * suspended，多半是已被推进/完成的异常态)则拒绝本次 resume，避免 Mastra 将 task 误标为 running 后卡死。
 */
async function waitForBgWorkflowSuspended(runId: string, deadlineMs = 10_000): Promise<boolean> {
  const workflowsStore = await mastra.getStorage()?.getStore("workflows");
  if (!workflowsStore) {
    return false;
  }
  const deadline = Date.now() + deadlineMs;
  for (;;) {
    let status: string | undefined;
    try {
      const snapshot = await workflowsStore.loadWorkflowSnapshot({ workflowName: BG_TASK_WORKFLOW_ID, runId });
      status = (snapshot as { status?: string } | null)?.status;
    } catch {
      status = undefined;
    }
    if (status === "suspended") {
      return true;
    }
    if (Date.now() >= deadline) {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * 初始轮 / clientTool 续流：起(或复用)会话，把这一轮灌进 outer，返回长寿的会话流。
 * threadId/resourceId 的存在性由路由层校验（schema 里是 optional，故路由先挡 400）。
 *
 * requestSignal 是举着 outer 流的初始连接的断连信号，绑到会话销毁(只在新建时绑)。
 */
export function handleBiChat(body: BIChatRequest, requestSignal?: AbortSignal): ReadableStream {
  const { threadId, resourceId, messages, clientTools } = body;
  const session = sessionRegistry.getOrCreate(threadId!, resourceId!, requestSignal);
  void session.runTurn({ messages, clientTools });
  return session.getStream() as ReadableStream;
}

/**
 * resume 控制端点：只触发、不消费流——把 resume 轮灌进已存在的会话流，返回 ack。
 * 找不到会话(断连/进程重启)时 piped=false，前端据此走重连兜底。
 */
export function handleBiChatResume(
  body: Pick<BIChatRequest, "threadId" | "runId" | "resumeData"> &
    Required<Pick<BIChatRequest, "toolCallId" | "suspendType">>
): {
  piped: boolean;
} {
  const { threadId, runId, toolCallId, suspendType, resumeData } = body;
  const session = sessionRegistry.find(threadId!);
  if (session) {
    void session.runTurn({
      runId,
      suspendType,
      resumeData,
      terminateAfterToolCallId: isRejectedResume(suspendType, resumeData) ? toolCallId : undefined
    });
  }
  return { piped: Boolean(session) };
}

/**
 * resume 后台任务控制端点：只触发、不消费流。
 * subscribe-before-resume —— 先把任务遥测接进同一条会话流，再触发任务继续，
 * 避免漏掉 resumed/output（stream() 连上只补发 running 快照）。
 *
 * 找不到会话 / manager 未初始化 → piped=false，前端走重连兜底。
 */
export function handleBiChatResumeTask(body: {
  threadId: string;
  taskId: string;
  suspendType: NonNullable<BIChatRequest["suspendType"]>;
  resumeData?: Record<string, unknown>;
}): Promise<{ piped: boolean }> {
  const existing = resumingBackgroundTasks.get(body.taskId);
  if (existing) {
    return existing;
  }

  const pending = resumeBackgroundTask(body);
  resumingBackgroundTasks.set(body.taskId, pending);
  void pending.finally(() => resumingBackgroundTasks.delete(body.taskId));
  return pending;
}

async function resumeBackgroundTask(body: {
  threadId: string;
  taskId: string;
  suspendType: NonNullable<BIChatRequest["suspendType"]>;
  resumeData?: Record<string, unknown>;
}): Promise<{ piped: boolean }> {
  const { threadId, taskId, resumeData } = body;

  const session = sessionRegistry.find(threadId);
  const bgManager = mastra.backgroundTaskManager;
  if (!session || !bgManager) {
    if (!bgManager) {
      console.error("[bi-chat] resume-task: backgroundTaskManager unavailable");
    }
    return { piped: false };
  }

  // snapshot 未确认 suspended 时绝不调用 resume。Mastra 会先写 task=running，
  // 再异步恢复 workflow；若 snapshot 仍是 running，内部错误会被吞掉并使任务无法重试。
  const ready = await waitForBgWorkflowSuspended(taskId);
  if (!ready) {
    console.error("[bi-chat] resume-task: workflow snapshot did not reach suspended", { threadId, taskId });
    return { piped: false };
  }

  try {
    // subscribe-before-resume：stream() 只补发 running 快照，先订阅才不会丢 resumed/output。
    session.attachTaskStream(taskId, bgManager, isRejectedResume(body.suspendType, resumeData));
    await bgManager.resume(taskId, resumeData ?? {});
  } catch (err) {
    session.detachTaskStream(taskId);
    console.error("[bi-chat] resume-task failed", { threadId, taskId, err });
    return { piped: false };
  }

  return { piped: true };
}
