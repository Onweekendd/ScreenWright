import { z } from "zod";

/**
 * 卡片滚动 (ftcollection)
 * 文字
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `src` - 资源地址（图片/视频URL）
 * - `title` - 卡片标题
 *
 * @example
 * ```typescript
 * const data: FtcollectionData = [
 *   { src: "https://example.com/img1.jpg", title: "标题1" },
 *   { src: "", title: "标题2" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const ftcollectionDataItemSchema = z.object({
  src: z.string().describe("资源地址（图片/视频URL）"),
  title: z.string().describe("卡片标题")
});

// 数据数组 Schema
export const ftcollectionDataSchema = z.array(ftcollectionDataItemSchema);

export type FtcollectionData = z.infer<typeof ftcollectionDataSchema>;

// ==================== Option Schema ====================

/**
 * 卡片滚动配置选项 Schema
 */
export const ftcollectionOptionSchema = z.object({
  // ============ 滚动配置 ============
  type: z.string().describe("类型标识"),
  scroll: z.boolean().describe("是否滚动"),
  scrollBar: z.boolean().describe("是否显示滚动条"),
  speed: z.number().describe("滚动速度"),
  speedPosition: z.string().describe("滚动方向(ToLeft/ToRight/ToTop/ToBottom)"),

  // ============ 容器背景配置 ============
  padding: z.array(z.number()).describe("容器内边距[上,右,下,左]"),
  backgroundType: z.string().describe("背景类型(color/image)"),
  background: z.string().describe("背景颜色"),
  backgroundImage: z.string().describe("背景图片"),

  // ============ 卡片配置 ============
  cardLen: z.number().describe("可见卡片数量"),
  cardMarginRight: z.number().describe("卡片右边距(px)"),
  cardBackgroundType: z.string().describe("卡片背景类型(color/image)"),
  cardBackgroundColor: z.string().describe("卡片背景颜色"),
  cardBackgroundImage: z.string().describe("卡片背景图片"),
  cardPadding: z.array(z.number()).describe("卡片内边距[上,右,下,左]"),
  cardObjectFit: z.string().describe("卡片图片适配(contain/cover/fill)"),
  cardBgObjectFit: z.string().describe("卡片背景图适配"),

  // ============ 媒体播放配置 ============
  controls: z.boolean().describe("是否显示播放控件"),
  loopPlay: z.boolean().describe("是否循环播放"),
  autoPlay: z.boolean().describe("是否自动播放"),
  muted: z.boolean().describe("是否静音"),

  // ============ 标题文字配置 ============
  fontFamily: z.string().describe("字体"),
  fontSize: z.number().describe("字号"),
  color: z.string().describe("字体颜色"),
  fontWeight: z.string().describe("字重"),
  fontStyle: z.string().describe("字体样式"),
  spacing: z.number().describe("字间距"),

  // ============ 标题区域配置 ============
  titleWidth: z.number().describe("标题区域宽度(px)"),
  titleHeight: z.number().describe("标题区域高度(px)"),
  textTranslateX: z.number().describe("文字X偏移"),
  textTranslateY: z.number().describe("文字Y偏移"),
  titleBackgroundType: z.string().describe("标题背景类型"),
  titleBackgroundColor: z.string().describe("标题背景颜色"),
  titleBackgroundImage: z.string().describe("标题背景图片")
});

export type FtcollectionOption = z.infer<typeof ftcollectionOptionSchema>;
