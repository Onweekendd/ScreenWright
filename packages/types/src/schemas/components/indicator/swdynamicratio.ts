import { z } from "zod";

/**
 * 环比同比图 (ftdynamicratio)
 * 指标
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: ftdynamicratioData = [
 *   { value: 10 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const ftdynamicratioDataItemSchema = z.object({
  value: z.number().describe("数值")
});

// 数据数组 Schema
export const ftdynamicratioDataSchema = z.array(ftdynamicratioDataItemSchema);

export type ftdynamicratioData = z.infer<typeof ftdynamicratioDataSchema>;

/**
 * 环比同比图配置选项 Schema
 *
 * 注意：该组件许多字段为数组类型，数组索引0对应环比、索引1对应同比。
 */
export const ftdynamicratioOptionSchema = z.object({
  // ============ 基础配置 ============
  thresholdValue: z.number().describe("阈值，用于判断环比同比的正负"),

  // ============ 字体配置（数组：索引0为环比，索引1为同比） ============
  fontFamily: z.array(z.string()).describe("字体列表，索引0为环比字体，索引1为同比字体"),
  fontSize: z.array(z.number()).describe("字体大小列表，索引0为环比字号，索引1为同比字号"),
  textColor: z.array(z.string()).describe("文本颜色列表，索引0为环比颜色，索引1为同比颜色"),
  fontWeight: z.array(z.string()).describe("字体粗细列表，索引0为环比粗细，索引1为同比粗细"),
  fontStyle: z.array(z.string()).describe("字体样式列表，索引0为环比样式，索引1为同比样式"),

  // ============ 选中文字配置（数组） ============
  selectedTextType: z.array(z.string()).describe("选中文字类型列表"),
  selectedTextColor: z.array(z.string()).describe("选中文字颜色列表，支持渐变色"),
  selectedTextOpacity: z.array(z.number()).describe("选中文字不透明度列表"),

  // ============ 对齐配置 ============
  textAlign: z.string().describe("水平对齐方式，如 center、left、right"),
  textAlignVertical: z.string().describe("垂直对齐方式，如 center、top、bottom"),

  // ============ 间距与单位配置（数组） ============
  split: z.array(z.number()).describe("间距列表"),
  textUnit: z.array(z.string()).describe("文本单位列表"),

  // ============ 背景配置（数组） ============
  backgroundColor: z.array(z.string()).describe("背景颜色列表"),

  // ============ 阴影配置（数组） ============
  shadowShow: z.array(z.boolean()).describe("是否显示阴影列表"),
  shadowColor: z.array(z.string()).describe("阴影颜色列表"),
  shadowX: z.array(z.number()).describe("阴影X轴偏移列表"),
  shadowY: z.array(z.number()).describe("阴影Y轴偏移列表"),
  shadowFuzzy: z.array(z.number()).describe("阴影模糊度列表"),
  shadowExtension: z.array(z.number()).describe("阴影扩展范围列表"),

  // ============ 图标配置（数组） ============
  iconColor: z.array(z.string()).describe("图标颜色列表，索引0为环比图标颜色，索引1为同比图标颜色"),
  iconSize: z.array(z.number()).describe("图标大小列表，索引0为环比图标大小，索引1为同比图标大小")
});

export type ftdynamicratioOption = z.infer<typeof ftdynamicratioOptionSchema>;
