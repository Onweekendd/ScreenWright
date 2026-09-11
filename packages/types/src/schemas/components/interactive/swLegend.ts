import { z } from "zod";

/**
 * 图例 (ftLegend)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `label` - 名称
 * - `value` - 值
 * - `isChecked` - 是否选中
 * - `children` - 子类列表
 *
 * @example
 * ```typescript
 * const data: ftLegendData = [
 *   { label: "选项A", value: 1, isChecked: false, children: [...] }
 * ];
 * ```
 */

// 子项 Schema
const legendChildSchema = z.object({
  label: z.string().describe("子类名称"),
  value: z.union([z.string(), z.number()]).describe("子类值"),
  isChecked: z.boolean().optional().describe("是否选中")
});

// 单个数据项的 Schema
const swLegendDataItemSchema = z.object({
  label: z.string().describe("选项名称"),
  value: z.union([z.string(), z.number()]).describe("选项值"),
  isChecked: z.boolean().optional().describe("是否选中"),
  children: z.array(legendChildSchema).optional().describe("子类列表")
});

export const swLegendDataSchema = z.array(swLegendDataItemSchema);
export type ftLegendData = z.infer<typeof swLegendDataSchema>;

/**
 * 图例配置选项 Schema
 */
export const swLegendOptionSchema = z.object({
  checkboxPaddingTop: z.number().describe("复选框上内边距"),
  checkboxPaddingBottom: z.number().describe("复选框下内边距"),
  checkboxPaddingLeft: z.number().describe("复选框左内边距"),
  checkboxPaddingRight: z.number().describe("复选框右内边距"),
  checkboxWidth: z.number().describe("复选框宽度"),
  checkboxHeight: z.number().describe("复选框高度"),
  checkboxBorderColor: z.string().describe("复选框边框颜色"),
  checkboxBackgroundColor: z.string().describe("复选框背景颜色"),
  checkboxBorderColorIsChecked: z.string().describe("选中时复选框边框颜色"),
  checkboxBackgroundColorIsChecked: z.string().describe("选中时复选框背景颜色"),
  checkboxCheckPositionX: z.number().describe("勾选标记X位置"),
  checkboxCheckPositionY: z.number().describe("勾选标记Y位置"),
  checkboxCheckColor: z.string().describe("勾选标记颜色"),
  labelFontFamily: z.string().describe("标签字体族"),
  labelFontSize: z.number().describe("标签字体大小"),
  labelColor: z.string().describe("标签字体颜色"),
  labelFontWeight: z.string().describe("标签字体粗细"),
  labelFontStyle: z.string().describe("标签字体样式"),
  labelLetterSpacing: z.number().describe("标签字间距"),
  labelFontFamilyIsChecked: z.string().describe("选中时标签字体族"),
  labelFontSizeIsChecked: z.number().describe("选中时标签字体大小"),
  labelColorIsChecked: z.string().describe("选中时标签字体颜色"),
  labelFontWeightIsChecked: z.string().describe("选中时标签字体粗细"),
  labelFontStyleIsChecked: z.string().describe("选中时标签字体样式"),
  labelLetterSpacingIsChecked: z.number().describe("选中时标签字间距"),
  backgroundBackgroundType: z.string().describe("背景类型"),
  backgroundBackgroundColor: z.string().describe("背景颜色"),
  backgroundBackgroundImage: z.string().describe("背景图片"),
  backgroundBorderColor: z.string().describe("背景边框颜色"),
  backgroundBorderRadius: z.number().describe("背景边框圆角")
});

export type ftLegendOption = z.infer<typeof swLegendOptionSchema>;
