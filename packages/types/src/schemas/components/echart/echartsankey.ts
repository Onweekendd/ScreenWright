import { z } from "zod";

/**
 * 桑基图 (echartsankey)
 * 图表 > 其他
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `source` - 源节点
 * - `target` - 目标节点
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: echartsankeyData = [
 *   { source: "安徽", target: "江苏", value: 18.68 },
 *   { source: "安徽", target: "浙江", value: 12.38 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartsankeyDataItemSchema = z.object({
  source: z.string(),
  target: z.string(),
  value: z.number()
});

// 数据数组 Schema（最终导出的类型）
export const echartsankeyDataSchema = z.array(echartsankeyDataItemSchema);

export type echartsankeyData = z.infer<typeof echartsankeyDataSchema>;

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
 * 桑基图配置选项 Schema
 */
export const echartsankeyOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean().describe("是否启用刷新"),

  // ============ 系列配置 ============
  dataSeriesName: z.array(z.string()).describe("数据系列名称列表"),
  seriesName: z.array(z.string()).describe("系列名称列表"),
  seriesTabsName: z.array(tabOptionSchema).describe("系列标签页配置"),

  // ============ 节点配置 ============
  points: z.array(z.string()).describe("节点名称列表"),
  pointColor: z.array(z.string()).describe("节点颜色列表"),
  labelPosition: z.array(z.enum(["left", "right", "top", "bottom"])).describe("标签位置列表"),
  linkName: z.array(z.string()).describe("连线名称列表"),
  links: z.array(linkItemSchema).describe("连线数据"),

  // ============ 桑基图位置配置 ============
  seriesLeft: z.number().describe("系列左边距"),
  seriesTop: z.number().describe("系列上边距"),
  seriesRight: z.number().describe("系列右边距"),
  seriesBottom: z.number().describe("系列下边距"),

  // ============ 系列标签配置 ============
  seriesLabelShow: z.boolean().describe("是否显示系列标签"),
  seriesLabelColor: z.string().describe("标签颜色"),
  seriesLabelFontFamily: z.string().describe("标签字体"),
  seriesLabelFontSize: z.number().describe("标签字体大小"),
  seriesLabelFontWeight: z.string().describe("标签字体粗细"),
  seriesLabelFontStyle: z.string().describe("标签字体样式"),
  seriesLabelOffsetX: z.number().describe("标签X轴偏移"),
  seriesLabelOffsetY: z.number().describe("标签Y轴偏移"),

  // ============ Tooltip 配置 ============
  tooltip: z
    .object({
      show: z.boolean().describe("是否显示提示框"),
      backgroundColor: z.string().describe("提示框背景色"),
      color: z.string().describe("提示框字体颜色")
    })
    .describe("Tooltip 配置"),

  // ============ 系列配置 ============
  series: z
    .object({
      draggable: z.boolean().describe("节点是否可拖拽"),
      nodeGap: z.number().describe("节点间距"),
      lineStyle: z
        .object({
          color: z.enum(["source", "target", "custom"]).describe("连线颜色模式"),
          customColor: z.string().describe("自定义连线颜色"),
          opacity: z.number().describe("连线透明度"),
          curveness: z.number().describe("连线曲度")
        })
        .describe("连线样式配置")
    })
    .describe("系列配置"),

  // ============ 系列标签详细配置 ============
  seriesLabel: z
    .object({
      padding: z.array(z.number()).describe("标签内边距 [top, right, bottom, left]"),
      align: z.enum(["left", "center", "right"]).describe("标签水平对齐方式"),
      nodeWidth: z.number().describe("节点宽度"),
      nodeAlign: z.enum(["left", "right", "justify"]).describe("节点对齐方式"),
      verticalAlign: z.enum(["top", "middle", "bottom"]).describe("标签垂直对齐方式")
    })
    .describe("系列标签详细配置")
});

export type echartsankeyOption = z.infer<typeof echartsankeyOptionSchema>;
