/**
 * 从零构建大屏：全链路的类型契约。
 *
 * 三层数据依次是 **内容清单 → 分区树 → 已求解分区**，每一层只回答一类问题，
 * 边界是刻意划的（谁能填什么，比字段本身更重要）：
 *
 *   内容清单（模型答「用户要看什么」）  —— 不含任何布局信息
 *   分区树  （模型答「怎么切」）        —— 只有结构与格数，**没有坐标、没有容器类型**
 *   已求解  （代码算出来的）            —— 坐标、容器类型、区内位置
 *
 * 这么切是为了让模型填不出错误答案，而不是靠事后校验：
 * - 坐标由代码算 ⇒ 重叠与出界在结构上不可能发生，不是「要检查的错误」
 * - 容器类型由 `ContentItem.views` 机械推导 ⇒ 模型压根没有这个选项
 * - 长宽比由 `kind` 查表 ⇒ 「饼图该是方的」是组件类型的属性，不该每块屏现编一遍
 */
import { z } from "zod";

// ── 一、内容清单 ──────────────────────────────────────────────────────────────

/**
 * 内容形态。**这不是组件名**——组件在第 ③ 步才选，那时才知道实际区域尺寸。
 *
 * 它有两个下游用途：查长宽比（{@link ASPECT_BY_KIND}）、给组件检索当语义提示。
 */
export const contentKindSchema = z.enum([
  /** 单个数值指标（总量、实时值） */
  "kpi",
  /** 随时间变化的曲线 */
  "trend",
  /** 分类之间的横向对比、排名 */
  "rank",
  /** 占比构成（饼/环/漏斗） */
  "share",
  /** 明细列表、告警流水 */
  "list",
  /** 地理分布 */
  "map",
  /** 标题、说明文字 */
  "title",
  /** 上面都不像时的兜底，长宽比按 1.6 处理 */
  "other"
]);

export type ContentKind = z.infer<typeof contentKindSchema>;

export const contentItemSchema = z.object({
  id: z.string().min(1).describe("内容项唯一标识，分区树用它引用本项"),
  name: z.string().min(1).describe("展示名称，会成为组件标题，如「各厂站出力对比」"),
  kind: contentKindSchema,
  dims: z.array(z.string()).optional().describe('维度字段中文名，如 ["厂站"]、["时间","能源类型"]'),
  measures: z.array(z.string()).optional().describe('度量字段中文名，如 ["出力"]'),
  unit: z.string().optional().describe('单位，如 "MW"、"Hz"、"%"'),
  /**
   * 多视图。**这是决定容器类型的唯一依据**：长度 > 1 的内容项所在的区会被推成动态面板，
   * 每个视图一个 panel state；否则是分组。
   *
   * 模型在内容清单阶段回答的是内容问题（「用户要切着看吗」），不是容器问题。
   * 容器由 {@link resolveContainerKind} 机械推导，所以模型选不错。
   */
  views: z.array(z.string().min(1)).optional().describe('需要切换的视图名，如 ["日","月","年"]；单视图不填')
});

export type ContentItem = z.infer<typeof contentItemSchema>;

// ── 二、分区树 ────────────────────────────────────────────────────────────────

/**
 * 叶子：唯一会落地成容器组件的节点。
 *
 * 中间的 `dir` 节点**纯粹是布局结构，不生成任何组件**——所以一棵三层的树最终产出的
 * 是一排平铺在根级的容器，而不是三层嵌套。这么定有两个理由：
 *
 * 1. 联动作用域最短。`resolveComponentScope` 要判断源与目标的相对位置，
 *    组件全在根级容器里时路径最浅，而联动是这套系统的核心价值。
 * 2. 契合「顶层几个大分区 + 区内组件归类」这个大屏的自然层次：
 *    叶子就是那个大分区，`contentIds` 就是区内归类的那几个组件。
 */
export const zoneLeafSchema = z.object({
  role: z
    .string()
    .min(1)
    .describe(
      '这块区的功能语义，如 "header" / "kpi-strip" / "main-viz" / "side-list"。给组件选型当上下文，给素材检索当风格依据'
    ),
  contentIds: z.array(z.string().min(1)).min(1).describe("落在这块区里的内容项 id；多个时沿容器长边均分")
});

export type ZoneLeaf = z.infer<typeof zoneLeafSchema>;

/**
 * 分区树节点。
 *
 * `dir` 沿用 CSS flex-direction 的约定，别自己发明语义：
 *   - `row` = 子节点**横向**排列（左→右），瓜分父节点的**列**
 *   - `col` = 子节点**纵向**排列（上→下），瓜分父节点的**行**
 *
 * `span` 是**相对父节点的格数**，不是绝对格位；根节点隐含 {@link GRID_COLS} × {@link GRID_ROWS}。
 * 用整数格而不是浮点权重是有意的：24 与 12 都高度可分（24=2·3·4·6·8·12），
 * 整数切分让对齐免费（浮点会到处差 1px），也让「子 span 之和 == 父可分配格数」
 * 成为一条能在花钱选组件**之前**就跑的硬校验。
 */
export type Zone = { dir: "row" | "col"; children: Array<{ span: number; zone: Zone }> } | { leaf: ZoneLeaf };

export const zoneSchema: z.ZodType<Zone> = z.lazy(() =>
  z.union([
    z.object({
      dir: z.enum(["row", "col"]),
      children: z
        .array(z.object({ span: z.number().int().min(1), zone: zoneSchema }))
        .min(2)
        .describe("至少两个子节点——只有一个子节点的分割没有意义，应该直接用那个子节点")
    }),
    z.object({ leaf: zoneLeafSchema })
  ])
);

// ── 三、已求解分区（求解器输出） ──────────────────────────────────────────────

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 容器类型。取值是 screenwright 的真实 prop 名，落盘时直接用。 */
export type ContainerKind = "sw-folder" | "sw-panel";

export interface SolvedItem {
  contentId: string;
  /** 区内位置（已扣掉容器内边距与间隔），绝对坐标，与容器同一坐标系 */
  rect: Rect;
}

export interface SolvedZone {
  role: string;
  container: ContainerKind;
  /** 仅 ft-panel：状态名，来自触发它的那个内容项的 `views` */
  states?: string[];
  rect: Rect;
  items: SolvedItem[];
  /**
   * 实得长宽比严重偏离该 `kind` 的理想值时带出来。
   *
   * 不硬失败：偏离多少算「不能看」没有客观判据，而且回退重切的代价比一个略扁的图表高。
   * 交给调用方决定是重生成分区树还是照单全收。
   */
  aspectWarnings: string[];
}

// ── 四、常量与查表 ────────────────────────────────────────────────────────────

/**
 * 网格。与 `agent-workspace/scripts/create-template.ts` 里模板骨架的 `网格` 字段同口径，
 * 改这里就要同步改那边，否则「提取出来的模板」和「生成出来的屏」用的不是一套坐标系。
 */
export const GRID_COLS = 24;
export const GRID_ROWS = 12;

/**
 * 各内容形态的理想宽高比（width / height）。
 *
 * 由 `kind` 查表而不是让模型逐块屏声明：饼图该是方的，这是**组件形态的属性**，
 * 不随大屏变化。模型每次现编只会引入不一致。
 */
export const ASPECT_BY_KIND: Record<ContentKind, number> = {
  kpi: 2.4,
  trend: 2.0,
  rank: 1.4,
  share: 1.0,
  list: 0.9,
  map: 1.3,
  title: 8.0,
  other: 1.6
};

/** 实得比与理想比相差超过这个倍数就记一条 warning。 */
export const ASPECT_TOLERANCE = 2.2;

/**
 * 容器类型的唯一推导入口。
 *
 * 单独提出来是为了让「面板从哪来」只有一个答案：区里**任一**内容项要多视图，这块区就是面板。
 * 多个内容项都带 views 时取第一个——同一块区里塞两组互不相干的视图切换本身就是分区分错了，
 * 与其在这里编一套合并规则，不如让它显式地只认第一个。
 */
export const resolveContainerKind = (
  items: readonly ContentItem[]
): { container: ContainerKind; states?: string[] } => {
  const multiView = items.find((item) => (item.views?.length ?? 0) > 1);
  return multiView ? { container: "sw-panel", states: multiView.views } : { container: "sw-folder" };
};

/**
 * 把「一张多度量的统计卡片」摊成多项单度量 KPI。
 *
 * 上游 agent 常把「雨情水位统计卡片」这类整块内容写成**一个** `kind:"kpi"` 项、
 * measures 里堆三五个度量——而 KPI 组件（翻牌器/计数器）的 data schema 只有一个 `value`，
 * 于是三个度量塌成一个数字，产出「一块屏就一个孤零零的翻牌器」。真实的统计卡片区是一排卡片。
 *
 * 这里在进模型之前先摊平：`kind:"kpi"` 且 measures > 1 且不带多视图的项，
 * 按度量拆成 N 个单度量项，id 派生自原 id（`{id}__m0`…），name 用度量名。
 * 拆完模型看到的就是 N 个 KPI，自然会把它们并排放进同一块 `kpi-strip`，
 * solveLayout 再沿长边均分——这条路径 solve-layout 本来就是为「一块区放 4 个 KPI」设计的。
 *
 * 只碰 KPI：`rank` / `share` 带多度量是合法的分组柱、多环，不该拆。
 * 带 `views` 的不碰：那是动态面板，拆开会破坏状态语义。
 */
export const expandContentItems = (items: readonly ContentItem[]): ContentItem[] =>
  items.flatMap((item) => {
    const measures = item.measures ?? [];
    if (item.kind !== "kpi" || measures.length <= 1 || (item.views?.length ?? 0) > 0) {
      return [item];
    }
    return measures.map((measure, index) => ({
      ...item,
      id: `${item.id}__m${index}`,
      name: measure,
      measures: [measure]
    }));
  });
