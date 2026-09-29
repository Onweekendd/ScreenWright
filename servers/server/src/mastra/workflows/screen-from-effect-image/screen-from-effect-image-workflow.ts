import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { assembleScreenStep } from "../requirement-to-bi/steps/assemble-screen-step";
import type { zoneComponentsSchema } from "../requirement-to-bi/steps/pick-components-step";
import type { SolvedZone } from "../requirement-to-bi/types";
import { analyzeEffectImageStep } from "./steps/analyze-effect-image-step";
import { pickComponentOrAssetStep } from "./steps/pick-component-or-asset-step";
import type { ResolvedRegion } from "./types";

/**
 * 生图 → 大屏，②+③ 两段：`analyzeEffectImage`（划区+吸附+裁切/重画）→
 * `pickComponentOrAsset`（数据区查表选组件+造数据，asset/text 代码直接构造）→
 * `assembleScreen`（组装落屏，原样复用 `requirement-to-bi` 那份，零改动）。
 *
 * **①（生 2 张效果图）和「⏸挑一张」不在这条工作流里**：那是重活+人工选择，
 * 由 agent 在对话层先调另一条工作流（`genEffectImagesWorkflow`，TODO）、
 * 等用户选完再把 `imageId` 传进这里——沿用 `requirement-to-bi` 已确立的原则：
 * 人做选择留在对话层，工作流只做确认之后的确定性重活。
 *
 * 链路里**不再有第二个 ⏸**：组件范围收窄到 4 类之后，图表候选就 1~3 个，
 * 默认取第一个即可，不必为了「挑组件」再挂起等用户——用户不满意可以事后用
 * 已有的改组件类工具调整，成本比在工作流里加一次人工确认低得多。
 *
 * 与 `requirement-to-bi-workflow.ts` 同一种链式写法，`.foreach` 之后的
 * `.map` 两处胶水代码也是照抄那边的写法（`getStepResult` 取回 zones，
 * 而不是让 foreach 的每个 item 都带一份完整 zones 序列化一遍）。
 *
 * 详细设计与「为什么这么切」见 `docs/生图到大屏工作流.md`。
 */
export const screenFromEffectImageWorkflow = createWorkflow({
  id: "screenFromEffectImageWorkflow",
  description:
    "把效果图变成大屏：划区 → 吸附裁切素材 → 数据区选组件造数据 → 组装进画布。" +
    "入参 imageId 必须是用户已经在 ① genEffectImages 的产物里选中的那张。" +
    "screenId 取自 <editor-context>。产出同样是骨架：数据是造的，图表配色取自效果图主色。",
  inputSchema: z.object({
    screenId: z.string().describe('大屏标识 "{screenId}_{versionCode}"，如 "9001_1"'),
    canvasWidth: z.number().positive().default(1920),
    canvasHeight: z.number().positive().default(1080),
    imageId: z.string().min(1).describe("用户已选中的效果图 id")
  }),
  outputSchema: z.object({
    screenId: z.string(),
    zoneCount: z.number(),
    componentCount: z.number(),
    skipped: z.array(z.string())
  })
})
  .then(analyzeEffectImageStep)
  // 分区数运行时才确定，交给 foreach 的内建并发控制；每块区互不依赖，
  // 选组件不需要知道别的区在干嘛，造数据也不需要——与 requirement-to-bi 同一个理由。
  .map(async ({ inputData }) => {
    const data = inputData as { zones: SolvedZone[]; resolved: ResolvedRegion[][]; palette?: string[] };
    return data.zones.map((zone, zoneIndex) => ({
      zoneIndex,
      zone,
      resolved: data.resolved[zoneIndex],
      palette: data.palette
    }));
  })
  .foreach(pickComponentOrAssetStep, { concurrency: 4 })
  .map(async ({ inputData, getStepResult }) => {
    const layout = getStepResult(analyzeEffectImageStep);
    return {
      screenId: layout.screenId,
      zones: layout.zones as SolvedZone[],
      zoneComponents: inputData as z.infer<typeof zoneComponentsSchema>[]
    };
  })
  .then(assembleScreenStep)
  .commit();
