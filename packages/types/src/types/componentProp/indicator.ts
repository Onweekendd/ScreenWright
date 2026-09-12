/**
 * 指标组件类型
 * @description 指标类组件的类型标识
 */

/**
 * 指标组件枚举
 * @description 各种指标组件的类型标识
 */
export enum IndicatorEnum {
  /** 周期表 */
  FtPeriodictable = "swPeriodictable",
  /** 光栅进度条 */
  RasterProgressBar = "rasterProgressBar",
  /** 图标占比 */
  IconRatio = "iconRatio",
  /** 排序比例条 */
  SortRatioBar = "sortRatioBar",
  /** 动态占比 */
  FtDynamicRatio = "swdynamicratio",
  /** 翻牌器 */
  FtFlopPerformance = "swFlopPerformance",
  /** 环形图 */
  EchartRing = "echartring",
  /** 排名进度条 */
  RankProgress = "rank-progress"
}

/** @deprecated 使用 IndicatorEnum 代替 */
export const indicatorEnum = IndicatorEnum;
