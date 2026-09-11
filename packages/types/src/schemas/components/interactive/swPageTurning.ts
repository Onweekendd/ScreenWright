import { z } from "zod";

/**
 * 翻页 (ftPageTurning)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `pageIndex` - 当前页码
 * - `pageTotal` - 总页数
 * - `textPage` - 文本数据集（分页内容数组）
 *
 * @example
 * ```typescript
 * const data: ftPageTurningData = [
 *   { pageIndex: 1, pageTotal: 2, textPage: ["分页一", "分页二"] }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swPageTurningDataItemSchema = z.object({
  pageIndex: z.number().describe("当前页码"),
  pageTotal: z.number().describe("总页数"),
  textPage: z.array(z.string()).optional().describe("文本数据集")
});

export const swPageTurningDataSchema = z.array(swPageTurningDataItemSchema);
export type ftPageTurningData = z.infer<typeof swPageTurningDataSchema>;

/**
 * 翻页配置选项 Schema
 */
export const swPageTurningOptionSchema = z.object({
  isText: z.boolean().describe("是否显示文本"),
  isLoop: z.boolean().describe("是否循环翻页"),
  isPlay: z.boolean().describe("是否自动播放"),
  intervalTime: z.number().describe("自动播放间隔（秒）"),
  fontFamily: z.string().describe("字体族"),
  fontSize: z.number().describe("字体大小"),
  color: z.string().describe("字体颜色"),
  fontWeight: z.string().describe("字体粗细"),
  fontStyle: z.string().describe("字体样式"),
  fontFamilyTotal: z.string().describe("总页数字体族"),
  fontSizeTotal: z.number().describe("总页数字体大小"),
  colorTotal: z.string().describe("总页数字体颜色"),
  fontWeightTotal: z.string().describe("总页数字体粗细"),
  fontStyleTotal: z.string().describe("总页数字体样式"),
  fontFamilyLine: z.string().describe("分隔线字体族"),
  fontSizeLine: z.number().describe("分隔线字体大小"),
  colorLine: z.string().describe("分隔线字体颜色"),
  fontWeightLine: z.string().describe("分隔线字体粗细"),
  fontStyleLine: z.string().describe("分隔线字体样式"),
  shadowShow: z.boolean().describe("是否显示阴影"),
  shadowColor: z.string().describe("阴影颜色"),
  shadowX: z.number().describe("阴影X偏移"),
  shadowY: z.number().describe("阴影Y偏移"),
  shadowFuzzy: z.number().describe("阴影模糊"),
  shadowExtension: z.number().describe("阴影扩展"),
  letterSpacing: z.number().describe("字间距"),
  split: z.number().describe("分隔距离"),
  backgroundImage: z.string().describe("翻页按钮背景图片"),
  buttonWidth: z.number().describe("翻页按钮宽度"),
  buttonHeight: z.number().describe("翻页按钮高度")
});

export type ftPageTurningOption = z.infer<typeof swPageTurningOptionSchema>;
