/**
 * Echart 组件类型
 * @description 包含所有图表组件类型的枚举和联合类型
 */

/**
 * 柱状图枚举
 * @description 各种柱状图组件的类型标识
 */
export enum BarEchartEnum {
  /** 条形图 */
  echartstripBar = "echartstripBar",
  /** 双向条形图 */
  echartbothWayStripBar = "echartbothWayStripBar",
  /** 线柱混合图 */
  echartlineAndBar = "echartlineAndBar",
  /** 象形柱状图 */
  echartpictorialbar = "echartpictorialbar",
  /** 排名柱状图 */
  echartrank = "echartrank",
  /** 基础柱状图 */
  echartbar = "echartbar"
}

/**
 * 饼图枚举
 * @description 各种饼图组件的类型标识
 */
export enum PieEchartEnum {
  /** 基础饼图 */
  echartpie = "echartpie",
  /** 环形循环饼图 */
  echartloopRingPie = "echartloopRingPie",
  /** 玫瑰饼图 */
  echartpluralRosePie = "echartpluralRosePie",
  /** 三维饼图 */
  echartthreePie = "echartthreePie"
}

/**
 * 散点图枚举
 * @description 散点图组件的类型标识
 */
export enum ScatterEchartEnum {
  /** 基础散点图 */
  echartscatter = "echartscatter"
}

/**
 * 项目图表枚举
 * @description 项目专用图表组件的类型标识
 */
export enum ProjectEchartEnum {
  /** 斑马图2 */
  echartzebra2 = "echartzebra2",
  /** 双轴折线图 */
  echartdoubleValueLine = "echartdoubleValueLine",
  /** 增长率柱状图 */
  echartgrowthRateBar = "echartgrowthRateBar",
  /** 效果散点图 */
  echarteffectScatter = "echarteffectScatter",
  /** 重叠柱状图 */
  echartoverlapBar = "echartoverlapBar",
  /** 斑马线柱混合图 */
  echartzebraBarAndLine = "echartzebraBarAndLine",
  /** 三维线柱混合图 */
  echartthreedBarAndLine = "echartthreedBarAndLine",
  /** 斑马图 */
  echartzebra = "echartzebra",
  /** 三维柱状图 */
  echartthreedBar = "echartthreedBar",
  /** 刻度饼图 */
  echartscalePie = "echartscalePie",
  /** 多维排名柱状图 */
  echartmultiplyRankBar = "echartmultiplyRankBar",
  /** 排名柱状图 */
  echartrankBar = "echartrankBar",
  /** 三四分饼图 */
  echartthreeQuartersPie = "echartthreeQuartersPie",
  /** 细柱状图 */
  echartthinBar = "echartthinBar"
}

/**
 * 折线图枚举
 * @description 各种折线图组件的类型标识
 */
export enum LineEchartEnum {
  /** 面积折线图 */
  echartareaLine = "echartareaLine",
  /** 基础折线图 */
  echartline = "echartline"
}

/**
 * 其他图表枚举
 * @description 其他类型图表组件的类型标识
 */
export enum OtherEchartEnum {
  /** 矩形树图 */
  echarttreemap = "echarttreemap",
  /** 关系图 */
  echartgraph = "echartgraph",
  /** 漏斗图 */
  echartfunnel = "echartfunnel",
  /** 雷达图 */
  echartradar = "echartradar",
  /** 桑基图 */
  echartsankey = "echartsankey"
}

/**
 * 环形图枚举
 * @description 环形图组件的类型标识
 */
export enum RingEchartEnum {
  /** 基础环形图 */
  echartring = "echartring"
}

/**
 * 指标图枚举
 * @description 指标类图表组件的类型标识
 */
export enum IndicatorEchartEnum {
  /** 进度条 */
  echartprogress = "echartprogress",
  /** 环形图 */
  echartring = "echartring",
  /** 仪表盘 */
  echartgauge = "echartgauge",
  /** 水球图 */
  echartliquidFill = "echartliquidFill",
  /** 词云图 */
  echartwordcloud = "echartwordcloud"
}

/**
 * 所有 Echart 图表枚举
 * @description 统一包含所有图表类型的枚举
 */
export enum AllEchartEnum {
  // 柱状图类型
  echartstripBar = "echartstripBar",
  echartbothWayStripBar = "echartbothWayStripBar",
  echartlineAndBar = "echartlineAndBar",
  echartpictorialbar = "echartpictorialbar",
  echartrank = "echartrank",
  echartbar = "echartbar",
  // 饼图类型
  echartpie = "echartpie",
  echartloopRingPie = "echartloopRingPie",
  echartpluralRosePie = "echartpluralRosePie",
  echartthreePie = "echartthreePie",
  // 散点图类型
  echartscatter = "echartscatter",
  // 项目图表类型
  echartzebra2 = "echartzebra2",
  echartdoubleValueLine = "echartdoubleValueLine",
  echartgrowthRateBar = "echartgrowthRateBar",
  echarteffectScatter = "echarteffectScatter",
  echartoverlapBar = "echartoverlapBar",
  echartzebraBarAndLine = "echartzebraBarAndLine",
  echartthreedBarAndLine = "echartthreedBarAndLine",
  echartzebra = "echartzebra",
  echartthreedBar = "echartthreedBar",
  echartscalePie = "echartscalePie",
  echartmultiplyRankBar = "echartmultiplyRankBar",
  echartrankBar = "echartrankBar",
  echartthreeQuartersPie = "echartthreeQuartersPie",
  echartthinBar = "echartthinBar",
  // 折线图类型
  echartareaLine = "echartareaLine",
  echartline = "echartline",
  // 其他图表类型
  echarttreemap = "echarttreemap",
  echartgraph = "echartgraph",
  echartfunnel = "echartfunnel",
  echartradar = "echartradar",
  echartsankey = "echartsankey",
  // 环形图类型
  echartring = "echartring",
  // 指标图类型
  echartprogress = "echartprogress",
  echartgauge = "echartgauge",
  echartliquidFill = "echartliquidFill",
  echartwordcloud = "echartwordcloud"
}

/**
 * Echart 组件类型联合
 * @description 所有图表组件类型的联合类型
 */
export type EchartComponentType =
  | BarEchartEnum
  | PieEchartEnum
  | LineEchartEnum
  | ScatterEchartEnum
  | OtherEchartEnum
  | ProjectEchartEnum
  | RingEchartEnum
  | IndicatorEchartEnum;

/** @deprecated 使用 PieEchartEnum 代替 */
export const pieEchartEnum = PieEchartEnum;

/** @deprecated 使用 ScatterEchartEnum 代替 */
export const scatterEchartEnum = ScatterEchartEnum;

/** @deprecated 使用 ProjectEchartEnum 代替 */
export const projectEchartEnum = ProjectEchartEnum;

/** @deprecated 使用 LineEchartEnum 代替 */
export const lineEchartEnum = LineEchartEnum;

/** @deprecated 使用 OtherEchartEnum 代替 */
export const otherEchartEnum = OtherEchartEnum;

/** @deprecated 使用 RingEchartEnum 代替 */
export const ringEchartEnum = RingEchartEnum;

/** @deprecated 使用 IndicatorEchartEnum 代替 */
export const indicatorEchartEnum = IndicatorEchartEnum;

/** @deprecated 使用 BarEchartEnum 代替 */
export type BarEchartType = BarEchartEnum;

/** @deprecated 使用 PieEchartEnum 代替 */
export type pieEchartType = PieEchartEnum;

/** @deprecated 使用 ScatterEchartEnum 代替 */
export type scatterEchartType = ScatterEchartEnum;

/** @deprecated 使用 ProjectEchartEnum 代替 */
export type projectEchartType = ProjectEchartEnum;

/** @deprecated 使用 LineEchartEnum 代替 */
export type lineEchartsType = LineEchartEnum;

/** @deprecated 使用 OtherEchartEnum 代替 */
export type otherEchartType = OtherEchartEnum;

/** @deprecated 使用 RingEchartEnum 代替 */
export type ringEchartType = RingEchartEnum;

/** @deprecated 使用 IndicatorEchartEnum 代替 */
export type indicatorEchartType = IndicatorEchartEnum;

/** @deprecated 使用 AllEchartEnum 代替 */
export type AllEchartType = AllEchartEnum;
