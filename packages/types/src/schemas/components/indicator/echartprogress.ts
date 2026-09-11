import { z } from "zod";

/**
 * 进度条 (echartprogress)
 * 指标
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 当前进度值
 * - `max` - 最大值
 * - `min` - 最小值
 *
 * @example
 * ```typescript
 * const data: echartprogressData = [
 *   { value: 75, max: 100, min: 0 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartprogressDataItemSchema = z.object({
  value: z.number().describe("当前进度值"),
  max: z.number().describe("最大值"),
  min: z.number().describe("最小值")
});

// 数据数组 Schema
export const echartprogressDataSchema = z.array(echartprogressDataItemSchema);

export type echartprogressData = z.infer<typeof echartprogressDataSchema>;

// 系列颜色渐变配置
const seriesColorStopSchema = z.object({
  color: z.string().describe("渐变颜色值"),
  per: z.number().describe("渐变位置百分比")
});

const seriesColorSchema = z.object({
  type: z.string().describe("渐变类型，如 linear-gradient"),
  angle: z.string().describe("渐变角度"),
  colors: z.array(seriesColorStopSchema).describe("渐变颜色列表")
});

/**
 * 进度条配置选项 Schema
 */
export const echartprogressOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 网格配置 ============
  gridTop: z.number().describe("网格上边距"),
  gridBottom: z.number().describe("网格下边距"),
  gridLeft: z.number().describe("网格左边距"),
  gridRight: z.number().describe("网格右边距"),

  // ============ 系列颜色配置 ============
  seriesColor: seriesColorSchema.describe("进度条渐变颜色配置"),
  seriesOpacity: z.number().describe("进度条不透明度"),

  // ============ 柱条配置 ============
  barBackgroundColor: z.string().describe("进度条背景颜色"),
  barBorderRadius: z.number().describe("进度条圆角"),

  // ============ 动画配置 ============
  animationShow: z.boolean().describe("是否启用动画"),
  animationDuration: z.number().describe("动画时长（秒）"),

  // ============ 系列标签配置 ============
  seriesLabelShow: z.boolean().describe("是否显示系列标签"),
  seriesLabelPercentValue: z.number().describe("百分比小数位数"),
  seriesBarWidth: z.number().describe("进度条宽度"),
  seriesLabelColor: z.string().describe("标签颜色"),
  seriesLabelType: z.string().describe("标签类型，如 percent"),
  seriesLabelFontFamily: z.string().describe("标签字体"),
  seriesLabelFontSize: z.number().describe("标签字体大小"),
  seriesLabelFontWeight: z.string().describe("标签字体粗细"),
  seriesLabelFontStyle: z.string().describe("标签字体样式"),
  seriesLabelOffsetX: z.number().describe("标签X轴偏移"),
  seriesLabelOffsetY: z.number().describe("标签Y轴偏移"),

  // ============ 标签前缀配置 ============
  seriesLabelPrefixShow: z.boolean().describe("是否显示标签前缀"),
  seriesLabelPrefix: z.string().describe("标签前缀文本"),
  seriesLabelPrefixColor: z.string().describe("标签前缀颜色"),
  seriesLabelPrefixType: z.string().describe("标签前缀类型"),
  seriesLabelPrefixFontFamily: z.string().describe("标签前缀字体"),
  seriesLabelPrefixFontSize: z.number().describe("标签前缀字体大小"),
  seriesLabelPrefixFontWeight: z.string().describe("标签前缀字体粗细"),
  seriesLabelPrefixFontStyle: z.string().describe("标签前缀字体样式"),
  seriesLabelPrefixPadding: z.number().describe("标签前缀内边距"),
  seriesLabelPrefixColorFollow: z.boolean().describe("标签前缀颜色是否跟随主色"),

  // ============ 标签单位配置 ============
  seriesLabelUnitShow: z.boolean().describe("是否显示标签单位"),
  seriesLabelUnit: z.string().describe("标签单位文本"),
  seriesLabelUnitColor: z.string().describe("标签单位颜色"),
  seriesLabelUnitType: z.string().describe("标签单位类型"),
  seriesLabelUnitFontFamily: z.string().describe("标签单位字体"),
  seriesLabelUnitFontSize: z.number().describe("标签单位字体大小"),
  seriesLabelUnitFontWeight: z.string().describe("标签单位字体粗细"),
  seriesLabelUnitFontStyle: z.string().describe("标签单位字体样式"),
  seriesLabelUnitPadding: z.number().describe("标签单位内边距"),
  seriesLabelUnitColorFollow: z.boolean().describe("标签单位颜色是否跟随主色"),

  // ============ 头部图片配置 ============
  headImgShow: z.boolean().describe("是否显示头部图片"),
  headImg: z.string().describe("头部图片地址"),
  headImgWidth: z.number().describe("头部图片宽度"),
  headImgHeight: z.number().describe("头部图片高度"),
  headImgOffsetX: z.number().describe("头部图片X轴偏移"),
  headImgOffsetY: z.number().describe("头部图片Y轴偏移"),

  // ============ X轴配置 ============
  xAxisInverse: z.boolean().describe("X轴是否反向"),
  xAxisShow: z.boolean().describe("是否显示X轴"),
  xAxisLabelShow: z.boolean().describe("是否显示X轴标签"),
  xAxisMin: z.string().describe("X轴最小值"),
  xAxisMax: z.string().describe("X轴最大值"),
  xAxisMargin: z.number().describe("X轴标签边距"),
  xAxisFontFamily: z.string().describe("X轴标签字体"),
  xAxisFontSize: z.number().describe("X轴标签字体大小"),
  xAxisColor: z.string().describe("X轴标签颜色"),
  xAxisFontStyle: z.string().describe("X轴标签字体样式"),
  xAxisFontWeight: z.string().describe("X轴标签字体粗细"),

  // ============ X轴名称配置 ============
  xAxisNameShow: z.boolean().describe("是否显示X轴名称"),
  xAxisName: z.string().describe("X轴名称文本"),
  xAxisNameFontFamily: z.string().describe("X轴名称字体"),
  xAxisNameFontSize: z.number().describe("X轴名称字体大小"),
  xAxisNameColor: z.string().describe("X轴名称颜色"),
  xAxisNameFontStyle: z.string().describe("X轴名称字体样式"),
  xAxisNameFontWeight: z.string().describe("X轴名称字体粗细"),
  xAxisSplitNumber: z.number().describe("X轴分割段数"),
  xAxisNamePaddingTop: z.number().describe("X轴名称顶部内边距"),
  xAxisNamePaddingBottom: z.number().describe("X轴名称底部内边距"),
  xAxisNamePaddingLeft: z.number().describe("X轴名称左侧内边距"),
  xAxisNamePaddingRight: z.number().describe("X轴名称右侧内边距"),

  // ============ X轴分割线配置 ============
  xAxisSplitLineShow: z.boolean().describe("是否显示X轴分割线"),
  xAxisSplitLineWidth: z.number().describe("X轴分割线宽度"),
  xAxisSplitLineColor: z.string().describe("X轴分割线颜色")
});

export type echartprogressOption = z.infer<typeof echartprogressOptionSchema>;
