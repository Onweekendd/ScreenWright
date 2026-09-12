import { z } from "zod";

/**
 * 视频面板 (ctVideoPanel)
 * 媒体
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `name` - 视频标签
 * - `url` - 视频地址
 *
 * @example
 * ```typescript
 * const data: CtVideoPanelData = [
 *   { name: "video1", url: "version-test/assets/defaultImg/video.mp4" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const ctVideoPanelDataItemSchema = z.object({
  name: z.string().describe("视频标签"),
  url: z.string().describe("视频地址")
});

// 数据数组 Schema
export const ctVideoPanelDataSchema = z.array(ctVideoPanelDataItemSchema);

export type CtVideoPanelData = z.infer<typeof ctVideoPanelDataSchema>;

// 文字阴影配置
const ctVideoPanelTextShadowSchema = z.object({
  x: z.number().describe("阴影X偏移"),
  y: z.number().describe("阴影Y偏移"),
  blur: z.number().describe("阴影模糊度"),
  color: z.string().describe("阴影颜色"),
  extend: z.number().describe("阴影扩展")
});

/**
 * 视频面板配置选项 Schema
 */
export const ctVideoPanelOptionSchema = z.object({
  // ============ 基础视频配置 ============
  mixBlendMode: z.string().describe("混合模式"),
  controler: z.boolean().describe("是否显示控制器"),
  autoPlay: z.boolean().describe("是否自动播放"),
  loopPlay: z.boolean().describe("是否循环播放"),
  muted: z.boolean().describe("是否静音"),
  autoHidden: z.boolean().describe("是否自动隐藏"),

  // ============ 滤镜配置 ============
  gaussianBlurShow: z.boolean().describe("是否启用高斯模糊"),
  gaussianBlur: z.number().describe("高斯模糊值"),
  brightnessShow: z.boolean().describe("是否启用亮度调节"),
  brightness: z.number().describe("亮度值"),
  contrastShow: z.boolean().describe("是否启用对比度调节"),
  contrast: z.number().describe("对比度值"),
  grayscaleShow: z.boolean().describe("是否启用灰度"),
  grayscale: z.number().describe("灰度值"),
  hueShow: z.boolean().describe("是否启用色调调节"),
  hue: z.number().describe("色调值"),
  invertShow: z.boolean().describe("是否启用反色"),
  invert: z.number().describe("反色值"),
  saturateShow: z.boolean().describe("是否启用饱和度调节"),
  saturate: z.number().describe("饱和度值"),
  sepiaShow: z.boolean().describe("是否启用褐色调节"),
  sepia: z.number().describe("褐色值"),

  // ============ 阴影配置 ============
  shadowShow: z.boolean().describe("是否显示阴影"),
  shadowColor: z.string().describe("阴影颜色"),
  shadowX: z.number().describe("阴影X偏移"),
  shadowY: z.number().describe("阴影Y偏移"),
  shadowFuzzy: z.number().describe("阴影模糊度"),
  shadowExtension: z.number().describe("阴影扩展"),

  // ============ 视频图标配置 ============
  showVideoBg: z.boolean().describe("是否显示视频背景"),
  showVideoIcon: z.boolean().describe("是否显示视频图标"),
  videoBg: z.string().describe("视频背景图路径"),
  videoIcon: z.string().describe("视频图标路径"),

  // ============ 网格布局配置 ============
  rows: z.number().describe("行数"),
  columns: z.number().describe("列数"),
  rowGap: z.number().describe("行间距"),
  columnGap: z.number().describe("列间距"),

  // ============ 分页配置 ============
  showPage: z.boolean().describe("是否显示分页"),
  pageIcon: z.string().describe("分页图标路径"),
  pagerTime: z.number().describe("分页切换时间（秒）"),
  autoPager: z.boolean().describe("是否自动翻页"),
  pagerAni: z.string().describe("翻页动画类型"),

  // ============ 视频项文字配置 ============
  textTranslateX: z.number().describe("文字X偏移"),
  textTranslateY: z.number().describe("文字Y偏移"),
  backgroundColor: z.string().describe("背景颜色"),
  backgroundImage: z.string().describe("背景图片路径"),
  backgroundImageType: z.string().describe("背景图片适配方式"),
  backgroundType: z.string().describe("背景类型"),
  titleBgType: z.string().describe("标题背景类型"),
  titleBgColor: z.string().describe("标题背景颜色"),
  titleBgImage: z.string().describe("标题背景图片路径"),
  titleBgImageType: z.string().describe("标题背景图片适配方式"),
  fontSize: z.number().describe("字号"),
  fontWeight: z.boolean().describe("是否加粗"),
  fontStyle: z.boolean().describe("是否斜体"),
  fontFamily: z.string().describe("字体"),
  fontColor: z.string().describe("文字颜色"),
  isTextShadow: z.boolean().describe("是否显示文字阴影"),
  textShadow: ctVideoPanelTextShadowSchema.describe("文字阴影配置"),
  textPosition: z.string().describe("文字位置"),
  textAlign: z.string().describe("文字对齐"),
  iconWidth: z.number().describe("图标宽度"),
  iconHeight: z.number().describe("图标高度"),
  padding: z.array(z.number()).describe("内边距 [上, 右, 下, 左]"),

  // ============ 视频适配配置 ============
  objectFit: z.string().describe("视频适配方式"),
  borderBgImage: z.string().describe("边框背景图路径"),
  borderBgSize: z.string().describe("边框背景图大小"),
  videoBoxWidth: z.number().describe("视频框宽度（百分比）"),
  videoBoxHeight: z.number().describe("视频框高度（百分比）"),

  // ============ 分页器样式配置 ============
  pagerIconWidth: z.number().describe("分页图标宽度"),
  pagerIconHeight: z.number().describe("分页图标高度"),
  pagerHeight: z.number().describe("分页器高度"),
  pagerfontSize: z.number().describe("分页器字号"),
  pagerfontWeight: z.boolean().describe("分页器文字是否加粗"),
  pagerfontStyle: z.boolean().describe("分页器文字是否斜体"),
  pagerfontFamily: z.string().describe("分页器字体"),
  pagerfontColor: z.string().describe("分页器文字颜色"),
  pagerletterSpacing: z.number().describe("分页器字间距"),
  pagerfontSize2: z.number().describe("分页器选中项字号"),
  pagerfontWeight2: z.boolean().describe("分页器选中项是否加粗"),
  pagerfontStyle2: z.boolean().describe("分页器选中项是否斜体"),
  pagerfontFamily2: z.string().describe("分页器选中项字体"),
  pagerfontColor2: z.string().describe("分页器选中项颜色"),
  pagerletterSpacing2: z.number().describe("分页器选中项字间距")
});

export type CtVideoPanelOption = z.infer<typeof ctVideoPanelOptionSchema>;
