import { z } from "zod";

/**
 * 折叠面板 (customCollapse)
 * 文字
 *
 * ## 数据结构
 *
 * 数据由 option.seriesTabsList 定义面板内容。
 * 动态数据接口（如使用数据源）:
 * - `title` - 标题
 * - `value` - 数值
 * - `type` - 类型
 */

// 阴影配置 Schema
const shadowConfigSchema = z.object({
  color: z.string().describe("阴影颜色"),
  x: z.number().describe("阴影X偏移"),
  y: z.number().describe("阴影Y偏移"),
  blur: z.number().describe("阴影模糊度"),
  extend: z.number().describe("阴影扩展")
});

// 面板系列项 Schema
const customCollapseSeriesItemSchema = z.object({
  name: z.string().describe("系列名称"),
  type: z.enum(["image", "video", "text"]).describe("内容类型"),
  value: z.string().describe("内容值(图片URL/视频URL/文本内容)"),
  imageSize: z.string().describe("图片适配模式(cover/contain/fill)"),
  title: z.string().describe("面板标题")
});

// 动态数据项 Schema
const customCollapseDataItemSchema = z.record(z.string(), z.union([z.string(), z.number()]));

// 数据数组 Schema
export const customCollapseDataSchema = z.array(customCollapseDataItemSchema);

export type CustomCollapseData = z.infer<typeof customCollapseDataSchema>;

// ==================== Option Schema ====================

/**
 * 折叠面板配置选项 Schema
 */
export const customCollapseOptionSchema = z.object({
  // ============ 折叠模式配置 ============
  type: z.string().describe("折叠类型(accordion手风琴模式)"),
  accordionKeys: z.string().describe("默认展开的面板key(逗号分隔)"),

  // ============ 标题区域尺寸 ============
  titleHeight: z.number().describe("标题区域高度(px)"),
  contentHeight: z.number().describe("内容区域高度(px)"),

  // ============ 容器配置 ============
  paddingTop: z.number().describe("容器上内边距"),
  paddingLeft: z.number().describe("容器左内边距"),
  backgroudSize: z.string().describe("容器背景尺寸"),
  backgroudImage: z.string().describe("容器背景图片"),

  // ============ 标题样式配置 ============
  titleBgSize: z.string().describe("标题背景尺寸"),
  titleBgImage: z.string().describe("标题背景图片"),
  fontColor: z.string().describe("标题字体颜色"),
  fontSize: z.number().describe("标题字号"),
  letterSpacing: z.number().describe("标题字间距"),
  fontWeight: z.boolean().describe("标题是否加粗"),
  fontFamily: z.string().describe("标题字体"),
  fontStyle: z.boolean().describe("标题是否斜体"),
  textAlign: z.string().describe("标题文字对齐(left/center/right)"),
  textTranslateX: z.number().describe("标题文字X偏移"),
  textTranslateY: z.number().describe("标题文字Y偏移"),

  // ============ 标题阴影配置 ============
  isTextShadow: z.boolean().describe("标题文字阴影开关"),
  textShadow: shadowConfigSchema.describe("标题文字阴影配置"),

  // ============ 内容图片配置 ============
  imageWidth: z.number().describe("内容图片宽度(px)"),
  imageHeight: z.number().describe("内容图片高度(px)"),
  translateX: z.number().describe("图片X偏移"),
  translateY: z.number().describe("图片Y偏移"),
  radiusTop: z.number().describe("圆角上"),
  radiusRight: z.number().describe("圆角右"),
  radiusBottom: z.number().describe("圆角下"),
  radiusLeft: z.number().describe("圆角左"),

  // ============ 内容区域配置 ============
  contentBgSize: z.string().describe("内容背景尺寸"),
  contentBgImage: z.string().describe("内容背景图片"),
  paddingTop2: z.number().describe("内容上内边距"),
  paddingLeft2: z.number().describe("内容左内边距"),

  // ============ 内容文字配置 ============
  fontColor2: z.string().describe("内容字体颜色"),
  fontSize2: z.number().describe("内容字号"),
  letterSpacing2: z.number().describe("内容字间距"),
  fontWeight2: z.boolean().describe("内容是否加粗"),
  fontFamily2: z.string().describe("内容字体"),
  fontStyle2: z.boolean().describe("内容是否斜体"),
  lineHeight2: z.number().describe("内容行高"),

  // ============ 内容阴影配置 ============
  isTextShadow2: z.boolean().describe("内容文字阴影开关"),
  textShadow2: shadowConfigSchema.describe("内容文字阴影配置"),

  // ============ 面板系列列表 ============
  seriesTabsList: z.array(customCollapseSeriesItemSchema).describe("面板系列列表")
});

export type CustomCollapseOption = z.infer<typeof customCollapseOptionSchema>;
