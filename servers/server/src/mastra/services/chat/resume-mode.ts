/**
 * 按 suspend 类型和 resume 数据预判本轮 run 应处的 AgentMode。
 *
 * 纯逻辑、无副作用：起流前调用一次，结果写进 RequestContext 供 ModeGuardProcessor 读。
 */

import { AgentMode, SuspendType } from "../../types/bi-chat";

/**
 * 根据显式 suspendType 和 resumeData 预判本次 run 应处的 mode。
 *
 * 背景：resume run 里 processInputStep 先于挂起工具的 execute() 执行，ModeGuardProcessor 在第一次
 * processInputStep 时读到的 metadata/requestContext.mode 都是 execute() 更新前的旧值（慢一轮）。
 * suspendType 标明被恢复的工具语义，resumeData 是该工具的用户回执。只有两个计划工具能够改变 mode，
 * 其余工具即使也有 approved/action 字段也必须沿用 metadata，不能靠回执字段形状猜工具类型。
 *
 * - submit-plan resume：action=auto_edit/ask_before_edit 批准并退出计划模式；keep_plan/reject 保持 PLAN
 * - enter-plan-mode resume：approved=true 进入 PLAN；approved=false 保持正常模式
 * - 其他 resume（非 plan 相关）：沿用 metadata 原值
 */
export const resolveModeFromResumeData = (
  metadataMode: AgentMode,
  suspendType: SuspendType | undefined,
  resumeData: Record<string, unknown> | undefined
): AgentMode => {
  if (suspendType === SuspendType.EnterPlanMode) {
    return resumeData?.approved === true ? AgentMode.PLAN : metadataMode;
  }

  if (suspendType === SuspendType.SubmitPlan) {
    const action = resumeData?.action;
    if (action === "auto_edit") {
      return AgentMode.AUTO_EDIT;
    }
    if (action === "ask_before_edit") {
      return AgentMode.ASK_BEFORE_EDIT;
    }
    if (action === "keep_plan" || action === "reject") {
      return AgentMode.PLAN;
    }
  }

  return metadataMode;
};
