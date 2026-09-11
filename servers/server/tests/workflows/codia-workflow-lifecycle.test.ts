import { afterEach, describe, expect, it } from "vitest";

import { workflowStateRegistry } from "@/mastra/state";
import { StepEnum } from "@/mastra/types";
import { codiaToBIWorkflow } from "@/mastra/workflows/figma-to-bi/codia-to-bi-workflow";
import { figmaToBIV2Workflow } from "@/mastra/workflows/figma-to-bi/figma-to-bi-v2-workflow";
import { createWorkflowId } from "@/mastra/workflows/figma-to-bi/steps/generate-workflow-id-step";
import { cleanupWorkflowRegistryState } from "@/mastra/workflows/figma-to-bi/utils/workflow-state-cleanup";

const createdWorkflowIds = new Set<string>();

function createRegistryEntry(workflowId: string): void {
  createdWorkflowIds.add(workflowId);
  workflowStateRegistry.create(workflowId);
}

afterEach(() => {
  for (const workflowId of createdWorkflowIds) {
    workflowStateRegistry.cleanup(workflowId);
  }
  createdWorkflowIds.clear();
});

describe("Figma/Codia workflow 生命周期", () => {
  it("同一秒创建的 workflowId 仍包含不同 UUID", () => {
    const now = new Date(2026, 6, 23, 9, 30, 45);
    const first = createWorkflowId(now);
    const second = createWorkflowId(now);

    expect(first).toMatch(/^20260723_093045_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(second).not.toBe(first);
  });

  it.each(["success", "failed", "tripwire", "canceled", "bailed"] as const)("%s 终态会清理 registry", (status) => {
    const workflowId = `terminal-${status}`;
    createRegistryEntry(workflowId);

    cleanupWorkflowRegistryState({ status, state: { workflowId } });

    expect(workflowStateRegistry.has(workflowId)).toBe(false);
  });

  it.each(["suspended", "waiting", "paused"] as const)("%s 可恢复状态会保留 registry", (status) => {
    const workflowId = `resumable-${status}`;
    createRegistryEntry(workflowId);

    cleanupWorkflowRegistryState({ status, state: { workflowId } });

    expect(workflowStateRegistry.has(workflowId)).toBe(true);
  });

  it("两条工作流都使用统一终态清理，且只有 Figma 流程解析数据库图片", () => {
    expect(codiaToBIWorkflow.options.onFinish).toBe(cleanupWorkflowRegistryState);
    expect(figmaToBIV2Workflow.options.onFinish).toBe(cleanupWorkflowRegistryState);
    expect(codiaToBIWorkflow.steps).not.toHaveProperty(StepEnum.RESOLVE_IMAGES);
    expect(figmaToBIV2Workflow.steps).toHaveProperty(StepEnum.RESOLVE_IMAGES);
  });
});
