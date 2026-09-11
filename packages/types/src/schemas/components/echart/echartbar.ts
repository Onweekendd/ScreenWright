import { z } from "zod";

/**
 * 柱状图 (echartbar)
 * 图表 > 柱形图
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `name` - 类目名称
 * - `seriesName` - 系列名称
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: echartbarData = [
 *   { seriesName: '系列一', name: 'A', value: 2024 },
 *   { seriesName: '系列二', name: 'A', value: 2378 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartbarDataItemSchema = z.object({
  name: z.string(),
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartbarDataSchema = z.array(echartbarDataItemSchema);

export type echartbarData = z.infer<typeof echartbarDataSchema>;

// ==================== 通用类型定义 ====================

/** 颜色渐变配置 */
const gradientColorSchema = z.object({
  type: z.literal("linear-gradient"),
  angle: z.union([z.number(), z.string()]),
  colors: z.array(
    z.object({
      color: z.union([z.string(), z.number()]),
      per: z.number()
    })
  )
});

/** Tab 选项配置 */
const tabOptionSchema = z.object({
  name: z.string(),
  value: z.string()
});

/** 位置配置 */
const positionSchema = z.object({
  top: z.union([z.number(), z.string()]),
  left: z.union([z.number(), z.string()])
});

// ==================== Option Schema ====================

/**
 * 柱状图配置选项 Schema
 */
export const echartbarOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),
  stack: z.boolean().describe("是否堆叠显示"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),
  seriesColor: z.array(gradientColorSchema).describe("系列颜色配置（渐变）"),
  seriesColorpicker: z.array(z.string()).describe("系列颜色选择器值"),
  seriesOpacity: z.array(z.number()).describe("系列透明度（0-100）"),

  // ============ 极值标注配置 ============
  extremeShow: z.array(z.boolean()).describe("是否显示极值标注"),
  extremeType: z.array(z.enum(["max", "min"])).describe("极值类型"),
  extremeColor: z.array(gradientColorSchema).describe("极值颜色配置"),
  extremeOpacity: z.array(z.number()).describe("极值透明度"),
  extremeColorpicker: z.array(z.string()).describe("极值颜色选择器值"),

  // ============ 标记线配置 ============
  markLineDataType: z.array(z.enum(["average", "max", "min", "fixed"])).describe("标记线数据类型"),
  markLineData: z.array(z.number()).describe("标记线数值"),
  markLineSymbolStart: z.array(z.string()).describe("标记线起始符号"),
  markLineSymbolStartImage: z.array(z.string()).describe("标记线起始符号图片"),
  markLineSymbolEnd: z.array(z.string()).describe("标记线结束符号"),
  markLineSymbolEndImage: z.array(z.string()).describe("标记线结束符号图片"),
  markLineSymbolWidth: z.array(z.number()).describe("标记线符号宽度"),
  markLineSymbolHeight: z.array(z.number()).describe("标记线符号高度"),
  markLineLabelShow: z.array(z.boolean()).describe("是否显示标记线标签"),
  markLineLabelPosition: z.array(z.enum(["start", "middle", "end"])).describe("标记线标签位置"),
  markLineLabelDistance: z.array(z.number()).describe("标记线标签距离"),
  markLineLabelCustom: z.array(z.string()).describe("标记线自定义标签"),
  markLineLabelFontFamily: z.array(z.string()).describe("标记线标签字体"),
  markLineLabelFontStyle: z.array(z.string()).describe("标记线标签样式"),
  markLineLabelFontSize: z.array(z.number()).describe("标记线标签大小"),
  markLineLabelColor: z.array(z.string()).describe("标记线标签颜色"),
  markLineLabelFontWeight: z.array(z.string()).describe("标记线标签粗细"),
  markLineLabelPaddingTop: z.array(z.number()).describe("标记线标签顶部内边距"),
  markLineLabelPaddingRight: z.array(z.number()).describe("标记线标签右侧内边距"),
  markLineLabelPaddingBottom: z.array(z.number()).describe("标记线标签底部内边距"),
  markLineLabelPaddingLeft: z.array(z.number()).describe("标记线标签左侧内边距"),
  markLineLineColor: z.array(z.string()).describe("标记线颜色"),
  markLineLineWidth: z.array(z.number()).describe("标记线宽度"),
  markLineLineType: z.array(z.enum(["solid", "dashed", "dotted"])).describe("标记线类型"),
  markLineShow: z.array(z.boolean()).describe("是否显示标记线"),

  // ============ 柱状图配置 ============
  barGap: z.number().describe("柱间距离（百分比）"),
  barCategoryGap: z.number().describe("类目间距离（百分比）"),
  barBorderRadius: z.string().describe("柱子圆角"),
  barBackgroundColor: z.string().describe("柱子背景色"),

  // ============ 网格配置 ============
  gridLeft: z.number().describe("网格左边距"),
  gridTop: z.number().describe("网格上边距"),
  gridRight: z.number().describe("网格右边距"),
  gridBottom: z.number().describe("网格下边距"),

  // ============ 图例配置 ============
  legendShow: z.boolean().describe("是否显示图例"),
  legendWidth: z.number().describe("图例宽度"),
  legendHeight: z.number().describe("图例高度"),
  legendItemWidth: z.number().describe("图例项宽度"),
  legendItemHeight: z.number().describe("图例项高度"),
  legendItemGap: z.number().describe("图例项间距"),
  legendFontFamily: z.string().describe("图例字体名称"),
  legendFontSize: z.number().describe("图例字体大小"),
  legendColor: z.string().describe("图例字体颜色"),
  legendFontStyle: z.string().describe("图例字体样式"),
  legendFontWeight: z.string().describe("图例字体粗细"),
  legendTextLeftPadding: z.number().describe("图例文字左侧内边距"),
  legendSelectedMode: z.boolean().describe("图例是否可选择"),
  legendGrid: positionSchema.describe("图例位置"),
  legendOffsetX: z.number().describe("图例X轴偏移"),
  legendOffsetY: z.number().describe("图例Y轴偏移"),
  legendOrient: z.enum(["horizontal", "vertical"]).describe("图例排列方向"),

  // ============ 坐标轴通用配置 ============
  xNameFontSize: z.number().describe("X轴名称字体大小"),
  yNameFontSize: z.number().describe("Y轴名称字体大小"),

  // ============ 系列标签配置 ============
  seriesLabelShow: z.boolean().describe("是否显示系列标签"),
  seriesLabelColor: z.string().describe("系列标签颜色"),
  seriesLabelFontFamily: z.string().describe("系列标签字体"),
  seriesLabelFontSize: z.number().describe("系列标签字体大小"),
  seriesLabelFontWeight: z.string().describe("系列标签字体粗细"),
  seriesLabelFontStyle: z.string().describe("系列标签字体样式"),
  seriesLabelOffsetX: z.number().describe("系列标签X轴偏移"),
  seriesLabelOffsetY: z.number().describe("系列标签Y轴偏移"),

  // ============ X轴配置 ============
  yAxisInverse: z.boolean().describe("Y轴是否反向"),
  xAxisInverse: z.boolean().describe("X轴是否反向"),
  xAxisShow: z.boolean().describe("是否显示X轴"),
  yAxisShow: z.boolean().describe("是否显示Y轴"),
  xAxisLabelShow: z.boolean().describe("是否显示X轴标签"),
  yAxisLabelShow: z.boolean().describe("是否显示Y轴标签"),
  xAxisType: z.enum(["category", "value", "time", "log"]).describe("X轴类型"),
  xAxisLabelLimit: z.boolean().describe("X轴标签是否限制"),
  xAxisLabelLimitNum: z.number().describe("X轴标签限制数量"),
  xAxisInterval: z.number().describe("X轴刻度间隔"),
  xAxisRotate: z.number().describe("X轴标签旋转角度"),
  yAxisMin: z.string().describe("Y轴最小值"),
  yAxisMax: z.string().describe("Y轴最大值"),
  xAxisMargin: z.number().describe("X轴轴线与标签间距"),
  yAxisMargin: z.number().describe("Y轴轴线与标签间距"),
  xAxisFontFamily: z.string().describe("X轴字体名称"),
  yAxisFontFamily: z.string().describe("Y轴字体名称"),
  xAxisFontSize: z.number().describe("X轴字体大小"),
  yAxisFontSize: z.number().describe("Y轴字体大小"),
  xAxisColor: z.string().describe("X轴字体颜色"),
  yAxisColor: z.string().describe("Y轴字体颜色"),
  xAxisFontStyle: z.string().describe("X轴字体样式"),
  yAxisFontStyle: z.string().describe("Y轴字体样式"),
  xAxisFontWeight: z.string().describe("X轴字体粗细"),
  yAxisFontWeight: z.string().describe("Y轴字体粗细"),
  yAxisNameShow: z.boolean().describe("是否显示Y轴名称"),
  yAxisName: z.string().describe("Y轴名称"),
  yAxisNameFontFamily: z.string().describe("Y轴名称字体"),
  yAxisNameFontSize: z.number().describe("Y轴名称字体大小"),
  yAxisNameColor: z.string().describe("Y轴名称字体颜色"),
  yAxisNameFontStyle: z.string().describe("Y轴名称字体样式"),
  yAxisNameFontWeight: z.string().describe("Y轴名称字体粗细"),
  yAxisNamePaddingTop: z.number().describe("Y轴名称顶部内边距"),
  yAxisNamePaddingBottom: z.number().describe("Y轴名称底部内边距"),
  yAxisNamePaddingLeft: z.number().describe("Y轴名称左侧内边距"),
  yAxisNamePaddingRight: z.number().describe("Y轴名称右侧内边距"),
  xAxisLineShow: z.boolean().describe("是否显示X轴线"),
  yAxisLineShow: z.boolean().describe("是否显示Y轴线"),
  xAxisLineColor: z.string().describe("X轴线颜色"),
  yAxisLineColor: z.string().describe("Y轴线颜色"),
  xAxisLineWidth: z.number().describe("X轴线宽度"),
  yAxisLineWidth: z.number().describe("Y轴线宽度"),
  xAxisLineOpacity: z.number().describe("X轴线透明度"),
  yAxisLineOpacity: z.number().describe("Y轴线透明度"),
  xAxisTickShow: z.boolean().describe("是否显示X轴刻度"),
  yAxisTickShow: z.boolean().describe("是否显示Y轴刻度"),
  xAxisTickColor: z.string().describe("X轴刻度颜色"),
  yAxisTickColor: z.string().describe("Y轴刻度颜色"),
  xAxisTickWidth: z.number().describe("X轴刻度宽度"),
  yAxisTickWidth: z.number().describe("Y轴刻度宽度"),
  xAxisTickLength: z.number().describe("X轴刻度长度"),
  yAxisTickLength: z.number().describe("Y轴刻度长度"),
  xAxisSplitLineShow: z.boolean().describe("是否显示X轴分割线"),
  yAxisSplitLineShow: z.boolean().describe("是否显示Y轴分割线"),
  xAxisSplitLineInterval: z.number().describe("X轴分割线间隔"),
  xAxisSplitLineWidth: z.number().describe("X轴分割线宽度"),
  yAxisSplitLineWidth: z.number().describe("Y轴分割线宽度"),
  xAxisSplitLineColor: z.string().describe("X轴分割线颜色"),
  yAxisSplitLineColor: z.string().describe("Y轴分割线颜色"),
  xAxisSplitLineType: z.string().describe("X轴分割线类型"),
  yAxisSplitLineType: z.string().describe("Y轴分割线类型"),

  // ============ 数据循环配置 ============
  dataLoop: z.boolean().describe("是否启用数据循环"),
  dataLoopInterval: z.number().describe("数据循环间隔（秒）"),
  dataLoopDisplayRows: z.number().describe("数据循环显示行数"),
  dataLoopRollNum: z.number().describe("数据循环滚动数量"),

  // ============ 数据缩放配置 ============
  dataZoomShow: z.boolean().describe("是否显示数据缩放"),
  moveHandleSize: z.number().describe("移动手柄大小"),
  moveHandleColor: z.string().describe("移动手柄颜色"),
  moveHandleEmphasisColor: z.string().describe("移动手柄高亮颜色"),
  dataZoomBottom: z.number().describe("数据缩放底部距离"),

  // ============ Tooltip 配置 ============
  tooltipLoop: z.boolean().describe("Tooltip 是否循环"),
  tooltipLoopInterval: z.number().describe("Tooltip 循环间隔（秒）"),
  tooltipTriggerOn: z.boolean().describe("Tooltip 是否触发"),
  tooltipOffsetX: z.number().describe("Tooltip X轴偏移"),
  tooltipOffsetY: z.number().describe("Tooltip Y轴偏移"),
  tooltipBackground: z.string().describe("Tooltip 背景色"),
  tooltipWidth: z.number().describe("Tooltip 宽度"),
  tooltipHeight: z.number().describe("Tooltip 高度"),
  tooltipPaddingTop: z.number().describe("Tooltip 顶部内边距"),
  tooltipPaddingBottom: z.number().describe("Tooltip 底部内边距"),
  tooltipPaddingLeft: z.number().describe("Tooltip 左侧内边距"),
  tooltipPaddingRight: z.number().describe("Tooltip 右侧内边距"),
  tooltipNameFontFamily: z.string().describe("Tooltip 名称字体"),
  tooltipNameFontSize: z.number().describe("Tooltip 名称字体大小"),
  tooltipNameColor: z.string().describe("Tooltip 名称字体颜色"),
  tooltipNameFontWeight: z.string().describe("Tooltip 名称字体粗细"),
  tooltipNameFontStyle: z.string().describe("Tooltip 名称字体样式"),
  tooltipAlign: z.enum(["left", "center", "right"]).describe("Tooltip 对齐方式"),
  tooltipNameOffsetX: z.number().describe("Tooltip 名称X轴偏移"),
  tooltipNameOffsetY: z.number().describe("Tooltip 名称Y轴偏移"),
  tooltipArrLineHeight: z.number().describe("Tooltip 数组行高"),
  tooltipSeriesNameFontFamily: z.string().describe("Tooltip 系列名字体"),
  tooltipSeriesNameFontSize: z.number().describe("Tooltip 系列名字体大小"),
  tooltipSeriesNameColor: z.string().describe("Tooltip 系列名字体颜色"),
  tooltipSeriesNameFontWeight: z.string().describe("Tooltip 系列名字体粗细"),
  tooltipSeriesNameFontStyle: z.string().describe("Tooltip 系列名字体样式"),
  tooltipValueFontFamily: z.string().describe("Tooltip 数值字体"),
  tooltipValueFontSize: z.number().describe("Tooltip 数值字体大小"),
  tooltipValueColor: z.string().describe("Tooltip 数值字体颜色"),
  tooltipValueFontWeight: z.string().describe("Tooltip 数值字体粗细"),
  tooltipValueFontStyle: z.string().describe("Tooltip 数值字体样式"),
  tooltipUnit: z.array(z.string()).describe("Tooltip 单位数组"),
  tooltipUnitFontFamily: z.string().describe("Tooltip 单位字体"),
  tooltipUnitFontSize: z.number().describe("Tooltip 单位字体大小"),
  tooltipUnitColor: z.string().describe("Tooltip 单位字体颜色"),
  tooltipUnitFontWeight: z.string().describe("Tooltip 单位字体粗细"),
  tooltipUnitFontStyle: z.string().describe("Tooltip 单位字体样式"),
  tooltipUnitOffsetX: z.number().describe("Tooltip 单位X轴偏移"),
  tooltipUnitOffsetY: z.number().describe("Tooltip 单位Y轴偏移"),
  tooltipMarkerSize: z.number().describe("Tooltip 标记大小"),
  dataUnitName: z.array(z.string()).describe("数据单位名称"),
  unitTabsName: z.array(tabOptionSchema).describe("单位标签页配置"),
  tooltipAxisPointerWidth: z.number().describe("Tooltip 指示线宽度"),
  tooltipAxisPointerColor: z.string().describe("Tooltip 指示线颜色")
});

export type echartbarOption = z.infer<typeof echartbarOptionSchema>;
