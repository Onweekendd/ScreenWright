import { z } from "zod";

/**
 * 视频 (ftvideo)
 * 媒体
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `cover` - 视频封面
 * - `value` - 视频URL
 *
 * @example
 * ```typescript
 * const data: FtvideoData = [
 *   { cover: "", value: "video.mp4" }
 * ];
 * ```
 */

// Single data item Schema
const ftvideoDataItemSchema = z.object({
  cover: z.string().describe("视频封面"),
  value: z.string().describe("视频地址")
});

// Data array Schema
export const ftvideoDataSchema = z.array(ftvideoDataItemSchema);

export type FtvideoData = z.infer<typeof ftvideoDataSchema>;

// ==================== Option Schema ====================

/**
 * 视频配置选项 Schema
 */
export const ftvideoOptionSchema = z.object({
  // ============ 基础配置 ============
  cover: z.string().describe("视频封面地址"),
  url: z.string().describe("视频地址"),
  delayPlayTime: z.number().describe("延迟播放时间(毫秒)"),
  pointerEvents: z.boolean().describe("是否响应鼠标事件"),
  mixBlendMode: z.string().describe("混合模式(normal/multiply/screen等)"),
  isBuildPlay: z.boolean().describe("是否构建后播放"),
  opacity: z.number().describe("透明度(0-1)"),

  // ============ 播放控制 ============
  controler: z.boolean().describe("是否显示播放控件"),
  autoPlay: z.boolean().describe("是否自动播放"),
  loopPlay: z.boolean().describe("是否循环播放"),
  muted: z.boolean().describe("是否静音"),
  autoHiden: z.boolean().describe("是否自动隐藏控件"),
  playbackRate: z.number().describe("播放速率"),

  // ============ 旋转配置 ============
  rotateShow: z.boolean().describe("旋转效果开关"),
  rotateX: z.number().describe("X轴旋转角度"),
  rotateY: z.number().describe("Y轴旋转角度"),
  rotateZ: z.number().describe("Z轴旋转角度"),

  // ============ 高斯模糊 ============
  gaussianBlurShow: z.boolean().describe("高斯模糊开关"),
  gaussianBlur: z.number().describe("高斯模糊程度"),

  // ============ 亮度 ============
  brightnessShow: z.boolean().describe("亮度调整开关"),
  brightness: z.number().describe("亮度值"),

  // ============ 对比度 ============
  contrastShow: z.boolean().describe("对比度调整开关"),
  contrast: z.number().describe("对比度值"),

  // ============ 灰度 ============
  grayscaleShow: z.boolean().describe("灰度调整开关"),
  grayscale: z.number().describe("灰度值"),

  // ============ 色相 ============
  hueShow: z.boolean().describe("色相调整开关"),
  hue: z.number().describe("色相值"),

  // ============ 反色 ============
  invertShow: z.boolean().describe("反色调整开关"),
  invert: z.number().describe("反色值"),

  // ============ 饱和度 ============
  saturateShow: z.boolean().describe("饱和度调整开关"),
  saturate: z.number().describe("饱和度值"),

  // ============ 褐色 ============
  sepiaShow: z.boolean().describe("褐色调整开关"),
  sepia: z.number().describe("褐色值"),

  // ============ 阴影配置 ============
  shadowShow: z.boolean().describe("阴影开关"),
  shadowColor: z.string().describe("阴影颜色"),
  shadowX: z.number().describe("阴影X偏移"),
  shadowY: z.number().describe("阴影Y偏移"),
  shadowFuzzy: z.number().describe("阴影模糊度"),
  shadowExtension: z.number().describe("阴影扩展"),

  // ============ 背景滤镜 ============
  backdropFilter: z.boolean().describe("背景滤镜开关"),
  backdropFilterBlur: z.number().describe("背景模糊程度"),
  backdropFilterSaturate: z.number().describe("背景饱和度")
});

export type FtvideoOption = z.infer<typeof ftvideoOptionSchema>;
