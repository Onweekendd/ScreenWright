import { z } from "zod";

/**
 * 时间轴 (ftTimerShaft)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `label` - 年份/时间标签
 * - `value` - 时间值
 *
 * @example
 * ```typescript
 * const data: ftTimerShaftData = [
 *   { label: 2019, value: 2019 },
 *   { label: 2020, value: 2020 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swTimerShaftDataItemSchema = z.object({
  label: z.union([z.string(), z.number()]).describe("年份/时间标签"),
  value: z.union([z.string(), z.number()]).describe("时间值")
});

export const swTimerShaftDataSchema = z.array(swTimerShaftDataItemSchema);
export type ftTimerShaftData = z.infer<typeof swTimerShaftDataSchema>;

// 文本阴影 Schema
const textShadowSchema = z.object({
  x: z.number(),
  y: z.number(),
  blur: z.number(),
  color: z.string(),
  extend: z.number()
}).passthrough();

// 节点样式 Schema
const nodeStyleSchema = z.object({
  textTranslateX: z.number(),
  textTranslateY: z.number(),
  isBorder: z.boolean(),
  borderWidth: z.number(),
  borderColor: z.string(),
  backgroundColor: z.string().optional(),
  fontSize: z.number(),
  fontWeight: z.boolean(),
  cursorColor: z.string(),
  cursorSize: z.number(),
  fontStyle: z.boolean(),
  fontFamily: z.string(),
  fontColor: z.string(),
  isTextShadow: z.boolean(),
  textShadow: textShadowSchema.optional()
}).passthrough();

/**
 * 时间轴配置选项 Schema
 */
export const swTimerShaftOptionSchema = z.object({
  active: z.number().describe("默认激活索引"),
  size: z.number().describe("可见节点数量"),
  autoPlay: z.boolean().describe("是否自动播放"),
  loop: z.boolean().describe("是否循环播放"),
  isPrewrap: z.boolean().describe("是否预包裹"),
  interval: z.number().describe("自动播放间隔（秒）"),
  iconSize: z.number().describe("图标大小"),
  iconLeft: z.number().describe("图标左边距"),
  arrowLeft: z.number().describe("左箭头大小"),
  arrowRight: z.number().describe("右箭头大小"),
  margin: z.number().describe("节点间距"),
  lineColor: z.string().describe("轴线颜色"),
  lineHeight: z.number().describe("轴线高度"),
  defaultObj: nodeStyleSchema.describe("默认节点样式"),
  activeObj: nodeStyleSchema.describe("激活节点样式")
});

export type ftTimerShaftOption = z.infer<typeof swTimerShaftOptionSchema>;
