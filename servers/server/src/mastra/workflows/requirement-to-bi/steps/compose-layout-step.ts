import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { screenComposerAgent } from "@/mastra/agents/screen-composer-agent";

import { solveLayout, ZoneTreeError } from "../layout/solve-layout";
import { retryGenerate } from "../retry";
import {
  contentItemSchema,
  expandContentItems,
  GRID_COLS,
  GRID_ROWS,
  type SolvedZone,
  type Zone,
  zoneSchema
} from "../types";

/**
 * ① + ② 合成一步：让模型切分区，用代码求解坐标，校验不过就把问题原样喂回去重来。
 *
 * 两步合并是有意的——校验反馈环必须闭合在步内。拆成两个 workflow step 的话，
 * `solveLayout` 抛错时只能整条链路失败，而这类错误（span 不平、内容项漏放）
 * 恰恰是模型看到「哪一层不平、差多少」之后自己就能改对的。
 *
 * 这也是全链路对「子 agent vs workflow step」那个取舍的落点：不给它一个能自主决定
 * 读什么、试什么的循环，而是给一个**由确定性校验器驱动的有限重试**——
 * 纠错能力拿到八成，成本是子 agent 的零头（后者要背十几 k 工具 schema，且 maxSteps 上限 30）。
 */

const MAX_ATTEMPTS = 3;

/** 模型这一步的产出形状。提出来是为了不在 generate 调用处内联递归 schema，见下方类型标注的注释。 */
const zoneTreeOutputSchema = z.object({ zoneTree: zoneSchema });

export const composeLayoutInputSchema = z.object({
  screenId: z.string().describe('大屏标识 "{screenId}_{versionCode}"'),
  canvasWidth: z.number().positive(),
  canvasHeight: z.number().positive(),
  contentItems: z.array(contentItemSchema).min(1)
});

/**
 * `SolvedZone` 是求解器算出来的，不该再过一遍 zod 校验（那只是把代码算的东西重新验一遍）。
 * 但 workflow step 的 outputSchema 是必填的，所以这里用 `z.custom` 透传，
 * 保住类型而不引入一层空转的运行时校验。
 */
const solvedZoneSchema = z.custom<SolvedZone>();

export const composeLayoutOutputSchema = z.object({
  screenId: z.string(),
  canvasWidth: z.number(),
  canvasHeight: z.number(),
  contentItems: z.array(contentItemSchema),
  zones: z.array(solvedZoneSchema),
  /** 分区树重试了几次才通过；1 表示一次过。用于观测模型在这一步的稳定度 */
  attempts: z.number(),
  /**
   * 重试用尽后**仍然**存在的形状偏差。
   *
   * 注意语义变了：第一版是「体检结果，交给调用方判断要不要重来」——而调用方是主 agent，
   * 它拿到「品类占比偏离 4 倍」只能靠手工搬组件去修。实测 d2 因此烧掉 15 步、
   * 中途还撞上「分组位置由成员决定，改分组无效」，最后跑到超时。
   *
   * 现在偏差先喂回本步的重试循环让模型重切（它改一个 span 就解决了），
   * 留到这里的是三次都没消掉的残留，属于内容项数量与画布尺寸的固有约束。
   * **不该再被当成待办**——工作流 description 里已写明不要据此返工。
   */
  aspectWarnings: z.array(z.string())
});

const buildPrompt = (
  input: z.infer<typeof composeLayoutInputSchema>,
  previousIssues: string[] | null,
  previousTree: Zone | null
): string => {
  const inventory = input.contentItems
    .map((c) => {
      const parts = [`- id=${c.id} 「${c.name}」 kind=${c.kind}`];
      if (c.dims?.length) {
        parts.push(`维度=${c.dims.join("/")}`);
      }
      if (c.measures?.length) {
        parts.push(`度量=${c.measures.join("/")}`);
      }
      if (c.views?.length) {
        parts.push(`视图=${c.views.join("/")}`);
      }
      return parts.join(" ");
    })
    .join("\n");

  const retryBlock =
    previousIssues && previousTree
      ? `

## 上一次的产出有问题，请修正后重新输出完整的树

你上次输出的是：
${JSON.stringify(previousTree)}

问题：
${previousIssues.map((i) => `- ${i}`).join("\n")}

请逐条修掉。**注意 span 的含义**：同层子节点 span 之和必须精确等于父节点在该方向的格数，
而父节点在另一方向上的格数是整段继承的（占 10 行的节点若自己是 row，仍然分完整的 24 列）。

形状偏离通常有两种改法，按情况选：把该内容项从"独占一整行"改成与邻项**并排**（换一层 row/col），
或调小它的 span。饼图/占比这类接近正方形的内容尤其不要横铺满屏。`
      : "";

  return `为一块 ${input.canvasWidth}×${input.canvasHeight} 的大屏切分区。网格 ${GRID_COLS} 列 × ${GRID_ROWS} 行。

## 要放置的内容
${inventory}

## 要求
- 输出一棵分区树，每个内容项恰好出现在一个叶子里。
- 只输出结构与 span，**不要输出任何坐标**。
- 主视觉内容应当拿到明显更大的区域；标题条占 1~2 行。
- **一个叶子可以放多个内容项**（\`contentIds\` 是数组，区内沿长边均分）。
  同类的小内容要归到一块区，别一项一块区铺满全屏：
  所有 kpi 收进**一块** \`kpi-strip\`（横排一整行卡片）；性质相近的图表可两两并排进一块区。
  只有主图表、地图、主列表这类大块才独占一块区。
- role 用简短英文语义标签（header / kpi-strip / main-viz / side-list / trend 之类），
  它会被用来检索该区的边框素材与给组件选型当上下文。${retryBlock}`;
};

export const composeLayoutStep = createStep({
  id: "compose-layout",
  description: "把内容清单切成分区树并求解绝对坐标；校验不过时带着问题重试",
  inputSchema: composeLayoutInputSchema,
  outputSchema: composeLayoutOutputSchema,
  execute: async ({ inputData }) => {
    // 多度量的统计卡片先摊成多项单度量 KPI，再进模型。见 `expandContentItems` 的注释——
    // 不摊的话「统计卡片」只会产出一个孤零零的翻牌器。摊平后的清单一路用到底，
    // 也会随 outputSchema 的 contentItems 往下游流，保证选组件 / 组装看到的是同一份。
    const contentItems = expandContentItems(inputData.contentItems);
    const input = { ...inputData, contentItems };

    let issues: string[] | null = null;
    let tree: Zone | null = null;
    /** 切出来了但形状不理想的最好一版；重试用尽时兜底返回它，而不是白丢一棵合法的树 */
    let best: { zones: SolvedZone[]; warnings: string[]; attempt: number } | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      // 显式标注返回类型：`zoneSchema` 是 z.lazy 的递归 schema，交给 generate 的泛型去推
      // 会绕回它自己（TS7022「隐式 any，因为在自身初始化器中被引用」）。这里只取 object，
      // 形状由下一行的断言负责，推导链就断开了。
      // 两层重试是不同性质的，别合并：`retryGenerate` 扛网络抖动（同样的 prompt 重发），
      // 外层这个 for 循环扛校验不过（带着 issues 换一份 prompt 重问）。
      const result: { object: unknown } = await retryGenerate(`分区树（第 ${attempt} 次）`, () =>
        screenComposerAgent.generate([{ role: "user", content: buildPrompt(input, issues, tree) }], {
          structuredOutput: { schema: zoneTreeOutputSchema, jsonPromptInjection: true }
        })
      );

      tree = (result.object as { zoneTree: Zone }).zoneTree;

      try {
        const zones = solveLayout(tree, contentItems, {
          canvasWidth: input.canvasWidth,
          canvasHeight: input.canvasHeight
        });

        const warnings = zones.flatMap((z) => z.aspectWarnings.map((w) => `[${z.role}] ${w}`));
        if (warnings.length === 0) {
          return { ...input, zones, attempts: attempt, aspectWarnings: [] };
        }

        // 形状偏差同样喂回重试循环。**这一步是本文件最要紧的一处**：
        // 以前它直接连着 warnings 返回，主 agent 拿到「偏离 4 倍」只能手工搬组件——
        // 而在这里模型改一个 span 就解决了。同一个问题，两边的代价差两个数量级。
        if (!best || warnings.length < best.warnings.length) {
          best = { zones, warnings, attempt };
        }
        issues = warnings;
        console.warn(`[requirement-to-bi] 分区树第 ${attempt}/${MAX_ATTEMPTS} 次形状偏差`, { warnings });
      } catch (error) {
        if (!(error instanceof ZoneTreeError)) {
          throw error;
        }
        issues = error.issues;
        console.warn(`[requirement-to-bi] 分区树第 ${attempt}/${MAX_ATTEMPTS} 次校验未通过`, { issues });
      }
    }

    // 切出来过、只是形状没调到位：返回偏差最小的那一版。
    // 形状不理想是「不够好」，不是「不合法」，为它整个失败等于把一块能用的屏扔了
    if (best) {
      return { ...input, zones: best.zones, attempts: MAX_ATTEMPTS, aspectWarnings: best.warnings };
    }

    // 三次都切不出一棵合法的树，说明内容清单本身有问题（比如内容项多到切不开），
    // 继续往下走只会产出一块没法看的屏，不如在这里如实失败。
    throw new ZoneTreeError([`分区树连续 ${MAX_ATTEMPTS} 次未通过校验`, ...(issues ?? [])]);
  }
});
