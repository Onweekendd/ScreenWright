import type { UIMessage } from "ai";

import { detectStepStatusChange, extractWorkflowParts } from "../utils";
import type { ConvertChunkDataType } from "./useFigmaToBI";
import { useFigmaToBI } from "./useFigmaToBI";

type WorkflowStepHandler = (output: any) => Promise<void> | void;

/**
 * 处理 workflow 步骤输出的副作用
 * 通过注册表机制支持新增步骤类型时无需修改核心流循环
 */
export function useWorkflowStreamUpdater() {
  const { addProcessedComponent } = useFigmaToBI();
  const workflowStepHandlers = new Map<string, WorkflowStepHandler>();

  /**
   * 注册 workflow step 处理器
   */
  const registerStepHandler = (stepId: string, handler: WorkflowStepHandler) => {
    workflowStepHandlers.set(stepId, handler);
  };

  registerStepHandler("node-convert-to-bi-step", async (output) => {
    await addProcessedComponent(output as ConvertChunkDataType);
  });

  /**
   * 对比前后消息中的 workflow parts，检测步骤状态变化并执行对应副作用
   */
  const processWorkflowUpdates = async (prevMsg: UIMessage, currMsg: UIMessage) => {
    const prevParts = extractWorkflowParts(prevMsg);
    const prevStepsMap = new Map(prevParts.map((p) => [p.id, p?.data?.steps ?? {}]));

    for (const curr of extractWorkflowParts(currMsg)) {
      const prevSteps: Record<string, any> = prevStepsMap.get(curr.id) ?? {};

      for (const [stepId, step] of Object.entries<any>(curr.data?.steps ?? {})) {
        for (const [targetStepId, handler] of workflowStepHandlers) {
          if (detectStepStatusChange(prevSteps[stepId]?.status, step.status, targetStepId, stepId)) {
            await handler(step.output);
          }
        }
      }
    }
  };

  return {
    registerStepHandler,
    processWorkflowUpdates
  };
}
