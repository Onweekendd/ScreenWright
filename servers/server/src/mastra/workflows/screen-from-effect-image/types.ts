/**
 * 生图 → 大屏：`analyzeEffectImageStep` 与 `pickComponentOrAssetStep` 的类型契约。
 *
 * 复用 `requirement-to-bi/types.ts` 的 `Rect` / `SolvedZone` / `ContainerKind`——
 * 那三个是纯结构契约，跟坐标怎么算出来的（网格求解 or 像素吸附）无关。
 * 这份文件只补图片路径独有的东西：vision 划区的原始输出形状、吸附结果、
 * 「4 类组件」的查表规则。
 *
 * 设计详情见 `docs/生图到大屏工作流.md`。
 */
import { z } from "zod";

import { type ContentKind, contentKindSchema } from "../requirement-to-bi/types";

// ── 一、vision 划区的原始输出 ──────────────────────────────────────────────────

/**
 * 区域大类。决定后面怎么处理，也决定选型走哪条路（见 §三）：
 * - `component`：数据区，图里内容丢弃，只留 bbox + 语义 kind
 * - `asset`：装饰图/背景/边框，裁切或重画后直接当图片组件用，**没有挑选环节**
 * - `text`：标题/说明文字，OCR 后当富文本组件用，同样**没有挑选环节**
 */
export const regionKindSchema = z.enum(["component", "asset", "text"]);
export type RegionKind = z.infer<typeof regionKindSchema>;

/**
 * 素材的吸附方式，由 `role` 决定，三选一：
 * - `border`：卡片框、外框——找发光边框线
 * - `extent`：标题栏、中央 HUD——从区域中心向外扫到内容边界
 * - `cleanest`：背景平铺块——找一块最干净（内容最少）的矩形
 */
export const snapModeSchema = z.enum(["border", "extent", "cleanest", "none"]);

/** `#rrggbb`，vision 取色只认这一种写法，后面算渐变要拆通道 */
export const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/**
 * 图表的具体形态，比 `contentKind` 细一级：`trend` 盖不住"面积/平滑/普通折线"，`rank` 盖不住"横条/竖柱/分组/堆叠"。
 * 每个值对应 `CHART_VARIANT_TABLE` 里一个确定的组件。
 */
export const chartVariantSchema = z.enum([
  "line",
  "area",
  "bar",
  "grouped-bar",
  "stacked-bar",
  "horizontal-bar",
  "pie",
  "ring",
  "gauge",
  "scatter",
  "radar",
  "funnel",
  "other"
]);
export type ChartVariant = z.infer<typeof chartVariantSchema>;

/**
 * vision 从效果图上直接读出来的图表规格。第一版只给一个 `contentKind: "trend"`，造数据的模型
 * 等于在盲造：12 个 x 刻度造成 8 个、0~3000 的量级造成 2450~4680、五条线造成一条、面积图落成普通折线。
 * 效果图上这些都写着，读出来交给下游，模型只剩"按骨架填数字"。
 */
export const chartSpecSchema = z.object({
  variant: chartVariantSchema,
  /** 曲线是否平滑 */
  smooth: z.boolean().optional(),
  /** 图例/扇区上的系列名，按顺序抄原文 */
  series: z.array(z.string().min(1)).max(10).optional(),
  /** 实际画了几条线/几组柱。生成图常常图例 4 项画 5 条线，对不上时以 series 为准、这个只作参考 */
  seriesCount: z.number().int().min(1).max(10).optional(),
  /** 与 series 同序：每个系列在这张图上的颜色。整屏 palette 是"有哪些色"，这里才是"谁用哪个色" */
  colors: z.array(hexColorSchema).max(10).optional(),
  /** 与 series 同序：图上标出来的数值或百分比（饼图扇区 10%/28%…、翻牌器大数字），读到什么填什么 */
  values: z.array(z.number()).max(10).optional(),
  /** x 轴刻度原文，按顺序，如 ["00:00","02:00",…] */
  xLabels: z.array(z.string()).max(40).optional(),
  /** y 轴最小/最大刻度，如 [0, 3000] */
  yRange: z.tuple([z.number(), z.number()]).optional(),
  /** 轴名/单位说明原文，如 "发电量（亿kWh）" */
  yAxisName: z.string().optional(),
  /** 数值单位，如 "MW" / "%" / "亿kWh" */
  unit: z.string().optional(),
  showLegend: z.boolean().optional(),
  /** 数据点/柱顶有没有标数值 */
  showLabel: z.boolean().optional()
});
export type ChartSpec = z.infer<typeof chartSpecSchema>;

/** vision 给的原始一条区域。0~1000 归一化，仿 screenshot-to-code 的做法，对分辨率不敏感。 */
export const effectImageRegionSchema = z.object({
  id: z.string().min(1),
  kind: regionKindSchema,
  /** 语义角色，如 "card-frame" / "outer-frame" / "title-bar" / "kpi" / "trend"…… */
  role: z.string().min(1),
  /** [x1, y1, x2, y2]，0~1000 归一化 */
  bounds: z.tuple([
    z.number().min(0).max(1000),
    z.number().min(0).max(1000),
    z.number().min(0).max(1000),
    z.number().min(0).max(1000)
  ]),
  confidence: z.number().min(0).max(1),
  /** kind=component 时必填：数据形态，供 §三 查表选组件 */
  contentKind: contentKindSchema.optional(),
  /** kind=component 时尽量填：vision 从效果图上读出来的图表规格，选组件和造数据都靠它 */
  chart: chartSpecSchema.optional(),
  /** kind=asset 时必填：区域里是否带没法复用的烤死文字（卡片页签、标题栏常见） */
  hasBakedText: z.boolean().optional(),
  /**
   * kind=text 时填：vision 直接读出的文字内容。D12 之前不上独立 OCR，
   * vision 模型读大屏标题/卡片页签这种大字体文字够用，读不出就留空。
   */
  text: z.string().optional()
});
export type EffectImageRegion = z.infer<typeof effectImageRegionSchema>;

export const effectImageAnalysisSchema = z.object({
  regions: z.array(effectImageRegionSchema).max(50),
  /**
   * 效果图里图表/数字用的主色，按出现频率从高到低，1~6 个。
   * 组件模板默认是蓝紫渐变，效果图是青色系的话每张图都会跟底图打架——
   * 这几个色由代码写进图表的系列色（见 `steps/chart-theme.ts`），不靠模型填复杂的颜色对象。
   */
  palette: z.array(hexColorSchema).max(6).optional()
});
export type EffectImagePalette = z.infer<typeof effectImageAnalysisSchema>["palette"];

/**
 * kind=asset 的 `role` 白名单。vision 只能从这里选，分组去重按它做第一级键。
 * 优先级（时间不够时先保哪个，见 docs §3②）：background > title-bar > card-frame。
 * - `background`：**不由 vision 给**，代码固定合成一条铺满整个画布的区域（最重要的那张底图）
 * - `title-bar`：顶部标题栏装饰
 * - `card-frame`：卡片背景框，一屏里通常 4~8 个同款
 * - `card-title-bar`：卡片左上角页签/标题条的装饰底（标题文字压在它上面），同样一屏同款
 * - `outer-frame`：整屏外框/边角装饰
 * - `decoration`：其它零散装饰（中央 HUD、分隔线、底部光带）
 */
export const assetRoleSchema = z.enum([
  "background",
  "title-bar",
  "card-frame",
  "card-title-bar",
  "outer-frame",
  "decoration"
]);
export type AssetRole = z.infer<typeof assetRoleSchema>;

/** 代码固定合成的底图区域 id，vision 输出里不会有它。 */
export const BACKGROUND_REGION_ID = "background";

// ── 二、吸附 + 裁切之后的产物 ───────────────────────────────────────────────────

/** 一个区域吸附、裁切/生成之后的最终结果，喂给 ③ 组装。 */
export interface ResolvedRegion {
  region: EffectImageRegion;
  /**
   * 目前恒为 `none`：素材走"分组去重 → 代表生图"（见 resolve-assets.ts），不再对像素做吸附。
   * 2026-09-17 实测过投影吸附 + 覆盖率置信度，结论是分不开真边框与相似亮度的装饰线，
   * 与其留一个假装精确的分数不如不做。字段留着是给"必须保留原图内容"的区域（带真实形状的地图底图）
   * 以后接吸附裁切用，原型在 scratchpad `snap-modes.cjs`。
   */
  snap: z.infer<typeof snapModeSchema>;
  /** 像素坐标 [x1,y1,x2,y2]，**效果图原图坐标系**（裁参考图用）；canvas 坐标见同序的 zone.rect */
  box: [number, number, number, number];
  /** kind=asset 专属：裁切/生成结果；kind=text 专属：OCR 文本；kind=component 不填 */
  asset?: {
    url: string;
    /** true=生图产物；false=生图没跑通（没配生图模型/调用失败）降级成原图裁切 */
    generated: boolean;
    /**
     * 指向"同款去重"里的代表 region id——同一组的非代表成员一律有这个字段，
     * `url` 与代表一致，只是 `box` 不同（摆放位置/尺寸）。见 analyzeEffectImageStep 的分组逻辑。
     */
    reuseOf?: string;
  };
  text?: { value: string };
}

// ── 三、组件范围收窄：4 类，非全库向量检索 ──────────────────────────────────────

/**
 * 数据区（kind=component）只认这 4 类组件里的 3 类（第 4 类「图片」专供 kind=asset，
 * 不经过这张表——它是代码直接写死的，不用挑）。
 *
 * 与 `requirement-to-bi/pick-components-step.ts` 的核心差别：那边是 116 个组件的
 * embedding 检索，这里是**查表**。理由：图片来源的区域已经有真实视觉形态（这块明摆着
 * 是个折线图），不需要再靠语义检索去猜，检索反而会引入检索误差。
 */
export const componentClassSchema = z.enum(["chart", "richtext", "carousel-table"]);
export type ComponentClass = z.infer<typeof componentClassSchema>;

/**
 * 图表候选，一条对应 `pick-components-step.ts` 里 `Candidate` 的两个关键字段：
 * `prop`（英文 prop 名，`describePropSchema`/`checkDataKeys` 等校验函数都按它查）
 * 和 `componentName`（中文名，`assemble-screen-step.ts` 的 `findModule` 按它查 `Module` 表）。
 * 两者不是同一份数据，缺一个都会在下游查表时静默失败，务必成对填。
 */
export interface ChartCandidate {
  prop: string;
  componentName: string;
}

/**
 * `contentKind` → 该类下的候选图表，按优先级排列（第一个当默认选中项）。
 *
 * prop 与中文名 2026-09-17 按 `.data/screenwright.db` 的 modules 表核对过（不是按向量库文档名抄的——
 * `assemble-screen-step.ts` 的 `findModule` 在「文本框/跑马灯/超链接」上踩过文档名≠`Module.name` 的坑）。
 */
export const CHART_CLASS_TABLE: Partial<Record<ContentKind, ChartCandidate[]>> = {
  kpi: [{ prop: "swFlopPerformance", componentName: "翻牌器" }],
  trend: [{ prop: "echartline", componentName: "折线图" }],
  rank: [
    { prop: "echartstripBar", componentName: "条形图" },
    { prop: "echartbar", componentName: "柱状图" }
  ],
  share: [{ prop: "echartpie", componentName: "饼图" }],
  // 「中国2D地图」(echartcommonMap) 的模板过不了 componentSchema 校验（prop 不在枚举里），用 2.5D 那个
  map: [{ prop: "echart-glmap", componentName: "中国2.5D地图" }]
  // list / title / other 不在这张表里：list → 轮播表格（固定），title/other → 富文本（固定）
};

/**
 * `chart.variant` → 组件，一对一，优先于 `CHART_CLASS_TABLE`（那张表按 contentKind 兜底）。
 * 2026-09-18 按 `.data/screenwright.db` 的 modules 表核对过，prop 都在 `propSchemaMap` 里（能过 componentSchema 校验）。
 * `ring` 落饼图而不是「环形图」(echartring)：后者是单值进度环（data `{value,total}`），不是多扇区占比。
 * `other` 不在表里：退回 contentKind 兜底。
 */
export const CHART_VARIANT_TABLE: Partial<Record<ChartVariant, ChartCandidate>> = {
  line: { prop: "echartline", componentName: "折线图" },
  area: { prop: "echartareaLine", componentName: "面积折线图" },
  bar: { prop: "echartbar", componentName: "柱状图" },
  "grouped-bar": { prop: "echartbar", componentName: "柱状图" },
  "stacked-bar": { prop: "echartbar", componentName: "柱状图" },
  "horizontal-bar": { prop: "echartstripBar", componentName: "条形图" },
  pie: { prop: "echartpie", componentName: "饼图" },
  ring: { prop: "echartpie", componentName: "饼图" },
  gauge: { prop: "echartgauge", componentName: "仪表盘" },
  scatter: { prop: "echartscatter", componentName: "散点图" },
  radar: { prop: "echartradar", componentName: "雷达图" },
  funnel: { prop: "echartfunnel", componentName: "漏斗图" }
};

/**
 * 三类固定组件的 prop + Module 表中文名（2026-09-17 查 `.data/screenwright.db` 的 modules 表核对过）。
 * 图片组件 url 放 `data[0].value`（swImg/index.vue 读 `dataChartItem.value`）；
 * 富文本内容放 `option.content`（swRichtext/index.vue 读 `option.value.content`）。
 */
export const RICHTEXT_COMPONENT: ChartCandidate = { prop: "swRichtext", componentName: "富文本" };
export const CAROUSEL_TABLE_COMPONENT: ChartCandidate = { prop: "swScroll", componentName: "轮播表格" };
export const IMAGE_COMPONENT: ChartCandidate = { prop: "swimg", componentName: "图片" };
