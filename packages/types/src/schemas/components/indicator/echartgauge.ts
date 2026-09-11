import { z } from "zod";

/**
 * 仪表盘 (echartgauge)
 * 指标
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 当前值
 *
 * @example
 * ```typescript
 * const data: EchartGaugeData = [
 *   { value: 33 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartGaugeDataItemSchema = z.object({
  value: z.number().describe("当前值")
});

// 数据数组 Schema（最终导出的类型）
export const echartGaugeDataSchema = z.array(echartGaugeDataItemSchema);

export type EchartGaugeData = z.infer<typeof echartGaugeDataSchema>;

// 渐变颜色配置
const seriesColorItemSchema = z.object({
  color: z.string().describe("颜色值"),
  per: z.number().describe("颜色位置百分比")
});

const seriesColorSchema = z.object({
  type: z.string().describe("渐变类型，如 linear-gradient"),
  angle: z.string().describe("渐变角度"),
  colors: z.array(seriesColorItemSchema).describe("渐变颜色列表")
});

/**
 * 仪表盘配置选项 Schema
 */
export const echartGaugeOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 刻度轴标签配置 ============
  axisLabelShow: z.boolean().describe("是否显示刻度标签"),
  min: z.number().describe("最小值"),
  max: z.number().describe("最大值"),
  axisLabelDistance: z.number().describe("刻度标签与轴线距离"),
  axisLabelFontFamily: z.string().describe("刻度标签字体"),
  axisLabelFontSize: z.number().describe("刻度标签字体大小"),
  axisLabelColor: z.string().describe("刻度标签颜色"),
  axisLabelFontStyle: z.string().describe("刻度标签字体样式"),
  axisLabelFontWeight: z.string().describe("刻度标签字体粗细"),
  splitNumber: z.number().describe("分割段数"),
  axisLabelToFixed: z.number().describe("刻度标签小数位数"),

  // ============ 分割线配置 ============
  splitLineShow: z.boolean().describe("是否显示分割线"),
  splitLineColor: z.string().describe("分割线颜色"),
  splitLineWidth: z.number().describe("分割线宽度"),
  splitLineLength: z.number().describe("分割线长度"),
  splitLineDistance: z.number().describe("分割线与轴线距离"),

  // ============ 指针配置 ============
  pointerShow: z.boolean().describe("是否显示指针"),
  pointerColor: z.string().describe("指针颜色"),
  pointerlength: z.number().describe("指针长度"),

  // ============ 圆心锚点配置 ============
  anchorShow: z.boolean().describe("是否显示圆心锚点"),
  anchorColor: z.string().describe("锚点颜色"),
  anchorSize: z.number().describe("锚点大小"),

  // ============ 动画配置 ============
  animationShow: z.boolean().describe("是否启用动画"),
  animationDuration: z.number().describe("动画时长（秒）"),

  // ============ 详情标签配置 ============
  seriesDetailShow: z.boolean().describe("是否显示详情标签"),
  seriesDetailPercentValue: z.number().describe("详情百分比小数位数"),
  seriesDetailColor: z.string().describe("详情标签颜色"),
  seriesDetailType: z.string().describe("详情显示类型，如 percent/value"),
  seriesDetailFontFamily: z.string().describe("详情标签字体"),
  seriesDetailFontSize: z.number().describe("详情标签字体大小"),
  seriesDetailFontWeight: z.string().describe("详情标签字体粗细"),
  seriesDetailFontStyle: z.string().describe("详情标签字体样式"),
  seriesDetailOffsetX: z.number().describe("详情标签X轴偏移"),
  seriesDetailOffsetY: z.number().describe("详情标签Y轴偏移"),

  // ============ 详情前缀配置 ============
  seriesDetailPrefixShow: z.boolean().describe("是否显示详情前缀"),
  seriesDetailPrefix: z.string().describe("详情前缀文本"),
  seriesDetailPrefixColor: z.string().describe("详情前缀颜色"),
  seriesDetailPrefixType: z.string().describe("详情前缀类型，如 value"),
  seriesDetailPrefixFontFamily: z.string().describe("详情前缀字体"),
  seriesDetailPrefixFontSize: z.number().describe("详情前缀字体大小"),
  seriesDetailPrefixFontWeight: z.string().describe("详情前缀字体粗细"),
  seriesDetailPrefixFontStyle: z.string().describe("详情前缀字体样式"),
  seriesDetailPrefixPadding: z.number().describe("详情前缀内边距"),
  seriesDetailPrefixColorFollow: z.boolean().describe("详情前缀颜色是否跟随主色"),

  // ============ 详情单位配置 ============
  seriesDetailUnitShow: z.boolean().describe("是否显示详情单位"),
  seriesDetailUnit: z.string().describe("详情单位文本"),
  seriesDetailUnitColor: z.string().describe("详情单位颜色"),
  seriesDetailUnitType: z.string().describe("详情单位类型，如 value"),
  seriesDetailUnitFontFamily: z.string().describe("详情单位字体"),
  seriesDetailUnitFontSize: z.number().describe("详情单位字体大小"),
  seriesDetailUnitFontWeight: z.string().describe("详情单位字体粗细"),
  seriesDetailUnitFontStyle: z.string().describe("详情单位字体样式"),
  seriesDetailUnitPadding: z.number().describe("详情单位内边距"),
  seriesDetailUnitColorFollow: z.boolean().describe("详情单位颜色是否跟随主色"),

  // ============ 轴线配置 ============
  axisLineWidth: z.number().describe("轴线宽度"),
  axisLineTabsName: z.array(z.string()).describe("轴线区间标签页名称"),
  axisLineScope: z.array(z.number()).describe("轴线区间范围"),
  axisLineColor: z.array(z.string()).describe("轴线区间颜色"),

  // ============ 系列颜色与样式 ============
  seriesColor: seriesColorSchema.describe("系列颜色（渐变）"),
  seriesOpacity: z.number().describe("系列不透明度（0-100）"),
  barBackgroundColor: z.string().describe("柱背景色"),
  barBorderRadius: z.number().describe("柱圆角"),

  // ============ 头像图片配置 ============
  headImgShow: z.boolean().describe("是否显示头像图片"),
  headImg: z.string().describe("头像图片地址"),
  headImgWidth: z.number().describe("头像图片宽度"),
  headImgHeight: z.number().describe("头像图片高度"),
  headImgOffsetX: z.number().describe("头像图片X轴偏移"),
  headImgOffsetY: z.number().describe("头像图片Y轴偏移"),

  // ============ X轴配置 ============
  xAxisInverse: z.boolean().describe("X轴是否反向"),
  xAxisShow: z.boolean().describe("是否显示X轴"),
  xAxisLabelShow: z.boolean().describe("是否显示X轴标签"),
  xAxisMargin: z.number().describe("X轴轴线与标签间距"),
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
  xAxisSplitLineShow: z.boolean().describe("是否显示X轴分割线"),
  xAxisSplitLineWidth: z.number().describe("X轴分割线宽度"),
  xAxisSplitLineColor: z.string().describe("X轴分割线颜色")
});

export type EchartGaugeOption = z.infer<typeof echartGaugeOptionSchema>;
