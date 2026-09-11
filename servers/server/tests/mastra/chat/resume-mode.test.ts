import { describe, expect, it } from "vitest";

import { resolveModeFromResumeData } from "@/mastra/services/chat/resume-mode";
import { AgentMode, SuspendType } from "@/mastra/types/bi-chat";

describe("resolveModeFromResumeData", () => {
  it("非 resume 轮（无 resumeData）沿用 thread metadata 里的 mode", () => {
    expect(resolveModeFromResumeData(AgentMode.PLAN, undefined, undefined)).toBe(AgentMode.PLAN);
    expect(resolveModeFromResumeData(AgentMode.AUTO_EDIT, undefined, undefined)).toBe(AgentMode.AUTO_EDIT);
  });

  it("submit-plan 批准退出计划模式：action 决定退到哪一档", () => {
    expect(resolveModeFromResumeData(AgentMode.PLAN, SuspendType.SubmitPlan, { action: "auto_edit" })).toBe(
      AgentMode.AUTO_EDIT
    );
    expect(resolveModeFromResumeData(AgentMode.PLAN, SuspendType.SubmitPlan, { action: "ask_before_edit" })).toBe(
      AgentMode.ASK_BEFORE_EDIT
    );
  });

  it("keep_plan / reject 留在计划模式", () => {
    expect(resolveModeFromResumeData(AgentMode.PLAN, SuspendType.SubmitPlan, { action: "keep_plan" })).toBe(
      AgentMode.PLAN
    );
    expect(resolveModeFromResumeData(AgentMode.PLAN, SuspendType.SubmitPlan, { action: "reject" })).toBe(
      AgentMode.PLAN
    );
  });

  it("enter-plan-mode 仅在批准时进入计划模式，拒绝则保留原 mode", () => {
    expect(resolveModeFromResumeData(AgentMode.AUTO_EDIT, SuspendType.EnterPlanMode, { approved: true })).toBe(
      AgentMode.PLAN
    );
    expect(resolveModeFromResumeData(AgentMode.AUTO_EDIT, SuspendType.EnterPlanMode, { approved: false })).toBe(
      AgentMode.AUTO_EDIT
    );
  });

  it("创建组件失败回执即使有 approved:true，也绝不能被当成 enter-plan-mode", () => {
    const frontendFailure = { approved: true, error: "前端创建组件失败（eval 模拟）" };
    expect(resolveModeFromResumeData(AgentMode.AUTO_EDIT, SuspendType.CreateComponent, frontendFailure)).toBe(
      AgentMode.AUTO_EDIT
    );
  });

  it("通用审批回执沿用原 mode，不依赖 batchId 等字段猜测工具类型", () => {
    expect(resolveModeFromResumeData(AgentMode.AUTO_EDIT, SuspendType.AskApproval, { approved: true })).toBe(
      AgentMode.AUTO_EDIT
    );
  });

  it("非 submit-plan 工具即使返回 action 字段，也不能切换 mode", () => {
    expect(
      resolveModeFromResumeData(AgentMode.ASK_BEFORE_EDIT, SuspendType.AskUserQuestion, { action: "auto_edit" })
    ).toBe(AgentMode.ASK_BEFORE_EDIT);
  });

  it("与计划无关的 resume（如问答工具回填）沿用原 mode", () => {
    expect(resolveModeFromResumeData(AgentMode.AUTO_EDIT, SuspendType.AskUserQuestion, { answer: "第二个" })).toBe(
      AgentMode.AUTO_EDIT
    );
  });
});
