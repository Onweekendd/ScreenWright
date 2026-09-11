import { z } from "zod";

/**
 * 层叠玫瑰图 (echartpluralRosePie)
 * 图表 > 饼图
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
 * const data: echartpluralRosePieData = [
 *   { seriesName: "系列一", name: "A", value: 20 },
 *   { seriesName: "系列二", name: "A", value: 23 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartpluralRosePieDataItemSchema = z.object({
  name: z.string(),
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartpluralRosePieDataSchema = z.array(echartpluralRosePieDataItemSchema);

export type echartpluralRosePieData = z.infer<typeof echartpluralRosePieDataSchema>;

// Tab 选项配置
const tabOptionSchema = z.object({
  name: z.string(),
  value: z.string()
});

// 位置配置
const positionSchema = z.object({
  top: z.union([z.number(), z.string()]),
  left: z.union([z.number(), z.string()]).optional(),
  bottom: z.union([z.number(), z.string()]).optional(),
  right: z.union([z.number(), z.string()]).optional()
});

/**
 * 层叠玫瑰图配置选项 Schema
 */
export const echartpluralRosePieOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),
  stack: z.boolean().describe("是否堆叠显示"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),
  seriesColor: z.array(z.string()).describe("系列颜色列表"),
  seriesColorpicker: z.array(z.string()).describe("系列颜色选择器值"),
  barCategoryGap: z.number().describe("类目间距离（百分比）"),

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
  seriesLabelColor: z.string().describe("标签颜色"),
  seriesLabelFontFamily: z.string().describe("标签字体"),
  seriesLabelFontSize: z.number().describe("标签字体大小"),
  seriesLabelFontWeight: z.string().describe("标签字体粗细"),
  seriesLabelFontStyle: z.string().describe("标签字体样式"),
  seriesLabelOffsetX: z.number().describe("标签X轴偏移"),
  seriesLabelOffsetY: z.number().describe("标签Y轴偏移"),

  // ============ 极坐标配置 ============
  polarCenterX: z.number().describe("极坐标中心X位置（百分比）"),
  polarCenterY: z.number().describe("极坐标中心Y位置（百分比）"),
  polarRadiusMax: z.number().describe("极坐标最大半径（百分比）"),
  polarRadiusMin: z.number().describe("极坐标最小半径（百分比）"),

  // ============ 角度轴配置（Angle Axis）============
  angleAxisInverse: z.boolean().describe("角度轴是否反向"),
  angleAxisShow: z.boolean().describe("是否显示角度轴"),
  angleAxisStartAngle: z.number().describe("角度轴起始角度"),
  angleAxisLabelShow: z.boolean().describe("是否显示角度轴标签"),
  angleAxisInterval: z.number().describe("角度轴刻度间隔"),
  angleAxisMargin: z.number().describe("角度轴轴线与标签间距"),
  angleAxisFontFamily: z.string().describe("角度轴字体名称"),
  angleAxisFontSize: z.number().describe("角度轴字体大小"),
  angleAxisColor: z.string().describe("角度轴字体颜色"),
  angleAxisFontStyle: z.string().describe("角度轴字体样式"),
  angleAxisFontWeight: z.string().describe("角度轴字体粗细"),
  angleAxisLineShow: z.boolean().describe("是否显示角度轴线"),
  angleAxisLineColor: z.string().describe("角度轴线颜色"),
  angleAxisLineWidth: z.number().describe("角度轴线宽度"),
  angleAxisLineOpacity: z.number().describe("角度轴线透明度"),
  angleAxisTickShow: z.boolean().describe("是否显示角度轴刻度"),
  angleAxisTickColor: z.string().describe("角度轴刻度颜色"),
  angleAxisTickWidth: z.number().describe("角度轴刻度宽度"),
  angleAxisTickLength: z.number().describe("角度轴刻度长度"),
  angleAxisSplitLineShow: z.boolean().describe("是否显示角度轴分割线"),
  angleAxisSplitLineWidth: z.number().describe("角度轴分割线宽度"),
  angleAxisSplitLineColor: z.string().describe("角度轴分割线颜色"),

  // ============ 径向轴配置（Radius Axis）============
  radiusAxisInverse: z.boolean().describe("径向轴是否反向"),
  radiusAxisShow: z.boolean().describe("是否显示径向轴"),
  radiusAxisLabelShow: z.boolean().describe("是否显示径向轴标签"),
  radiusAxisMin: z.string().describe("径向轴最小值"),
  radiusAxisMax: z.string().describe("径向轴最大值"),
  radiusAxisMargin: z.number().describe("径向轴轴线与标签间距"),
  radiusAxisFontFamily: z.string().describe("径向轴字体名称"),
  radiusAxisFontSize: z.number().describe("径向轴字体大小"),
  radiusAxisColor: z.string().describe("径向轴字体颜色"),
  radiusAxisFontStyle: z.string().describe("径向轴字体样式"),
  radiusAxisFontWeight: z.string().describe("径向轴字体粗细"),
  radiusAxisNameShow: z.boolean().describe("是否显示径向轴名称"),
  radiusAxisName: z.string().describe("径向轴名称"),
  radiusAxisNameFontFamily: z.string().describe("径向轴名称字体"),
  radiusAxisNameFontSize: z.number().describe("径向轴名称字体大小"),
  radiusAxisNameColor: z.string().describe("径向轴名称字体颜色"),
  radiusAxisNameFontStyle: z.string().describe("径向轴名称字体样式"),
  radiusAxisNameFontWeight: z.string().describe("径向轴名称字体粗细"),
  radiusAxisNamePaddingTop: z.number().describe("径向轴名称顶部内边距"),
  radiusAxisNamePaddingBottom: z.number().describe("径向轴名称底部内边距"),
  radiusAxisNamePaddingLeft: z.number().describe("径向轴名称左侧内边距"),
  radiusAxisNamePaddingRight: z.number().describe("径向轴名称右侧内边距"),
  radiusAxisLineShow: z.boolean().describe("是否显示径向轴线"),
  radiusAxisLineColor: z.string().describe("径向轴线颜色"),
  radiusAxisLineWidth: z.number().describe("径向轴线宽度"),
  radiusAxisLineOpacity: z.number().describe("径向轴线透明度"),
  radiusAxisTickShow: z.boolean().describe("是否显示径向轴刻度"),
  radiusAxisTickColor: z.string().describe("径向轴刻度颜色"),
  radiusAxisTickWidth: z.number().describe("径向轴刻度宽度"),
  radiusAxisTickLength: z.number().describe("径向轴刻度长度"),
  radiusAxisSplitLineShow: z.boolean().describe("是否显示径向轴分割线"),
  radiusAxisSplitLineNumber: z.number().describe("径向轴分割线数量"),
  radiusAxisSplitLineWidth: z.number().describe("径向轴分割线宽度"),
  radiusAxisSplitLineColor: z.string().describe("径向轴分割线颜色"),

  // ============ 数据循环配置 ============
  dataLoop: z.boolean().describe("是否启用数据循环"),
  dataLoopInterval: z.number().describe("数据循环间隔（秒）"),
  dataLoopDisplayRows: z.number().describe("数据循环显示行数"),
  dataLoopRollNum: z.number().describe("数据循环滚动数量"),

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

export type echartpluralRosePieOption = z.infer<typeof echartpluralRosePieOptionSchema>;
