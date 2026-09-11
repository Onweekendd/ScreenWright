import { z } from "zod";

/**
 * 多级下拉框 (ftCascader)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `value` - 值
 * - `label` - 标签
 * - `disabled` - 是否禁用
 * - `children` - 子级选项（递归嵌套）
 *
 * @example
 * ```typescript
 * const data: ftCascaderData = [
 *   { value: "zhinan", label: "指南", disabled: false, children: [...] }
 * ];
 * ```
 */

// 递归定义多级选项
export interface CascaderItem {
  value: string;
  label: string;
  disabled?: boolean;
  children?: CascaderItem[];
}

const swCascaderDataItemSchema: z.ZodType<CascaderItem> = z.lazy(() =>
  z.object({
    value: z.string().describe("选项值"),
    label: z.string().describe("选项标签"),
    disabled: z.boolean().optional().describe("是否禁用"),
    children: z.array(swCascaderDataItemSchema).optional().describe("子级选项")
  })
);

export const swCascaderDataSchema = z.array(swCascaderDataItemSchema);
export type ftCascaderData = z.infer<typeof swCascaderDataSchema>;

/**
 * 多级下拉框配置选项 Schema
 */
export const swCascaderOptionSchema = z.object({
  defaultIndex: z.number().describe("默认选中索引"),
  placeholder: z.string().describe("占位文本"),
  textAlign: z.string().describe("文本对齐方式"),
  color: z.string().describe("字体颜色"),
  fontFamily: z.string().describe("字体族"),
  fontSize: z.number().describe("字体大小"),
  fontWeight: z.string().describe("字体粗细"),
  fontStyle: z.string().describe("字体样式"),
  lineHeight: z.number().describe("行高"),
  letterSpacing: z.number().describe("字间距"),
  backgroundType: z.string().describe("背景类型"),
  backgroundImage: z.string().describe("背景图片"),
  backgroundColor: z.string().describe("背景颜色"),
  borderColor: z.string().describe("边框颜色"),
  borderWidth: z.number().describe("边框宽度"),
  borderRadius: z.number().describe("边框圆角"),
  dropDownIcon: z.string().describe("下拉图标"),
  dropDownIconSize: z.number().describe("下拉图标大小"),
  dropdownBackgroundColor: z.string().describe("下拉菜单背景颜色"),
  dropdownMaxHeight: z.number().describe("下拉菜单最大高度"),
  dropdownMarginTop: z.number().describe("下拉菜单上边距"),
  scrollBarWidth: z.number().describe("滚动条宽度"),
  scrollBackgroundColor: z.string().describe("滚动背景颜色"),
  scrollBarColor: z.string().describe("滚动条颜色"),
  menuHeight: z.number().describe("菜单项高度"),
  menuMarginLeft: z.number().describe("菜单项左边距"),
  menuMarginTop: z.number().describe("菜单项上边距"),
  menuDefaultFontFamily: z.string().describe("菜单默认字体族"),
  menuDefaultFontSize: z.number().describe("菜单默认字体大小"),
  menuDefaultColor: z.string().describe("菜单默认字体颜色"),
  menuDefaultFontStyle: z.string().describe("菜单默认字体样式"),
  menuDefaultFontWeight: z.string().describe("菜单默认字体粗细"),
  menuDefaultLetterSpacing: z.number().describe("菜单默认字间距"),
  menuDefaultLineHeight: z.number().describe("菜单默认行高"),
  menuDefaultBackgroundType: z.string().describe("菜单默认背景类型"),
  menuDefaultBackgroundColor: z.string().describe("菜单默认背景颜色"),
  menuDefaultBackgroundImage: z.string().describe("菜单默认背景图片"),
  menuHoverFontFamily: z.string().describe("菜单悬停字体族"),
  menuHoverFontSize: z.number().describe("菜单悬停字体大小"),
  menuHoverColor: z.string().describe("菜单悬停字体颜色"),
  menuHoverFontStyle: z.string().describe("菜单悬停字体样式"),
  menuHoverFontWeight: z.string().describe("菜单悬停字体粗细"),
  menuHoverLetterSpacing: z.number().describe("菜单悬停字间距"),
  menuHoverLineHeight: z.number().describe("菜单悬停行高"),
  menuHoverBackgroundType: z.string().describe("菜单悬停背景类型"),
  menuHoverBackgroundColor: z.string().describe("菜单悬停背景颜色"),
  menuHoverBackgroundImage: z.string().describe("菜单悬停背景图片")
});

export type ftCascaderOption = z.infer<typeof swCascaderOptionSchema>;
