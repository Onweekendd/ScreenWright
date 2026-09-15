import { z } from "zod";

/**
 * 图片 (swimg)
 * 媒体
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 图片地址
 *
 * @example
 * ```typescript
 * const data: SwimgData = [
 *   { value: "image.png" }
 * ];
 * ```
 */

// Single data item Schema
const swimgDataItemSchema = z.object({
  value: z.string().describe("图片地址")
});

// Data array Schema
export const swimgDataSchema = z.array(swimgDataItemSchema);

export type SwimgData = z.infer<typeof swimgDataSchema>;

// ==================== Option Schema ====================

/**
 * 图片配置选项 Schema
 */
export const swimgOptionSchema = z.object({
  // ============ 基础配置 ============
  cover: z.string().describe("图片封面地址"),
  url: z.string().describe("图片地址"),
  duration: z.string().describe("过渡动画时长(毫秒)"),
  pointerEvents: z.boolean().describe("是否响应鼠标事件"),
  opacity: z.number().describe("透明度(0-1)"),
  mixBlendMode: z.string().describe("混合模式(normal/multiply/screen等)"),

  // ============ 旋转配置 ============
  rotateShow: z.boolean().describe("旋转效果开关"),
  rotateX: z.number().describe("X轴旋转角度"),
  rotateY: z.number().describe("Y轴旋转角度"),
  rotateZ: z.number().describe("Z轴旋转角度"),

  // ============ 动画配置 ============
  animationShow: z.boolean().describe("动画开关"),
  animationLoop: z.boolean().describe("是否循环动画"),
  animationSpeed: z.enum(["constant", "slow-fast-slow", "start-slow", "end-slow"]).describe("动画速度模式"),
  animationSpeedNum: z.number().describe("动画速度数值"),
  animationTime: z.number().describe("动画时长(秒)"),
  animationDelayed: z.number().describe("动画延迟(秒)"),
  animationInterval: z.number().describe("动画间隔(秒)"),
  animationType: z.enum(["default", "opacity", "zoom", "clockwise", "counterclockwise", "backAndForth", "upOrDown", "customize"]).describe("动画类型"),

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

  // ============ 图片预览 ============
  openReview: z.boolean().describe("是否开启图片预览"),
  reviewImageWidth: z.number().describe("预览图片宽度"),

  // ============ 背景滤镜 ============
  backdropFilter: z.boolean().describe("背景滤镜开关"),
  backdropFilterBlur: z.number().describe("背景模糊程度"),
  backdropFilterSaturate: z.number().describe("背景饱和度")
});

export type SwimgOption = z.infer<typeof swimgOptionSchema>;
