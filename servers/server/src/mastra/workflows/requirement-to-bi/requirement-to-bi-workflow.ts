import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { assembleScreenStep } from "./steps/assemble-screen-step";
import { composeLayoutStep } from "./steps/compose-layout-step";
import type { zoneComponentsSchema } from "./steps/pick-components-step";
import { pickComponentsStep } from "./steps/pick-components-step";
import { contentItemSchema, type SolvedZone } from "./types";

/**
 * 从自然语言需求从零搭建大屏。
 *
 * **入参是已经跟用户确认过的内容清单，不是原始需求。**
 * 需求收敛与 `ask_user_question` 确认留在对话层（主 agent）做，不进工作流——
 * 一是工作流里挂起会让状态管理复杂一档，二是「你要看哪些指标」这种问题天然属于对话，
 * 而主 agent 已经很擅长它。工作流只负责确认之后那段确定性的重活。
 *
 * 整条链路七步里**只有两步调模型**（分区、选组件+造数据），其余全是检索与计算：
 *
 *   agent  需求收敛 + 确认                     ← 工作流外
 *   ①②     内容清单 → 分区树 → 绝对坐标         模型 1 次（校验不过内部重试）
 *   ③      每块区 → 组件 + 初始数据             模型 N 次并发
 *   ⑤      组装 → syncScreenData                纯代码
 *   agent  拿结果继续迭代                       ← 工作流外
 *
 * 这么切的理由是实测出来的：agent loop 每步固定前缀约 37k token（其中工具 schema 占 19k），
 * 一块 20 组件的屏逐个 `create_component` 是 20 多步、740k+ prompt、20 多个网络来回；
 * 工作流形态下模型调用降到个位数，且 ③ 天生可并发。
 *
 * ## 配色不归这条工作流管（刻意的，别再加回来）
 *
 * 曾经有个 `styleHint` 入参，一路传进两个模型步的提示词——但两步都改不了配色：
 * `describePropSchema` 用 `STYLE_OPTION_RE` 主动剔掉了所有颜色字号字段（每块区并发调用，
 * 各自选色等于全屏一致性靠运气），画布背景也从不设置。**入参承诺了做不到的事**，
 * 实测后果是完整的一条链：agent 照着 schema 去问用户风格 → 用户选了「浅色清爽风」→
 * 产出仍是深色 → agent 判定要整屏返工 → 6 个组件几十个配色字段、合法值全靠猜 →
 * 委派子 agent → 跑到超时。整轮里它每一步都没做错，错的是那个空承诺。
 *
 * 而「按主题给组件上色」这件事本身在本仓有先例：前端 `chatBiBox/aiEchartConfig.ts` 为
 * 饼图/柱/线/表**各写了一段**配色映射，字段名完全不重叠——116 个组件里只覆盖了 4 个，
 * 且 `theme.ts` 五套调色板全是深底亮色，平台里根本不存在「浅色」。
 * （另有 `AIChartBoxContent.ts` 的 `updateThemeColorByAll` 是个空函数，同一个念头的遗迹。）
 * 工作流选哪个组件是向量检索出来的开放集，枚举不完，所以这条路不通。
 *
 * 视觉的出路是下面的 ④ 素材层：垫边框底纹，不碰组件配色。
 *
 * ## 还没做的两块
 *
 * **④ 素材层**：每块区垫一张边框素材（`ft-img`，zIndex 最低，组件放进它的 safeArea）。
 * 依赖一个尚不存在的素材向量库（`material_assets` 索引），素材库建好后在 ③ 之后并行插入。
 * 缺它的后果是产出「结构对但没有大屏感」——`ft-folder` 的 option 里没有任何可见样式
 * （只有 transform 与 backdropFilter），所以视觉完全靠素材承担。
 *
 * **⑥ 面板切换联动**：多状态区已经建出了 panelData 骨架，但还没配切换器。
 * 这一步是纯机械推导（N 个状态 → 一个 N 项 subtabs → 一个 click 事件 → 切状态行为），
 * 且所需工具链（`createEventTemplate`）已被 b1/b5/b6/b7 四个 eval case 验证过。
 */
export const requirementToBIWorkflow = createWorkflow({
  id: "requirementToBIWorkflow",
  description:
    "根据已确认的内容清单从零搭建一块大屏（分区 → 求解坐标 → 选组件造数据 → 推给前端建进画布）。" +
    "入参 contentItems 必须是先与用户确认过的内容清单，不要拿用户原话直接调；" +
    "screenId 取自 <editor-context>。" +
    "**产出是骨架**：分区、组件、mock 数据、文案，配色一律沿用组件模板默认值（深色系）。" +
    "本工作流不做配色，也不接数据源——不要为了配色去问用户风格偏好。" +
    "返回的 aspectWarnings 是内部已重试三次仍消不掉的形状偏差，属于内容项数量与画布的固有约束，" +
    "**不要据此重排布局**；用户明确提出要改再动。",
  inputSchema: z.object({
    screenId: z.string().describe('大屏标识 "{screenId}_{versionCode}"，如 "9001_1"'),
    canvasWidth: z.number().positive().default(1920),
    canvasHeight: z.number().positive().default(1080),
    contentItems: z.array(contentItemSchema).min(1).describe("已与用户确认的内容清单")
  }),
  outputSchema: z.object({
    screenId: z.string(),
    zoneCount: z.number(),
    componentCount: z.number(),
    attempts: z.number(),
    aspectWarnings: z.array(z.string()),
    skipped: z.array(z.string())
  })
})
  .then(composeLayoutStep)
  // 分区数运行时才确定，交给 foreach 的内建并发控制。每块区互不依赖，所以能并发——
  // 选组件不需要知道别的区在干嘛，造数据也不需要。
  .map(async ({ inputData }) => {
    const data = inputData as {
      zones: SolvedZone[];
      contentItems: z.infer<typeof contentItemSchema>[];
    };
    return data.zones.map((zone, zoneIndex) => ({
      zoneIndex,
      zone,
      contents: data.contentItems
    }));
  })
  .foreach(pickComponentsStep, { concurrency: 4 })
  // foreach 的输出只有各区的选型结果，组装还需要 zones 与 screenId——从初始入参与
  // composeLayout 的产出里取回。`getStepResult` 而不是把它们一路透传，是为了让 foreach
  // 的入参保持最小（每个 item 都会被完整序列化一次）。
  .map(async ({ inputData, getStepResult }) => {
    const layout = getStepResult(composeLayoutStep);
    return {
      screenId: layout.screenId,
      zones: layout.zones as SolvedZone[],
      zoneComponents: inputData as z.infer<typeof zoneComponentsSchema>[]
    };
  })
  .then(assembleScreenStep)
  .map(async ({ inputData, getStepResult }) => {
    const layout = getStepResult(composeLayoutStep);
    const assembled = inputData as { screenId: string; zoneCount: number; componentCount: number; skipped: string[] };
    return {
      ...assembled,
      attempts: layout.attempts,
      aspectWarnings: layout.aspectWarnings
    };
  })
  .commit();
