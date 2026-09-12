import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { screenComposerAgent } from "@/mastra/agents/screen-composer-agent";
import { vector } from "@/mastra/vector";
import { embeddingModel } from "@/mastra/vector/embeddingModel";

import { checkColumnWidths, checkDataKeys, checkOptionTypes, describePropSchema } from "../component-schema";
import { retryGenerate } from "../retry";
import { type ContentItem, contentItemSchema, type ContentKind, type Rect, type SolvedZone } from "../types";

/**
 * ③ 每块区选组件并造初始数据。由 workflow `foreach` 控制并发。
 *
 * **能并发是因为每块区完全独立**：选组件不需要知道别的区在干嘛，造数据也不需要。
 * 这正是 agent loop 做不到的——它一次只能想一件事，而且每步都背着前面所有步的上下文。
 *
 * 这一步真正的重头戏是**造数据**，不是选组件。`Module.javaScript` 里的模板自带占位数据
 * （「类目1」「系列A」），一块电力大屏如果建出来长那样就是个空壳、没法给人看。
 * 把它换成「华能电厂 1240MW」这种量级与命名都对的数据，只有模型能干：
 * 规则表写不出来，向量检索也给不了。
 *
 * 选组件为什么不能在内容清单阶段就定：那时还不知道这块区**实际多大**。
 * 同一个 `kind: "rank"`，800×900 的方块该用纵向排行榜，480×270 的宽扁条该用横向条形图。
 * 本步是全链路第一个知道真实尺寸的地方。
 */

const TOP_K = 3;

/** data 键集对不上时最多重问几次。与 compose-layout 的分区树重试同一个量级。 */
const MAX_KEY_ATTEMPTS = 2;

/** 组件文档头部形如：`**组件标识**: echartstripBar | **中文名**: 条形图 | **分类**: 图表 > 柱形图` */
const CN_NAME_RE = /\*\*中文名\*\*[:：]\s*([^|\n]+)/u;

/**
 * 从组件文档里取中文名。
 *
 * 这一步必须做：向量库里的 `componentId` 是 prop 名（`echartstripBar`），
 * 而落盘取模板走的是 `prismaClient.module.findUnique({ where: { name } })`——**按中文名查**。
 * 两边的主键不是同一个，文档头是唯一把它们对上的地方。
 */
export const extractChineseName = (doc: string): string | null => CN_NAME_RE.exec(doc)?.[1]?.trim() ?? null;

export const zoneTaskSchema = z.object({
  zoneIndex: z.number().int().nonnegative(),
  zone: z.custom<SolvedZone>(),
  contents: z.array(contentItemSchema)
});

export const pickedComponentSchema = z.object({
  contentId: z.string(),
  /** prop 名，如 `echartstripBar`；来自向量库 */
  prop: z.string(),
  /** 中文名，如「条形图」；落盘时按它查 `Module` 取模板 */
  componentName: z.string(),
  /** 组件的 `data` 字段初始值，形状由所选组件的文档决定 */
  data: z.array(z.record(z.string(), z.unknown())),
  /** 需要覆盖进模板的 option 片段（标题、单位、配色等），可为空 */
  option: z.record(z.string(), z.unknown()).optional()
});

export const zoneComponentsSchema = z.object({
  zoneIndex: z.number(),
  success: z.boolean(),
  picked: z.array(pickedComponentSchema),
  error: z.string().optional()
});

/**
 * 各内容形态对应的**中文**检索词。
 *
 * 直接把 `kind`（"kpi"/"title"/"trend"…）拼进检索串是行不通的：embedding 模型是
 * `BAAI/bge-large-zh-v1.5`——中文模型，而组件文档也全是中文。英文枚举值在这个语义空间里
 * 就是噪声，会把检索带偏。实测代价很具体：`title` 检出「终端交互」、`kpi` 检出「进度条」、
 * `trend` 检出「环比同比图」，一屏组件全选错，上游 agent 只好推翻重来。
 *
 * `role` 同理不进检索串——它是英文语义标签（header / kpi-strip / main-viz），
 * 用途是给组件选型当上下文和检索素材，不该混进这条中文向量查询。
 */
const KIND_QUERY: Record<ContentKind, string> = {
  kpi: "指标卡 单个数值突出展示 数字翻牌 计数器",
  trend: "折线图 面积图 时间序列 趋势曲线",
  rank: "条形图 柱状图 排行榜 分类对比",
  // 「环形图」这个词不能写：库里的 echartring 是**进度环**（schema 是 {value,total} 单项），
  // 不是饼图。实测带上它会让 echartring 以 0.596 排到第一、把 echartpie 挤到第三，
  // 模型只好拿进度环去凑五条占比数据。去掉这一个词，echartpie 就回到第一。
  share: "饼图 占比构成 百分比分布 扇形",
  list: "表格 明细列表 滚动轮播列表",
  map: "地图 地理分布 区域分布",
  title: "文本框 标题文字 富文本",
  other: "通用图表"
};

/** 组件检索：内容语义 + 形态中文词 + 区域形状，全中文，与文档同一语义空间 */
const buildQuery = (item: ContentItem, itemRect: Rect): string => {
  const shape =
    itemRect.width >= itemRect.height * 1.6 ? "宽扁横向" : itemRect.height >= itemRect.width ? "高窄纵向" : "方形";
  return [item.name, KIND_QUERY[item.kind], item.dims?.join(" "), item.measures?.join(" "), shape]
    .filter(Boolean)
    .join(" ");
};

interface Candidate {
  prop: string;
  componentName: string;
  doc: string;
  score: number;
}

const searchCandidates = async (query: string): Promise<Candidate[]> => {
  const { embeddings } = await embeddingModel.doEmbed({ values: [query] });
  const results = await vector.query({ indexName: "component_docs", queryVector: embeddings[0], topK: TOP_K });

  return results
    .map((r) => {
      const doc = (r.metadata?.text as string | undefined) ?? "";
      const prop = (r.metadata?.componentId as string | undefined) ?? "";
      const componentName = extractChineseName(doc);
      return componentName && prop ? { prop, componentName, doc, score: r.score ?? 0 } : null;
    })
    .filter((c): c is Candidate => c !== null);
};

export const pickComponentsStep = createStep({
  id: "pick-components",
  description: "为单块分区选定组件并生成领域相关的初始数据；由 workflow foreach 控制并发",
  inputSchema: zoneTaskSchema,
  outputSchema: zoneComponentsSchema,
  execute: async ({ inputData }) => {
    const { zone, contents, zoneIndex } = inputData;
    const byId = new Map(contents.map((c) => [c.id, c]));

    try {
      const picked: Array<z.infer<typeof pickedComponentSchema>> = [];

      for (const item of zone.items) {
        const content = byId.get(item.contentId);
        if (!content) {
          throw new Error(`内容项 ${item.contentId} 不在清单里`);
        }

        const candidates = await searchCandidates(buildQuery(content, item.rect));
        if (candidates.length === 0) {
          throw new Error(`组件库里没检索到「${content.name}」可用的组件`);
        }

        // 候选文档只负责**选型判断**（这组件是干嘛的、跟别的有什么区别），字段结构另取。
        //
        // 此前这里只喂文档、提示词却写着「按文档里写明的字段结构」——而向量库里的文档只有 19 行，
        // 压根没有字段结构，模型只能现编：实测同一轮三个 ft-countup-v2 编出三套字段名，
        // 而它真实的 data schema 只有 { value }，标签全丢、KPI 渲染成裸数字。
        // 现在字段结构一律取 componentPropSchemaMap，与落盘校验用的是同一份权威。
        const candidateBlock = candidates
          .map((c, i) => {
            const brief = describePropSchema(c.prop);
            const schemaBlock = brief.text ? `\n\n**${c.prop} 的字段结构（权威，以此为准）**\n${brief.text}` : "";
            return `### 候选 ${i + 1}：${c.componentName}（${c.prop}）\n${c.doc}${schemaBlock}`;
          })
          .join("\n\n");

        // 键集对不上就带着「少了什么、多了什么」重问一次。
        //
        // 与 compose-layout 的重试同一个套路：确定性校验器驱动的有限重试，而不是给模型
        // 一个能自主决定读什么的循环。这一步能这么做，正是因为「要查什么」是确定的
        // ——就是选中那个 prop 的 schema，`componentPropSchemaMap` 直接给得出。
        let keyFeedback = "";
        let chosen: Omit<z.infer<typeof pickedComponentSchema>, "contentId"> | null = null;
        let matched = candidates[0];
        let validated = false;

        for (let attempt = 1; attempt <= MAX_KEY_ATTEMPTS; attempt += 1) {
          const result = await retryGenerate(`选组件「${content.name}」（第 ${attempt} 次）`, () =>
            screenComposerAgent.generate(
              [
                {
                  role: "user",
                  content: `为大屏上的一块区域选定组件并生成初始数据。

## 这块区
- 角色：${zone.role}
- 实际尺寸：${item.rect.width} × ${item.rect.height} 像素
- 容器类型：${zone.container}${zone.states ? `（可切换状态：${zone.states.join(" / ")}）` : ""}

## 要展示的内容
- 名称：${content.name}
- 形态：${content.kind}${content.dims?.length ? `\n- 维度：${content.dims.join("、")}` : ""}${
                    content.measures?.length ? `\n- 度量：${content.measures.join("、")}` : ""
                  }${content.unit ? `\n- 单位：${content.unit}` : ""}

## 候选组件（按相关度排序）
${candidateBlock}

## 要求
1. 从候选里选**一个**最合适的，\`prop\` 与 \`componentName\` 必须与该候选完全一致。
2. 尺寸是硬约束：宽扁的区选横向形态，高窄的区选纵向形态或列表。
3. \`data\` 必须严格用该候选「字段结构」一节列出的字段名，一个都不能错、也不要多加。
4. 数据内容要贴合业务领域，量级与命名都要真实。**不要出现「类目1」「系列A」这类占位词。**
5. 造 5~8 条数据即可，够看出形态就行。
6. 名称 / 单位 / 标签这类**文字**不要塞进 data——data 只放上面列出的那几个字段。
   要显示的文字写进 option 的文本字段（如翻牌器的 prefixText），不写就没有标签。${keyFeedback}`
                }
              ],
              {
                structuredOutput: { schema: pickedComponentSchema.omit({ contentId: true }), jsonPromptInjection: true }
              }
            )
          );

          chosen = result.object as Omit<z.infer<typeof pickedComponentSchema>, "contentId">;

          // 模型可能把 prop 和中文名配错对（比如选了候选 2 的中文名配候选 1 的 prop）。
          // 这两个值下游一个用于校验、一个用于查模板，配错了会静默建出另一种组件，所以按 prop 对齐回来。
          matched = candidates.find((c) => c.prop === chosen!.prop) ?? candidates[0];

          const check = checkDataKeys(matched.prop, chosen.data ?? [], chosen.option);
          // option 的类型错和 data 的键错一起反馈：两者都只有在这里还改得动——
          // 落盘那层对它们都只是 warning，到浏览器才炸
          const optionProblems = checkOptionTypes(matched.prop, chosen.option);
          // 列驱动组件（轮播表格这类）还得查列宽总和有没有超出这块区的实际宽度，
          // 不然形状对、总量超，渲染出来就是挤压或溢出
          const columnWidthProblem = checkColumnWidths(matched.prop, chosen.option, item.rect.width);
          if (check.ok && optionProblems.length === 0 && !columnWidthProblem) {
            validated = true;
            break;
          }

          keyFeedback =
            `\n\n## 上一次的输出对不上 ${matched.prop} 的 schema，请改正后重新输出\n` +
            optionProblems.map((problem) => `- option.${problem}\n`).join("") +
            (columnWidthProblem ? `- option.${columnWidthProblem}\n` : "") +
            (check.missing.length > 0 ? `- 缺少必须有的字段：${check.missing.join("、")}\n` : "") +
            (check.extra.length > 0
              ? `- 多了 schema 里没有的字段：${check.extra.join("、")}（这些会被静默丢弃，文字请改放 option）\n`
              : "") +
            (check.note ? `- ${check.note}\n` : "");
          console.warn(`[requirement-to-bi] 「${content.name}」第 ${attempt}/${MAX_KEY_ATTEMPTS} 次未对齐`, {
            prop: matched.prop,
            ...check,
            optionProblems,
            columnWidthProblem
          });
        }

        // 两轮都没对齐 schema 时不能放行：`chosen` 这时依然非空（模型总归返回了点什么），
        // 之前只判断 `!chosen` 会让最后一次没对齐的坏结果照样落地——键错位、option 类型错
        // 都是渲染时会真炸的问题，不是「差不多就行」。
        if (!chosen || !validated) {
          throw new Error(`「${content.name}」连续 ${MAX_KEY_ATTEMPTS} 次没能对齐 ${matched.prop} 的字段结构`);
        }

        picked.push({
          contentId: item.contentId,
          prop: matched.prop,
          componentName: matched.componentName,
          data: chosen.data ?? [],
          ...(chosen.option ? { option: chosen.option } : {})
        });
      }

      return { zoneIndex, success: true, picked };
    } catch (error) {
      // 单块区失败不该拖垮整块屏：后面组装时跳过它，其余区照常落地，
      // 报告里带出是哪块区没成，人可以只补那一块。
      return {
        zoneIndex,
        success: false,
        picked: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});
