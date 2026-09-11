import { z } from "zod";

/**
 * 搜索框组件 (ft-search)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `value` - 搜索值
 *
 * @example
 * ```typescript
 * const data: ftSearchData = [
 *   { value: "" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swSearchDataItemSchema = z.object({
  value: z.string().describe("搜索值")
});

export const swSearchDataSchema = z.array(swSearchDataItemSchema);
export type ftSearchData = z.infer<typeof swSearchDataSchema>;

/**
 * 搜索框配置选项 Schema
 */
export const swSearchOptionSchema = z.object({
  isFont: z.boolean().describe("是否自定义字体"),
  textIndent: z.number().describe("文本缩进"),
  fontSize: z.number().describe("输入框字体大小"),
  fontWeight: z.string().describe("输入框字体粗细"),
  fontStyle: z.string().describe("输入框字体样式"),
  fontFamily: z.string().describe("输入框字体族"),
  fontColor: z.string().describe("输入框字体颜色"),
  fontSizeTip: z.number().describe("提示文字字体大小"),
  fontWeightTip: z.string().describe("提示文字字体粗细"),
  fontStyleTip: z.string().describe("提示文字字体样式"),
  fontFamilyTip: z.string().describe("提示文字字体族"),
  fontColorTip: z.string().describe("提示文字字体颜色"),
  placeholder: z.string().describe("占位文本"),
  isBorder: z.boolean().describe("是否显示边框"),
  borderWidth: z.number().describe("边框宽度"),
  borderColor: z.string().describe("边框颜色"),
  borderRadius: z.number().describe("边框圆角"),
  isBackground: z.boolean().describe("是否显示背景"),
  backgroundColor: z.string().describe("背景颜色"),
  backgroundImage: z.string().describe("背景图片"),
  backgroundImageType: z.string().describe("背景图片类型"),
  backgroundType: z.string().describe("背景类型"),
  isButton: z.boolean().describe("是否显示搜索按钮"),
  buttonPosition: z.string().describe("按钮位置"),
  buttonIconSize: z.number().describe("按钮图标大小"),
  buttonIconColor: z.string().describe("按钮图标颜色"),
  buttonWidth: z.number().describe("按钮宽度"),
  backgroundColorBtn: z.string().describe("按钮背景颜色"),
  backgroundImageBtn: z.string().describe("按钮背景图片"),
  backgroundImageTypeBtn: z.string().describe("按钮背景图片类型"),
  backgroundTypeBtn: z.string().describe("按钮背景类型"),
  buttonIconType: z.string().describe("按钮图标类型"),
  buttonIcon: z.string().nullable().describe("按钮自定义图标"),
  buttonIconWidth: z.number().describe("按钮图标宽度"),
  buttonIconHeight: z.number().describe("按钮图标高度")
});

export type ftSearchOption = z.infer<typeof swSearchOptionSchema>;
