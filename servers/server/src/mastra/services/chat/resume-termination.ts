import { SuspendType } from "../../types/bi-chat";

/** 用户明确拒绝了当前挂起命令；执行失败、保持计划等其他结果不属于拒绝。 */
export const isRejectedResume = (
  suspendType: SuspendType,
  resumeData: Record<string, unknown> | undefined
): boolean => {
  if (suspendType === SuspendType.SubmitPlan) {
    return resumeData?.action === "reject";
  }
  return resumeData?.approved === false;
};
