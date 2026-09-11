import { z } from "zod";

/**
 * 下拉框 (ftCustomSelect)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `label` - 标签
 * - `value` - 值
 * - `disabled` - 是否禁用
 * - `select` - 是否选中
 *
 * @example
 * ```typescript
 * const data: ftCustomSelectData = [
 *   { label: "广州", value: "10", disabled: false, select: false }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swCustomSelectDataItemSchema = z.object({
  label: z.string().describe("选项标签"),
  value: z.union([z.string(), z.number()]).describe("选项值"),
  disabled: z.boolean().optional().describe("是否禁用"),
  select: z.boolean().optional().describe("是否选中")
});

export const swCustomSelectDataSchema = z.array(swCustomSelectDataItemSchema);
export type ftCustomSelectData = z.infer<typeof swCustomSelectDataSchema>;

/**
 * 下拉框配置选项 Schema
 */
export const swCustomSelectOptionSchema = z.object({
  defaultIndex: z.number().describe("默认选中索引"),
  related: z.boolean().describe("是否关联"),
  placeholder: z.string().describe("占位文本"),
  indent: z.number().describe("缩进"),
  boxHeight: z.number().describe("选择框高度"),
  boxFontSize: z.number().describe("选择框字体大小"),
  boxFontFamily: z.string().describe("选择框字体族"),
  boxlineHeight: z.number().describe("选择框行高"),
  boxBackgroundType: z.string().describe("选择框背景类型"),
  boxBackground: z.string().describe("选择框背景颜色"),
  boxColor: z.string().describe("选择框字体颜色"),
  boxBackgroundImage: z.string().describe("选择框背景图片"),
  boxLetterSpacing: z.number().describe("选择框字间距"),
  boxFontStyle: z.string().describe("选择框字体样式"),
  boxFontWeight: z.string().describe("选择框字体粗细"),
  boxTextAlign: z.string().describe("选择框文本对齐"),
  boxLabelOffsetX: z.number().describe("选择框标签X偏移"),
  boxLabelOffsetY: z.number().describe("选择框标签Y偏移"),
  boxBorderColor: z.string().describe("选择框边框颜色"),
  boxBorderWidth: z.number().describe("选择框边框宽度"),
  boxRadius: z.number().describe("选择框圆角"),
  dropDownIcon: z.string().describe("下拉图标"),
  dropDownIconSize: z.number().describe("下拉图标大小"),
  dropDownHeight: z.number().describe("下拉区域高度"),
  contentColor: z.string().describe("内容颜色"),
  topOffset: z.number().describe("顶部偏移"),
  dropDownPosition: z.string().describe("下拉位置"),
  scrollBarWidth: z.number().describe("滚动条宽度"),
  scrollBgColor: z.string().describe("滚动背景颜色"),
  barBgColor: z.string().describe("滚动条背景颜色"),
  optionHeight: z.number().describe("选项高度"),
  optionIndent: z.number().describe("选项缩进"),
  optionSpace: z.number().describe("选项间距"),
  defaultHeight: z.number().describe("默认高度"),
  defaultTextAlign: z.string().describe("默认文本对齐"),
  defaultFontSize: z.number().describe("默认字体大小"),
  defaultLabelOffsetX: z.number().describe("默认标签X偏移"),
  defaultLabelOffsetY: z.number().describe("默认标签Y偏移"),
  defaultFontFamily: z.string().describe("默认字体族"),
  defaultlineHeight: z.number().describe("默认行高"),
  defaultColor: z.string().describe("默认字体颜色"),
  defaultBackgroundType: z.string().describe("默认背景类型"),
  defaultBackground: z.string().describe("默认背景颜色"),
  defaultBackgroundImage: z.string().describe("默认背景图片"),
  defaultLetterSpacing: z.number().describe("默认字间距"),
  defaultFontStyle: z.string().describe("默认字体样式"),
  defaultFontWeight: z.string().describe("默认字体粗细"),
  hoverFontSize: z.number().describe("悬停字体大小"),
  hoverFontFamily: z.string().describe("悬停字体族"),
  hoverlineHeight: z.number().describe("悬停行高"),
  hoverBackgroundType: z.string().describe("悬停背景类型"),
  hoverColor: z.string().describe("悬停字体颜色"),
  hoverBackground: z.string().describe("悬停背景颜色"),
  hoverBackgroundImage: z.string().describe("悬停背景图片"),
  hoverLetterSpacing: z.number().describe("悬停字间距"),
  hoverLabelOffsetX: z.number().describe("悬停标签X偏移"),
  hoverLabelOffsetY: z.number().describe("悬停标签Y偏移"),
  hoverTextAlign: z.string().describe("悬停文本对齐"),
  hoverFontStyle: z.string().describe("悬停字体样式"),
  hoverFontWeight: z.string().describe("悬停字体粗细"),
  dropdownBackgroundColor: z.string().describe("下拉菜单背景颜色"),
  rightMargin: z.number().describe("右边距"),
  hoverHeight: z.number().describe("悬停高度")
});

export type ftCustomSelectOption = z.infer<typeof swCustomSelectOptionSchema>;
