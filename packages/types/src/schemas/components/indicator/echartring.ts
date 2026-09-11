import { z } from "zod";

/**
 * 环形图 (echartring)
 * 指标
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 当前值
 * - `total` - 总数
 *
 * @example
 * ```typescript
 * const data: EchartRingData = [
 *   { value: 75, total: 100 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartRingDataItemSchema = z.object({
  value: z.number().describe("当前值"),
  total: z.number().describe("总数")
});

// 数据数组 Schema（最终导出的类型）
export const echartRingDataSchema = z.array(echartRingDataItemSchema);

export type EchartRingData = z.infer<typeof echartRingDataSchema>;

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
 * 环形图配置选项 Schema
 */
export const echartRingOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 环形图位置与尺寸 ============
  startAngle: z.number().describe("起始角度"),
  centerX: z.number().describe("圆心X坐标（百分比）"),
  centerY: z.number().describe("圆心Y坐标（百分比）"),
  radiusMax: z.number().describe("外环半径（百分比）"),
  radiusMin: z.number().describe("内环半径（百分比）"),

  // ============ 系列颜色配置 ============
  seriesColor: seriesColorSchema.describe("系列颜色（渐变）"),

  // ============ 系列样式 ============
  seriesOpacity: z.number().describe("系列不透明度（0-100）"),
  barGap: z.number().describe("柱间距离（百分比）"),
  barCategoryGap: z.number().describe("类目间距离（百分比）"),

  // ============ 标签配置 ============
  seriesLabelShow: z.boolean().describe("是否显示标签"),
  seriesLabelUtil: z.string().describe("标签单位符号"),
  seriesLabelColor: z.string().describe("标签颜色"),
  seriesLabelFontFamily: z.string().describe("标签字体"),
  seriesLabelFontSize: z.number().describe("标签字体大小"),
  seriesLabelFontWeight: z.string().describe("标签字体粗细"),
  seriesLabelFontStyle: z.string().describe("标签字体样式"),
  seriesLabelOffsetX: z.number().describe("标签X轴偏移"),
  seriesLabelOffsetY: z.number().describe("标签Y轴偏移")
});

export type EchartRingOption = z.infer<typeof echartRingOptionSchema>;
