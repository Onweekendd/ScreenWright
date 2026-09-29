import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { screenComposerAgent } from "@/mastra/agents/screen-composer-agent";

import {
  checkColumnWidths,
  checkDataKeys,
  checkOptionTypes,
  describePropSchema
} from "../../requirement-to-bi/component-schema";
import { retryGenerate } from "../../requirement-to-bi/retry";
import { type pickedComponentSchema, zoneComponentsSchema } from "../../requirement-to-bi/steps/pick-components-step";
import type { SolvedZone } from "../../requirement-to-bi/types";
import {
  CAROUSEL_TABLE_COMPONENT,
  CHART_CLASS_TABLE,
  CHART_VARIANT_TABLE,
  type ChartCandidate,
  type ChartSpec,
  IMAGE_COMPONENT,
  type ResolvedRegion,
  RICHTEXT_COMPONENT
} from "../types";
import { chartThemePatch } from "./chart-theme";

/**
 * ② 每块区决定用哪个组件，或者（asset/text）根本不用挑，代码直接构造。
 * 替代 `requirement-to-bi/steps/pick-components-step.ts` 在这条链路里的位置。
 *
 * **和原版的核心差别**：原版是 116 个组件的 embedding 检索——因为从零建屏时
 * 只知道「这块区要显示什么语义内容」，具体长什么样要靠检索去猜。这条链路的区域
 * 来自效果图，vision 已经看出了真实视觉形态（这块明摆着是个折线图），检索反而是
 * 画蛇添足、还会引入检索误差。改成查表：`contentKind` → 固定候选（`CHART_CLASS_TABLE`），
 * `list`/`title-or-other`/`asset` 三类甚至连查表都不用，候选只有一个选项。
 *
 * **输出 schema 与原版完全一致**（复用 `zoneComponentsSchema`），所以
 * `assembleScreenStep` 不用改一行——参见 `docs/生图到大屏工作流.md` 里的复用矩阵。
 */

export const regionTaskSchema = z.object({
  zoneIndex: z.number().int().nonnegative(),
  zone: z.custom<SolvedZone>(),
  /** 与 zone.items 同序同长：一张卡片的框、页签条、标题、图表各一条 */
  resolved: z.array(z.custom<ResolvedRegion>()),
  /** vision 从效果图取的主色（#rrggbb），写进图表系列色；没有就沿用模板默认色 */
  palette: z.array(z.string()).optional()
});

type PickedComponent = Omit<z.infer<typeof pickedComponentSchema>, "contentId">;

/** data 键集对不上时最多重问几次，与 pick-components 同一个量级。 */
const MAX_KEY_ATTEMPTS = 2;

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** kind=asset：生图/裁切的结果就是最终产物，直接构造，不调模型、不挑选。 */
const pickForAsset = (resolved: ResolvedRegion): PickedComponent => ({
  ...IMAGE_COMPONENT,
  // swImg/index.vue 读的是 dataChart[0].value，option.url 只是编辑面板的回显
  data: [{ value: resolved.asset?.url ?? "" }],
  option: { url: resolved.asset?.url ?? "", pointerEvents: false }
});

/**
 * kind=text：vision 读出的文字直接塞进富文本组件，同样不挑选。
 * 大屏标题用效果图主色加粗——效果图里的主标题几乎都是主题色发光大字，落成白色普通字整屏就"素"了。
 */
const pickForText = (resolved: ResolvedRegion, palette: string[] | undefined): PickedComponent => {
  const value = resolved.text?.value ?? "";
  const isScreenTitle = resolved.region.role === "screen-title";
  const style = isScreenTitle
    ? `font-size:36px;font-weight:bold${palette?.[0] ? `;color:${palette[0]}` : ""}`
    : "font-size:20px";
  return {
    ...RICHTEXT_COMPONENT,
    data: [],
    option: {
      content: value ? `<p style="text-align:center"><span style="${style}">${escapeHtml(value)}</span></p>` : ""
    }
  };
};

/** contentKind=list：固定选轮播表格，不查 CHART_CLASS_TABLE（那张表只覆盖图表类）。 */
const pickForList = (): PickedComponent => ({ ...CAROUSEL_TABLE_COMPONENT, data: [], option: {} });

/**
 * 图表类：查表选组件，调模型只是为了造贴合业务的初始数据。
 * 数据生成 + 校验 + 重试的写法照抄 `pick-components-step.ts`，只是候选来源从 `searchCandidates`（embedding）
 * 换成查表，提示词里的约束来自 vision 读出的 `ChartSpec`（系列名、x 刻度、y 量级、单位），不是 dims/measures。
 *
 * 选组件：`chart.variant` 一对一查 `CHART_VARIANT_TABLE`；vision 没给规格（或 other）时退回 contentKind
 * 查 `CHART_CLASS_TABLE` 取第一个。多候选不挂起等用户选——用户事后用改组件工具调整，成本比在工作流里加人工确认低。
 */
const chooseChart = (region: ResolvedRegion["region"]): ChartCandidate => {
  const byVariant = region.chart ? CHART_VARIANT_TABLE[region.chart.variant] : undefined;
  if (byVariant) {
    return byVariant;
  }
  const candidates = region.contentKind ? CHART_CLASS_TABLE[region.contentKind] : undefined;
  if (!candidates || candidates.length === 0) {
    throw new Error(`区域「${region.role}」的 contentKind=${region.contentKind} 没有对应的图表候选`);
  }
  return candidates[0];
};

/** 把 vision 读到的图表规格写成提示词里的约束；读到什么写什么，没读到的不编 */
const describeChartSpec = (spec: ChartSpec | undefined): string => {
  if (!spec) {
    return "";
  }
  const lines: string[] = [];
  if (spec.series?.length) {
    lines.push(
      `- 系列（图例原文）：${spec.series.join("、")}——data 里的 seriesName **必须恰好是这几个**，每个系列都要有完整数据`
    );
  } else if (spec.seriesCount && spec.seriesCount > 1) {
    lines.push(
      `- 效果图里画了 ${spec.seriesCount} 个系列，data 里也要有 ${spec.seriesCount} 个 seriesName，起真实的业务名`
    );
  }
  if (spec.values?.length && spec.series?.length) {
    const pairs = spec.series.map((name, i) => `${name}=${spec.values![i] ?? "?"}`).join("、");
    lines.push(`- 图上标出的数值/占比：${pairs}——value 按这个比例造（百分比就按占比分配）`);
  }
  if (spec.xLabels?.length) {
    lines.push(
      `- x 轴刻度（原文、按序）：${spec.xLabels.join("、")}——data 的 name **必须恰好是这 ${spec.xLabels.length} 个**，一个不多一个不少`
    );
  }
  if (spec.yRange) {
    lines.push(`- y 轴范围 ${spec.yRange[0]} ~ ${spec.yRange[1]}：value 的量级要落在这个区间里，有起伏但别贴边`);
  }
  if (spec.unit) {
    lines.push(`- 单位：${spec.unit}（填进 option 的单位字段，不要拼进数值）`);
  }
  if (spec.yAxisName) {
    lines.push(`- 轴名原文：${spec.yAxisName}（填进 option 的轴名字段）`);
  }
  return lines.length > 0 ? `\n\n## 效果图上读到的规格（照此造，别自由发挥）\n${lines.join("\n")}` : "";
};

const pickForChart = async (
  resolved: ResolvedRegion,
  rect: SolvedZone["rect"],
  palette: string[] | undefined
): Promise<PickedComponent> => {
  const contentKind = resolved.region.contentKind;
  const spec = resolved.region.chart;
  const chosen = chooseChart(resolved.region);
  // 系列名对齐 + 配色由代码补，模型对这两件事的输出不作数（理由见 chart-theme.ts）
  const themed = (data: PickedComponent["data"], option: Record<string, unknown> | undefined): PickedComponent => ({
    ...chosen,
    data,
    option: { ...(option ?? {}), ...chartThemePatch(chosen.prop, data, palette, spec) }
  });

  const brief = describePropSchema(chosen.prop);
  if (!brief.text) {
    return themed([], undefined);
  }

  let keyFeedback = "";
  for (let attempt = 1; attempt <= MAX_KEY_ATTEMPTS; attempt += 1) {
    const result = await retryGenerate(`造数据「${resolved.region.role}」（第 ${attempt} 次）`, () =>
      screenComposerAgent.generate(
        [
          {
            role: "user",
            content: `为大屏上的一块区域生成初始数据。组件已经定了，你只造数据。

## 这块区
- 语义：${resolved.region.role}
- 形态：${spec?.variant ?? contentKind}
- 实际尺寸：${rect.width} × ${rect.height} 像素${describeChartSpec(spec)}

## 组件：${chosen.componentName}（${chosen.prop}）
${brief.text}

## 要求
1. \`prop\` 填 "${chosen.prop}"，\`componentName\` 填 "${chosen.componentName}"，不要改。
2. \`data\` 必须严格用上面「字段结构」列出的字段名，一个都不能错、也不要多加。
3. 数据内容要贴合这块区的语义，量级与命名都要真实。**不要出现「类目1」「系列A」这类占位词。**
4. 没给 x 轴刻度时造 5~8 个类目即可，够看出形态就行。
5. 名称 / 单位 / 标签这类**文字**不要塞进 data——要显示的文字写进 option 的文本字段。
6. 多系列时 data 里的 \`seriesName\` 就是图例上显示的名字，起真实的业务名（如「火电」「水电」），图例、系列色这些 option 字段不用你填。${keyFeedback}`
          }
        ],
        {
          structuredOutput: {
            schema: z.object({
              data: z.array(z.record(z.string(), z.unknown())),
              option: z.record(z.string(), z.unknown()).optional()
            }),
            jsonPromptInjection: true
          }
        }
      )
    );

    const { data, option } = result.object;
    const check = checkDataKeys(chosen.prop, data, option);
    const optionProblems = checkOptionTypes(chosen.prop, option);
    const columnWidthProblem = checkColumnWidths(chosen.prop, option, rect.width);
    if (check.ok && optionProblems.length === 0 && !columnWidthProblem) {
      return themed(data, option);
    }

    keyFeedback =
      `\n\n## 上一次的输出对不上 ${chosen.prop} 的 schema，请改正后重新输出\n` +
      optionProblems.map((problem) => `- option.${problem}\n`).join("") +
      (columnWidthProblem ? `- option.${columnWidthProblem}\n` : "") +
      (check.missing.length > 0 ? `- 缺少必须有的字段：${check.missing.join("、")}\n` : "") +
      (check.extra.length > 0 ? `- 多了 schema 里没有的字段：${check.extra.join("、")}（会被静默丢弃）\n` : "") +
      (check.note ? `- ${check.note}\n` : "");
    console.warn(`[screen-from-effect-image] 「${resolved.region.role}」第 ${attempt}/${MAX_KEY_ATTEMPTS} 次未对齐`, {
      prop: chosen.prop,
      ...check,
      optionProblems,
      columnWidthProblem
    });
  }

  // 造不出对齐的数据不该丢掉这块区：组件模板自带占位数据，先落地一个"形状对"的空壳，
  // 比整块区消失强——用户至少能看到这里是个折线图，再让 agent 单独补数据
  console.warn(
    `[screen-from-effect-image] 「${resolved.region.role}」连续 ${MAX_KEY_ATTEMPTS} 次没对齐，用模板默认数据落地`
  );
  return themed([], undefined);
};

export const pickComponentOrAssetStep = createStep({
  id: "pick-component-or-asset",
  description: "asset/text 代码直接构造，chart 类查表 + 模型造数据；输出与 pick-components 同形状",
  inputSchema: regionTaskSchema,
  outputSchema: zoneComponentsSchema,
  execute: async ({ inputData }) => {
    const { zoneIndex, zone, resolved, palette } = inputData;
    if (zone.items.length === 0 || zone.items.length !== resolved.length) {
      return { zoneIndex, success: false, picked: [], error: `区「${zone.role}」的 items 与解析结果对不上` };
    }

    const picked: Array<PickedComponent & { contentId: string }> = [];
    const problems: string[] = [];
    for (const [i, item] of zone.items.entries()) {
      const one = resolved[i];
      try {
        picked.push({ contentId: item.contentId, ...(await pickOne(one, item.rect, palette)) });
      } catch (error) {
        // 一张卡片里某一项失败（比如造数据没对齐）不该连框带标题一起丢
        problems.push(`${one.region.role}：${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (picked.length === 0) {
      return { zoneIndex, success: false, picked: [], error: problems.join("；") };
    }
    if (problems.length > 0) {
      console.warn(`[screen-from-effect-image] 区「${zone.role}」部分项未落地`, problems);
    }
    return { zoneIndex, success: true, picked };
  }
});

const pickOne = async (
  resolved: ResolvedRegion,
  rect: SolvedZone["rect"],
  palette: string[] | undefined
): Promise<PickedComponent> => {
  switch (resolved.region.kind) {
    case "asset":
      return pickForAsset(resolved);
    case "text":
      return pickForText(resolved, palette);
    case "component": {
      const kind = resolved.region.contentKind;
      if (kind === "list") {
        return pickForList();
      }
      if ((kind && kind in CHART_CLASS_TABLE) || (resolved.region.chart && resolved.region.chart.variant !== "other")) {
        return pickForChart(resolved, rect, palette);
      }
      // title / other / 没给 contentKind：没有对应图表，退成一个空富文本占位，比整块消失强
      return pickForText({ ...resolved, text: { value: resolved.region.text ?? "" } }, palette);
    }
  }
};
