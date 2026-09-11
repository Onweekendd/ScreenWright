import { z } from "zod";

/**
 * 滚动选择器 (scrollPicker)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `label` - 标签
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: scrollPickerData = [
 *   { label: "Tab A", value: "1" },
 *   { label: "Tab B", value: "2" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const scrollPickerDataItemSchema = z.object({
  label: z.string().describe("标签名称"),
  value: z.union([z.string(), z.number()]).describe("数值")
});

export const scrollPickerDataSchema = z.array(scrollPickerDataItemSchema);
export type scrollPickerData = z.infer<typeof scrollPickerDataSchema>;

// 选项样式 Schema
const pickerStyleSchema = z.object({
  textFontFamily: z.string(),
  textFontSize: z.number(),
  textLineHeight: z.number(),
  textLetterSpacing: z.number(),
  textColor: z.string(),
  textFontStyle: z.string(),
  textFontWeight: z.string(),
  textAlign: z.string(),
  isTextShadow: z.boolean(),
  textShadowColor: z.string().optional(),
  textShadowX: z.number().optional(),
  textShadowY: z.number().optional(),
  textShadowBlur: z.number().optional(),
  backgroundType: z.string(),
  backgroundColor: z.string(),
  backgroundImage: z.string().optional(),
  backgroundImageType: z.string().optional()
}).passthrough();

/**
 * 滚动选择器配置选项 Schema
 */
export const scrollPickerOptionSchema = z.object({
  globalConfig: z.object({
    defaultSelected: z.number().describe("默认选中索引"),
    showNum: z.number().describe("显示数量"),
    tabInterval: z.number().describe("选项间距"),
    permutationType: z.string().describe("排列类型"),
    autoCarousel: z.boolean().describe("是否自动轮播"),
    tabIntervalTime: z.number().describe("轮播间隔时间（秒）")
  }).passthrough().describe("全局配置"),
  defaultObj: pickerStyleSchema.describe("默认样式"),
  activeObj: pickerStyleSchema.describe("激活样式")
});

export type scrollPickerOption = z.infer<typeof scrollPickerOptionSchema>;
