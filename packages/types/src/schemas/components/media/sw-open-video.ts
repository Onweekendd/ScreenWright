import { z } from "zod";

/**
 * 开场视频 (ft-open-video)
 * 媒体
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `cover` - 视频封面
 * - `value` - 视频地址
 *
 * @example
 * ```typescript
 * const data: FtOpenVideoData = [
 *   { cover: "version-test/assets/cover.png", value: "version-test/assets/video.mp4" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swOpenVideoDataItemSchema = z.object({
  cover: z.string().describe("视频封面"),
  value: z.string().describe("视频地址")
});

// 数据数组 Schema
export const swOpenVideoDataSchema = z.array(swOpenVideoDataItemSchema);

export type FtOpenVideoData = z.infer<typeof swOpenVideoDataSchema>;

// 按钮文字阴影配置
const swOpenVideoButtonTextShadowSchema = z.object({
  x: z.number().describe("阴影X偏移"),
  y: z.number().describe("阴影Y偏移"),
  blur: z.number().describe("阴影模糊度"),
  color: z.string().describe("阴影颜色"),
  extend: z.number().describe("阴影扩展")
});

/**
 * 开场视频配置选项 Schema
 */
export const swOpenVideoOptionSchema = z.object({
  // ============ 基础视频配置 ============
  cover: z.string().describe("视频封面路径"),
  url: z.string().describe("视频地址"),
  openDelayLoading: z.boolean().describe("是否开启延迟加载"),
  delayLoadingTime: z.number().describe("延迟加载时间（秒）"),
  delayPlayTime: z.number().describe("延迟播放时间"),
  pointerEvents: z.boolean().describe("是否启用指针事件"),
  mixBlendMode: z.string().describe("混合模式"),
  controler: z.boolean().describe("是否显示控制器"),
  isBuildPlay: z.boolean().describe("是否构建播放"),
  autoPlay: z.boolean().describe("是否自动播放"),
  loopPlay: z.boolean().describe("是否循环播放"),
  muted: z.boolean().describe("是否静音"),
  autoHidden: z.boolean().describe("是否自动隐藏"),

  // ============ 旋转配置 ============
  rotateShow: z.boolean().describe("是否启用旋转"),
  rotateX: z.number().describe("X轴旋转角度"),
  rotateY: z.number().describe("Y轴旋转角度"),
  rotateZ: z.number().describe("Z轴旋转角度"),

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

  // ============ 按钮配置 ============
  buttonType: z.string().describe("按钮类型"),
  buttonContent: z.string().describe("按钮文字内容"),
  buttonWidth: z.number().describe("按钮宽度"),
  buttonHeight: z.number().describe("按钮高度"),
  buttonTranslateX: z.number().describe("按钮X偏移"),
  buttonTranslateY: z.number().describe("按钮Y偏移"),
  buttonImageType: z.string().describe("按钮背景图适配方式"),
  buttonImage: z.string().describe("按钮背景图片路径"),
  buttonIconType: z.string().describe("按钮图标适配方式"),
  buttonIcon: z.string().describe("按钮图标路径"),
  buttonIconWidth: z.number().describe("按钮图标宽度"),
  buttonIconHeight: z.number().describe("按钮图标高度"),
  buttonFontSize: z.number().describe("按钮字号"),
  buttonFontWeight: z.boolean().describe("按钮文字是否加粗"),
  buttonFontStyle: z.boolean().describe("按钮文字是否斜体"),
  buttonFontFamily: z.string().describe("按钮字体"),
  buttonFontColor: z.string().describe("按钮文字颜色"),
  buttonLetterSpacing: z.number().describe("按钮文字字间距"),
  buttonTextTranslateX: z.number().describe("按钮文字X偏移"),
  buttonTextTranslateY: z.number().describe("按钮文字Y偏移"),
  isButtonTextShadow: z.boolean().describe("是否启用按钮文字阴影"),
  buttonTextShadow: swOpenVideoButtonTextShadowSchema.describe("按钮文字阴影配置")
});

export type FtOpenVideoOption = z.infer<typeof swOpenVideoOptionSchema>;
