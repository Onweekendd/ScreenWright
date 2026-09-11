import { z } from "zod";

/**
 * 水球图 (echartliquidFill)
 * 指标
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `seriesName` - 系列名称
 * - `percent` - 占比值（0-1之间）
 *
 * @example
 * ```typescript
 * const data: EchartLiquidFillData = [
 *   { seriesName: "A", percent: 0.5 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartLiquidFillDataItemSchema = z.object({
  seriesName: z.string().describe("系列名称"),
  percent: z.number().describe("占比值（0-1之间）")
});

// 数据数组 Schema（最终导出的类型）
export const echartLiquidFillDataSchema = z.array(echartLiquidFillDataItemSchema);

export type EchartLiquidFillData = z.infer<typeof echartLiquidFillDataSchema>;

/**
 * 水球图配置选项 Schema
 */
export const echartLiquidFillOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 位置与尺寸 ============
  centerX: z.number().describe("圆心X坐标（百分比）"),
  centerY: z.number().describe("圆心Y坐标（百分比）"),
  radius: z.number().describe("水球半径（百分比）"),

  // ============ 波浪配置 ============
  amplitude: z.number().describe("波浪振幅"),
  waveLength: z.number().describe("波浪长度"),
  direction: z.string().describe("波浪方向，如 right/left"),
  shape: z.string().describe("水球形状，如 circle/rect/roundRect/triangle/diamond/pin"),
  waveColor: z.array(z.string()).describe("波浪颜色列表"),
  waveAnimation: z.boolean().describe("是否启用波浪动画"),

  // ============ 外边框配置 ============
  outlineShow: z.boolean().describe("是否显示外边框"),
  outlineBorderDistance: z.number().describe("外边框距离"),
  outlineColor: z.string().describe("外边框内部填充色"),
  outlineBorderColor: z.string().describe("外边框边框颜色"),
  outlineBorderWidth: z.number().describe("外边框边框宽度"),

  // ============ 背景配置 ============
  backgroundColor: z.string().describe("背景色"),

  // ============ 系列样式 ============
  seriesItemStyleOpacity: z.number().describe("系列不透明度（0-1）"),

  // ============ 标签内部颜色 ============
  seriesLabelInsideColor: z.string().describe("标签内部颜色"),

  // ============ 标签配置 ============
  seriesLabelShow: z.boolean().describe("是否显示标签"),

  // ============ 标签-系列名称配置 ============
  seriesLabelSeriesShow: z.boolean().describe("是否显示系列名称标签"),
  seriesLabelSeriesFontFamily: z.string().describe("系列名称标签字体"),
  seriesLabelSeriesFontSize: z.number().describe("系列名称标签字体大小"),
  seriesLabelSeriesColor: z.string().describe("系列名称标签颜色"),
  seriesLabelSeriesFontStyle: z.string().describe("系列名称标签字体样式"),
  seriesLabelSeriesFontWeight: z.string().describe("系列名称标签字体粗细"),
  seriesLabelSeriesBottomPadding: z.number().describe("系列名称标签底部内边距"),

  // ============ 标签-百分比配置 ============
  seriesLabelPercentShow: z.boolean().describe("是否显示百分比标签"),
  seriesLabelPercentValue: z.number().describe("百分比小数位数"),
  seriesLabelPercentFontFamily: z.string().describe("百分比标签字体"),
  seriesLabelPercentFontSize: z.number().describe("百分比标签字体大小"),
  seriesLabelPercentColor: z.string().describe("百分比标签颜色"),
  seriesLabelPercentFontStyle: z.string().describe("百分比标签字体样式"),
  seriesLabelPercentFontWeight: z.number().describe("百分比标签字体粗细"),

  // ============ 标签位置配置 ============
  seriesLabelAlign: z.string().describe("标签水平对齐方式"),
  seriesLabelBaseline: z.string().describe("标签垂直对齐方式"),
  seriesLabelPositionX: z.number().describe("标签X坐标（百分比）"),
  seriesLabelPositionY: z.number().describe("标签Y坐标（百分比）"),

  // ============ 水波标签页名称 ============
  waveTabsName: z.array(z.string()).describe("水波标签页名称列表")
});

export type EchartLiquidFillOption = z.infer<typeof echartLiquidFillOptionSchema>;
