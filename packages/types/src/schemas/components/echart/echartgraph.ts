import { z } from "zod";

/**
 * 关系图 (echartgraph)
 * 图表 > 其他
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `name` - 节点名称
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: echartgraphData = [
 *   { name: "节点A", value: 2 },
 *   { name: "节点B", value: 1 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartgraphDataItemSchema = z.object({
  name: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartgraphDataSchema = z.array(echartgraphDataItemSchema);

export type echartgraphData = z.infer<typeof echartgraphDataSchema>;

// Tab 选项配置
const tabOptionSchema = z.object({
  name: z.string(),
  value: z.string()
});

// 连接项配置
const linkItemSchema = z.object({
  source: z.string(),
  target: z.string(),
  value: z.number(),
  color: z.string()
});

/**
 * 关系图配置选项 Schema
 */
export const echartgraphOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),

  // ============ 节点配置 ============
  points: z.array(z.string()).describe("节点标签列表"),
  pointColor: z.array(z.string()).describe("节点颜色列表"),
  labelPosition: z.array(z.enum(["left", "right", "top", "bottom"])).describe("标签位置列表"),
  pointsSymbol: z.array(z.string()).describe("节点标记类型"),
  pointsSymbolImage: z.array(z.string()).describe("节点标记图片路径"),
  pointsSymbolWidth: z.array(z.number()).describe("节点标记宽度"),
  pointsSymbolHeight: z.array(z.number()).describe("节点标记高度"),

  // ============ 连接配置 ============
  linkName: z.array(z.string()).describe("连线名称列表"),
  links: z.array(linkItemSchema).describe("连线数据"),
  seriesLinksSymbolSize: z.number().describe("连线标记大小"),
  seriesLinksLineWidth: z.number().describe("连线宽度"),
  seriesLinksLineType: z.array(z.enum(["solid", "dashed", "dotted"])).describe("连线类型列表"),

  // ============ 节点标签配置 ============
  seriesLabelAlign: z.array(z.enum(["left", "center", "right"])).describe("标签水平对齐方式"),
  seriesLabelVerticalAlign: z.array(z.enum(["top", "middle", "bottom"])).describe("标签垂直对齐方式"),
  seriesLabelNameShow: z.array(z.boolean()).describe("是否显示节点名称"),
  seriesLabelNameColor: z.array(z.string()).describe("节点名称字体颜色"),
  seriesLabelNameFontFamily: z.array(z.string()).describe("节点名称字体"),
  seriesLabelNameFontSize: z.array(z.number()).describe("节点名称字体大小"),
  seriesLabelNameFontWeight: z.array(z.string()).describe("节点名称字体粗细"),
  seriesLabelNameFontStyle: z.array(z.string()).describe("节点名称字体样式"),
  seriesLabelValueShow: z.array(z.boolean()).describe("是否显示节点数值"),
  seriesLabelValueColor: z.array(z.string()).describe("节点数值字体颜色"),
  seriesLabelValueFontFamily: z.array(z.string()).describe("节点数值字体"),
  seriesLabelValueFontSize: z.array(z.number()).describe("节点数值字体大小"),
  seriesLabelValueFontWeight: z.array(z.string()).describe("节点数值字体粗细"),
  seriesLabelValueFontStyle: z.array(z.string()).describe("节点数值字体样式")
});

export type echartgraphOption = z.infer<typeof echartgraphOptionSchema>;
