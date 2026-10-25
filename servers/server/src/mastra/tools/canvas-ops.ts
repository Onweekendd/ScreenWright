import { AgentMode } from "../types/bi-chat";
import { type CanvasOp, type OpResult, type SuspendPayload, SuspendType } from "../types/suspend";

/**
 * 画布写操作的挂起/恢复收口。
 *
 * 各工具（move_component、group_component……）只负责把入参翻译成 `ops`（并把组件 id 解析成纯数字），
 * 然后交给 {@link suspendCanvasOps}；恢复时用 {@link readCanvasOpResults} 按下标取回执，再过 core 落盘。
 * 「要不要审批」只在这里判断一次，工具不再自己看 AgentMode、不再挑挂起类型。
 */

/** 工具 execute 的 context 里这里用到的那一小块；用结构类型而不是 mastra 的完整类型，方便单测里传桩 */
interface CanvasOpsContext {
  agent?: { suspend?: (payload: never) => unknown };
  requestContext?: { get: (key: string) => unknown };
}

/** 没有 suspend 能力（非 agent 流式调用）时工具原样返回的失败结果 */
export const NO_SUSPEND_RESULT = {
  success: false as const,
  message: "当前上下文不支持 suspend（非 agent 流式调用）"
};

/**
 * 组装 `canvas_ops` 的挂起载荷。`needsApproval` 为真时带上 `approval`，前端先弹一次确认（整批一次）。
 * 不经 {@link suspendCanvasOps} 自己调 suspend 的调用方（edit_files 的同步处理器只产出载荷、
 * 由调用方补批次字段再挂起）用它。
 */
export function canvasOpsPayload(input: {
  needsApproval: boolean;
  purpose: string;
  ops: CanvasOp[];
  batch?: { batchId: string; operationId: string };
}): SuspendPayload<SuspendType.CanvasOps> {
  if (input.ops.length === 0) {
    throw new Error("canvas_ops 至少要有一个操作");
  }
  return {
    type: SuspendType.CanvasOps,
    ...(input.needsApproval ? { approval: { purpose: input.purpose } } : {}),
    ops: input.ops,
    ...input.batch
  };
}

/**
 * 把一批画布操作挂起交给前端。ASK_BEFORE_EDIT 模式下带上 `approval`，前端先弹一次确认（整批一次）。
 *
 * 成功挂起时 mastra 会中断当前 execute，所以返回类型是 `never`；没有 suspend 能力时返回 {@link NO_SUSPEND_RESULT}。
 */
export function suspendCanvasOps(
  context: CanvasOpsContext | undefined,
  input: { purpose: string; ops: CanvasOp[]; batch?: { batchId: string; operationId: string } }
): Promise<never> | typeof NO_SUSPEND_RESULT {
  const payload = canvasOpsPayload({
    needsApproval: (context?.requestContext?.get("mode") as AgentMode | undefined) === AgentMode.ASK_BEFORE_EDIT,
    ...input
  });
  const suspend = context?.agent?.suspend;
  if (!suspend) {
    return NO_SUSPEND_RESULT;
  }
  return suspend(payload as never) as Promise<never>;
}

export type CanvasOpsReply =
  /** 首次执行，还没有前端回执 */
  | { status: "pending" }
  /** 用户拒绝了审批 */
  | { status: "rejected" }
  | { status: "done"; results: OpResult[] }
  /** 回执长度与 ops 对不上——协议被破坏，不能按下标取 */
  | { status: "invalid"; message: string };

/**
 * 读前端回执：按下标一一对应，`results.length` 必须等于发出去的 `ops` 数（不传 expectedCount 则不校验长度，
 * 用于调用方要先看一眼回执再决定怎么对账的场景）。
 * 用户拒绝是 `rejected`；单个操作失败不在这里体现，在对应下标的 `{ ok: false, error }` 里。
 */
export function readCanvasOpResults(resumeData: unknown, expectedCount?: number): CanvasOpsReply {
  if (!resumeData || typeof resumeData !== "object") {
    return { status: "pending" };
  }
  const data = resumeData as { approved?: unknown; results?: unknown };
  if (data.approved === false) {
    return { status: "rejected" };
  }
  if (!Array.isArray(data.results)) {
    return { status: "pending" };
  }
  if (expectedCount !== undefined && data.results.length !== expectedCount) {
    return {
      status: "invalid",
      message: `前端回执数量不符：发出 ${expectedCount} 个操作，收到 ${data.results.length} 个`
    };
  }
  return { status: "done", results: data.results as OpResult[] };
}
