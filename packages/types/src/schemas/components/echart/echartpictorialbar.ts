import { z } from "zod";

/**
 * 象形图 (echartpictorialbar)
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
 * const data: echartpictorialbarData = [
 *   { seriesName: "系列一", name: "A", value: 2024 },
 *   { seriesName: "系列一", name: "B", value: 1423 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartpictorialbarDataItemSchema = z.object({
  name: z.string(),
  seriesName: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartpictorialbarDataSchema = z.array(echartpictorialbarDataItemSchema);

export type echartpictorialbarData = z.infer<typeof echartpictorialbarDataSchema>;

// Tab 选项配置
const tabOptionSchema = z.object({
  name: z.string(),
  value: z.string()
});

// 渐变颜色配置
const gradientColorSchema = z.object({
  type: z.string().optional(),
  angle: z.union([z.number(), z.string()]).optional(),
  colors: z.array(
    z.object({
      color: z.union([z.string(), z.number()]),
      per: z.number().optional()
    })
  ).optional()
}).passthrough();

/**
 * 象形图配置选项 Schema
 */
export const echartpictorialbarOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),
  seriesColor: z.array(gradientColorSchema).describe("系列颜色配置（渐变）"),
  seriesColorpicker: z.array(z.string()).describe("系列颜色选择器值"),
  seriesOpacity: z.array(z.number()).describe("系列透明度（0-100）"),

  // ============ 极值配置 ============
  extremeShow: z.array(z.boolean()).describe("是否显示极值标注"),
  extremeType: z.array(z.enum(["max", "min"])).describe("极值类型"),
  extremeColor: z.array(gradientColorSchema).describe("极值颜色配置"),
  extremeOpacity: z.array(z.number()).describe("极值透明度"),
  extremeColorpicker: z.array(z.string()).describe("极值颜色选择器值"),

  // ============ 标线配置 ============
  markLineShow: z.boolean().optional().describe("是否显示标线"),
  markLineDataType: z.array(z.string()).optional().describe("标线数据类型"),
  markLineData: z.array(z.any()).optional().describe("标线数据"),
  markLineSymbolStart: z.array(z.string()).optional().describe("标线起始标记类型"),
  markLineSymbolStartImage: z.array(z.string()).optional().describe("标线起始标记图片路径"),
  markLineSymbolEnd: z.array(z.string()).optional().describe("标线结束标记类型"),
  markLineSymbolEndImage: z.array(z.string()).optional().describe("标线结束标记图片路径"),
  markLineSymbolWidth: z.array(z.number()).optional().describe("标线标记宽度"),
  markLineSymbolHeight: z.array(z.number()).optional().describe("标线标记高度"),
  markLineLabelShow: z.array(z.boolean()).optional().describe("是否显示标线标签"),
  markLineLabelPosition: z.array(z.string()).optional().describe("标线标签位置"),
  markLineLabelDistance: z.array(z.number()).optional().describe("标线标签距离"),
  markLineLabelCustom: z.array(z.string()).optional().describe("标线标签自定义内容"),
  markLineLabelFontFamily: z.array(z.string()).optional().describe("标线标签字体"),
  markLineLabelFontStyle: z.array(z.string()).optional().describe("标线标签字体样式"),
  markLineLabelFontSize: z.array(z.number()).optional().describe("标线标签字体大小"),
  markLineLabelColor: z.array(z.string()).optional().describe("标线标签字体颜色"),
  markLineLabelFontWeight: z.array(z.string()).optional().describe("标线标签字体粗细"),
  markLineLabelPaddingTop: z.array(z.number()).optional().describe("标线标签顶部内边距"),
  markLineLabelPaddingRight: z.array(z.number()).optional().describe("标线标签右侧内边距"),
  markLineLabelPaddingBottom: z.array(z.number()).optional().describe("标线标签底部内边距"),
  markLineLabelPaddingLeft: z.array(z.number()).optional().describe("标线标签左侧内边距"),
  markLineLineColor: z.array(z.string()).optional().describe("标线颜色"),
  markLineLineWidth: z.array(z.number()).optional().describe("标线宽度"),
  markLineLineType: z.array(z.string()).optional().describe("标线类型"),

  // ============ 贴图配置 ============
  barGap: z.number().describe("系列间距"),
  barCategoryGap: z.number().describe("柱间间距"),
  symbol: z.string().describe("贴图路径"),
  symbolWidth: z.number().describe("贴图宽度（%）"),
  symbolHeight: z.number().describe("贴图高度（%）"),

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

  // ============ 数值标签配置 ============
  valueShow: z.boolean().optional().describe("是否显示数值标签"),
  valueFontFamily: z.string().optional().describe("数值标签字体"),
  valueFontSize: z.number().optional().describe("数值标签字体大小"),
  valueColor: z.string().optional().describe("数值标签字体颜色"),
  valueFontStyle: z.string().optional().describe("数值标签字体样式"),
  valueFontWeight: z.string().optional().describe("数值标签字体粗细"),
  valueOffSetX: z.number().optional().describe("数值标签X偏移"),
  valueOffSetY: z.number().optional().describe("数值标签Y偏移"),

  // ============ 数据循环配置 ============
  dataLoop: z.boolean().describe("是否启用数据循环"),
  dataLoopInterval: z.number().describe("数据循环间隔（秒）"),
  dataLoopDisplayRows: z.number().describe("数据循环显示行数"),
  dataLoopRollNum: z.number().describe("数据循环滚动数量")
});

export type echartpictorialbarOption = z.infer<typeof echartpictorialbarOptionSchema>;
