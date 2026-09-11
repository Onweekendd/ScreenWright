import { z } from "zod";

/**
 * 多选框 (formCheckbox)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `label` - 名称
 * - `value` - 数值
 * - `isChecked` - 是否选中
 * - `disabled` - 是否禁用
 *
 * @example
 * ```typescript
 * const data: formCheckboxData = [
 *   { label: "周一", value: "1", isChecked: true, disabled: false }
 * ];
 * ```
 */

// 单个数据项的 Schema
const formCheckboxDataItemSchema = z.object({
  label: z.string().describe("选项名称"),
  value: z.union([z.string(), z.number()]).describe("选项值"),
  isChecked: z.boolean().optional().describe("是否选中"),
  disabled: z.boolean().optional().describe("是否禁用")
});

export const formCheckboxDataSchema = z.array(formCheckboxDataItemSchema);
export type formCheckboxData = z.infer<typeof formCheckboxDataSchema>;

/**
 * 多选框配置选项 Schema
 */
export const formCheckboxOptionSchema = z.object({
  disabled: z.boolean().describe("是否禁用"),
  paddingTop: z.number().describe("上内边距"),
  paddingLeft: z.number().describe("左内边距"),
  textColor: z.string().describe("文本颜色"),
  fillColor: z.string().describe("选中填充颜色"),
  min: z.number().describe("最小可选数"),
  max: z.number().describe("最大可选数"),
  sizeX: z.number().describe("复选框宽度"),
  sizeY: z.number().describe("复选框高度"),
  fontColor: z.string().describe("字体颜色"),
  fontSize: z.number().describe("字体大小"),
  letterSpacing: z.number().describe("字间距"),
  fontWeight: z.boolean().describe("字体加粗"),
  fontFamily: z.string().describe("字体族"),
  fontStyle: z.boolean().describe("字体斜体"),
  textTranslateX: z.number().describe("文本X偏移"),
  textTranslateY: z.number().describe("文本Y偏移"),
  isTextShadow: z.boolean().describe("是否显示文本阴影"),
  textShadow: z.object({
    color: z.string(),
    x: z.number(),
    y: z.number(),
    blur: z.number(),
    extend: z.number()
  }).passthrough().optional().describe("文本阴影配置")
});

export type formCheckboxOption = z.infer<typeof formCheckboxOptionSchema>;
