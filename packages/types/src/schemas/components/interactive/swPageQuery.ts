import { z } from "zod";

/**
 * 分页 (ftPageQuery)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `pageIndex` - 当前页码
 * - `pageTotal` - 总条数
 * - `pageSize` - 每页条数
 *
 * @example
 * ```typescript
 * const data: ftPageQueryData = [
 *   { pageIndex: 1, pageTotal: 1000, pageSize: 10 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swPageQueryDataItemSchema = z.object({
  pageIndex: z.number().describe("当前页码"),
  pageTotal: z.number().describe("总条数"),
  pageSize: z.number().describe("每页条数")
});

export const swPageQueryDataSchema = z.array(swPageQueryDataItemSchema);
export type ftPageQueryData = z.infer<typeof swPageQueryDataSchema>;

/**
 * 分页配置选项 Schema
 */
export const swPageQueryOptionSchema = z.object({
  showJumper: z.boolean().describe("是否显示跳转"),
  pageSize: z.number().describe("每页条数"),
  textAlign: z.string().describe("文本对齐"),
  boxWidth: z.number().describe("分页按钮宽度"),
  boxHeight: z.number().describe("分页按钮高度"),
  borderRadius: z.number().describe("圆角"),
  margin: z.number().describe("间距"),
  defaultFontFamily: z.string().describe("默认字体族"),
  defaultFontSize: z.number().describe("默认字体大小"),
  defaultColor: z.string().describe("默认字体颜色"),
  defaultFontStyle: z.string().describe("默认字体样式"),
  defaultFontWeight: z.string().describe("默认字体粗细"),
  defaultLetterSpacing: z.number().describe("默认字间距"),
  defaultLineHeight: z.number().describe("默认行高"),
  defaultBackgroundType: z.string().describe("默认背景类型"),
  defaultBackgroundColor: z.string().describe("默认背景颜色"),
  defaultBackgroundColorOpacity: z.number().describe("默认背景颜色透明度"),
  defaultBackgroundImageType: z.string().describe("默认背景图片类型"),
  defaultBackgroundImage: z.string().describe("默认背景图片"),
  defaultBorderWidth: z.number().describe("默认边框宽度"),
  defaultBorderColor: z.string().describe("默认边框颜色"),
  hoverFontFamily: z.string().describe("悬停字体族"),
  hoverFontSize: z.number().describe("悬停字体大小"),
  hoverColor: z.string().describe("悬停字体颜色"),
  hoverFontStyle: z.string().describe("悬停字体样式"),
  hoverFontWeight: z.string().describe("悬停字体粗细"),
  hoverLetterSpacing: z.number().describe("悬停字间距"),
  hoverLineHeight: z.number().describe("悬停行高"),
  hoverBackgroundType: z.string().describe("悬停背景类型"),
  hoverBackgroundColor: z.string().describe("悬停背景颜色"),
  hoverBackgroundColorOpacity: z.number().describe("悬停背景颜色透明度"),
  hoverBackgroundImageType: z.string().describe("悬停背景图片类型"),
  hoverBackgroundImage: z.string().describe("悬停背景图片"),
  hoverBorderWidth: z.number().describe("悬停边框宽度"),
  hoverBorderColor: z.string().describe("悬停边框颜色"),
  checkedFontFamily: z.string().describe("选中字体族"),
  checkedFontSize: z.number().describe("选中字体大小"),
  checkedColor: z.string().describe("选中字体颜色"),
  checkedFontStyle: z.string().describe("选中字体样式"),
  checkedFontWeight: z.string().describe("选中字体粗细"),
  checkedLetterSpacing: z.number().describe("选中字间距"),
  checkedLineHeight: z.number().describe("选中行高"),
  checkedBackgroundType: z.string().describe("选中背景类型"),
  checkedBackgroundColor: z.string().describe("选中背景颜色"),
  checkedBackgroundColorOpacity: z.number().describe("选中背景颜色透明度"),
  checkedBackgroundImageType: z.string().describe("选中背景图片类型"),
  checkedBackgroundImage: z.string().describe("选中背景图片"),
  checkedBorderWidth: z.number().describe("选中边框宽度"),
  checkedBorderColor: z.string().describe("选中边框颜色")
});

export type ftPageQueryOption = z.infer<typeof swPageQueryOptionSchema>;
