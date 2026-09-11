/**
 * 建屏类工作流的进度帧。
 *
 * 这些工作流不 suspend、也不写工作区，组件靠 `data-node-conversion` 帧单向推给前端。
 * 前端据此把组件建进画布，并在**收尾帧**（本模块产出的 `statistics`）到达时做整轮收尾：
 * 路由回大屏根级、清空 nodeId 映射（`useChunkSideEffects.ts` → `finishConversion`）。
 *
 * 所以 `statistics` 不只是给人看的统计——**它是收尾信号**。不发的话前端不清映射，
 * 下一轮生成会被 `addProcessedComponent` 的幂等守卫按「这个 nodeId 已经建过」整片跳过，
 * 表现成「第二次调就没反应了」。
 */

import { StepEnum } from "../../types";

/**
 * 工作流 → 「交付完成」的那个 step id。
 *
 * 判据统一是「该 step 有 output」，但各工作流的交付步不同名：figma/codia 共用
 * nodeConvertToBIStep，requirementToBI 的是 assembleScreenStep。
 */
const DELIVERY_STEP: Record<string, string> = {
  figmaToBIV2Workflow: StepEnum.NODE_CONVERT_TO_BI,
  codiaToBIWorkflow: StepEnum.NODE_CONVERT_TO_BI,
  requirementToBIWorkflow: "assemble-screen"
};

export const isDeliveryWorkflow = (name: string | undefined): boolean => !!name && name in DELIVERY_STEP;

interface Statistics {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  message: string;
  details: string[];
}

/** figma / codia：交付步的 output 是逐节点结果数组 */
const fromNodeConvertOutput = (output: unknown): Statistics => {
  const results = Array.isArray(output) ? (output as Array<{ success?: boolean; skipped?: boolean }>) : [];
  const success = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const skipped = results.filter((r) => r.skipped).length;

  return {
    total: results.length,
    success,
    failed,
    skipped,
    message: "节点转换完成",
    details: [
      `✅ 成功: ${success} 个`,
      failed > 0 ? `❌ 失败: ${failed} 个` : null,
      skipped > 0 ? `⏭️ 跳过: ${skipped} 个 (merge 类型)` : null
    ].filter((d): d is string => d !== null)
  };
};

/** requirementToBI：交付步的 output 是一个汇总对象，`skipped` 是逐条原因说明 */
const fromAssembleOutput = (output: unknown): Statistics => {
  const data = (output ?? {}) as { zoneCount?: number; componentCount?: number; skipped?: string[] };
  const skipped = data.skipped ?? [];
  const componentCount = data.componentCount ?? 0;

  return {
    total: componentCount,
    success: componentCount,
    failed: 0,
    skipped: skipped.length,
    message: "大屏搭建完成",
    details: [`✅ ${data.zoneCount ?? 0} 个分区、${componentCount} 个组件`, ...skipped.map((s) => `⏭️ ${s}`)]
  };
};

/**
 * 剔除各 step 的 input/output（原样透传会把整棵 figma 节点树塞进前端），交付步完成时补 statistics。
 */
export const buildWorkflowProgressChunk = (chunk: unknown) => {
  const raw = chunk as { data: { name?: string; steps?: Record<string, { output?: unknown }> } };
  const steps = raw.data.steps;

  const filteredChunk = {
    ...raw,
    data: {
      ...raw.data,
      steps: steps
        ? Object.fromEntries(Object.entries(steps).map(([id, step]) => [id, { ...step, input: null, output: null }]))
        : steps
    }
  };

  const deliveryStepId = DELIVERY_STEP[raw.data.name ?? ""];
  const output = deliveryStepId ? steps?.[deliveryStepId]?.output : undefined;
  // 交付步还没跑完：原样返回，保持当前进度
  if (!output) {
    return filteredChunk;
  }

  const statistics =
    deliveryStepId === StepEnum.NODE_CONVERT_TO_BI ? fromNodeConvertOutput(output) : fromAssembleOutput(output);

  return { ...filteredChunk, data: { ...filteredChunk.data, statistics } };
};
