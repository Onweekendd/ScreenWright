import { describe, expect, it } from "vitest";

import { buildWorkflowProgressChunk, isDeliveryWorkflow } from "@/mastra/services/chat/workflow-progress";
import { StepEnum } from "@/mastra/types";

describe("Figma 工作流交付进度", () => {
  it("转换完成后仍发送前端所需的收尾统计，并剔除节点树", () => {
    const result = buildWorkflowProgressChunk({
      type: "data-tool-workflow",
      data: {
        name: "figmaToBIV2Workflow",
        steps: {
          [StepEnum.NODE_CONVERT_TO_BI]: {
            input: { nodes: ["large figma tree"] },
            output: [{ success: true }, { success: false }]
          }
        }
      }
    });

    expect(isDeliveryWorkflow("figmaToBIV2Workflow")).toBe(true);
    expect(result.data).toMatchObject({ statistics: { total: 2, success: 1, failed: 1 } });
    expect(result.data.steps?.[StepEnum.NODE_CONVERT_TO_BI]).toMatchObject({ input: null, output: null });
  });

  it("未完成转换时不提前发送完成统计，其他工作流不走 Figma 交付处理", () => {
    const result = buildWorkflowProgressChunk({
      data: { name: "figmaToBIV2Workflow", steps: { prepare: { output: { pending: true } } } }
    });

    expect(result.data).not.toHaveProperty("statistics");
    expect(isDeliveryWorkflow("other-workflow")).toBe(false);
    expect(isDeliveryWorkflow(undefined)).toBe(false);
  });
});
