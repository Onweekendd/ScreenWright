import { z } from "zod";

/**
 * 状态文本框 (ftText2)
 * 文字
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 文本内容
 *
 * @example
 * ```typescript
 * const data: FtText2Data = [
 *   { value: "我是一个状态文本" }
 * ];
 * ```
 */

// 状态样式卡片
const swText2CardItemSchema = z.object({
  tabsName: z.string().describe("样式卡片名称"),
  mappingValue: z.string().describe("映射匹配值"),
  mappingValueType: z.string().describe("映射值类型"),
  conditions: z.string().describe("匹配条件表达式"),
  fontFamily: z.string().describe("卡片字体"),
  fontSize: z.number().describe("卡片字号"),
  fontStyle: z.string().describe("卡片字体样式"),
  fontWeight: z.string().describe("卡片字重"),
  selectedTextType: z.string().describe("卡片选中文字类型"),
  color: z.string().describe("卡片字体颜色"),
  backgroundColor: z.string().describe("卡片背景颜色"),
  selectedTextColor: z.string().describe("卡片选中文字颜色(渐变)"),
  selectedTextOpacity: z.number().describe("卡片选中文字透明度")
});

// 单个数据项的 Schema
const swText2DataItemSchema = z.object({
  value: z.string().describe("文本内容")
});

// 数据数组 Schema
export const swText2DataSchema = z.array(swText2DataItemSchema);

export type FtText2Data = z.infer<typeof swText2DataSchema>;

// ==================== Option Schema ====================

/**
 * 状态文本框配置选项 Schema
 */
export const swText2OptionSchema = z.object({
  // ============ 基础配置 ============
  iswrap: z.boolean().describe("是否自动换行"),
  lineHeight: z.number().describe("行高(px)"),
  split: z.number().describe("字间距"),
  textAlign: z.string().describe("水平对齐(left/center/right)"),
  textAlignVertical: z.string().describe("垂直对齐(top/center/bottom)"),

  // ============ 字体配置 ============
  fontFamily: z.string().describe("字体"),
  fontSize: z.number().describe("字号"),
  color: z.string().describe("字体颜色"),
  fontWeight: z.string().describe("字重"),
  fontStyle: z.string().describe("字体样式"),

  // ============ 选中文字配置 ============
  selectedTextType: z.string().describe("选中文字类型(normal/gradient)"),
  selectedTextColor: z.string().describe("选中文字颜色(支持渐变)"),
  selectedTextOpacity: z.number().describe("选中文字透明度(0-100)"),

  // ============ 背景配置 ============
  backgroundColor: z.string().describe("背景颜色"),

  // ============ 文字阴影配置 ============
  shadowShow: z.boolean().describe("是否显示阴影"),
  shadowColor: z.string().describe("阴影颜色"),
  shadowX: z.number().describe("阴影X偏移"),
  shadowY: z.number().describe("阴影Y偏移"),
  shadowFuzzy: z.number().describe("阴影模糊度"),
  shadowExtension: z.number().describe("阴影扩展"),

  // ============ 状态样式卡片 ============
  cardList: z.array(swText2CardItemSchema).describe("状态样式卡片列表，根据数据值匹配不同样式")
});

export type FtText2Option = z.infer<typeof swText2OptionSchema>;
