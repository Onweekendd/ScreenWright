import { describe, expect, it } from "vitest";

import { isRejectedResume } from "@/mastra/services/chat/resume-termination";
import { SuspendType } from "@/mastra/types/bi-chat";

describe("isRejectedResume", () => {
  it.each([SuspendType.AskApproval, SuspendType.AskApprovalCreateComponent, SuspendType.EnterPlanMode])(
    "%s 收到 approved:false 时应终止当前对话",
    (suspendType) => {
      expect(isRejectedResume(suspendType, { approved: false })).toBe(true);
    }
  );

  it("submit-plan 收到 reject 时应终止当前对话", () => {
    expect(isRejectedResume(SuspendType.SubmitPlan, { action: "reject" })).toBe(true);
  });

  it("submit-plan 收到 keep_plan 时不应终止当前对话", () => {
    expect(isRejectedResume(SuspendType.SubmitPlan, { action: "keep_plan" })).toBe(false);
  });

  it("用户批准但前端应用失败时不应被误判为拒绝", () => {
    expect(
      isRejectedResume(SuspendType.CreateComponent, {
        approved: true,
        error: "前端创建组件失败（eval 模拟）"
      })
    ).toBe(false);
  });
});
