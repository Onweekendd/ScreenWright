import { z } from "zod";

import type { Prohibition, ScreenFilterInfo, TerminalEnableArr, WaterMark } from "../types/large-screen";

// ============================================
// Screen Schemas
// ============================================

/** 屏幕滤镜信息 Schema */
export const ScreenFilterInfoSchema: z.ZodSchema<ScreenFilterInfo> = z.object({
  /** 高斯模糊：模糊效果的程度，值越大越模糊 */
  gaussianBlur: z.number().describe("高斯模糊：模糊效果的程度，值越大越模糊"),
  /** 亮度：屏幕亮度调节，1为正常，小于1变暗，大于1变亮 */
  brightness: z.number().describe("亮度：屏幕亮度调节，1为正常，小于1变暗，大于1变亮"),
  /** 对比度：对比度调节，1为正常，小于1降低对比度，大于1增加对比度 */
  contrast: z.number().describe("对比度：对比度调节，1为正常，小于1降低对比度，大于1增加对比度"),
  /** 灰度：灰度效果，0为彩色，1为完全灰度 */
  grayscale: z.number().describe("灰度：灰度效果，0为彩色，1为完全灰度"),
  /** 色调：色相旋转角度，0-360度 */
  hue: z.number().describe("色调：色相旋转角度，0-360度"),
  /** 饱和度：饱和度调节，0为完全去色，1为正常 */
  saturate: z.number().describe("饱和度：饱和度调节，0为完全去色，1为正常"),
  /** 反转：颜色反转，0为正常，1为完全反转 */
  invert: z.number().describe("反转：颜色反转，0为正常，1为完全反转"),
  /** 棕褐色：棕褐色滤镜效果，0为正常，1为最大效果 */
  sepia: z.number().describe("棕褐色：棕褐色滤镜效果，0为正常，1为最大效果"),
  /** 色相旋转：色相旋转角度，单位为度 */
  hueRotate: z.number().describe("色相旋转：色相旋转角度，单位为度").optional()
});

/** 水印信息 Schema */
export const WaterMarkSchema: z.ZodSchema<WaterMark> = z.object({
  /** 水印文本内容 */
  text: z.string().describe("水印文本内容"),
  /** 字体族：如 'Arial', 'Microsoft YaHei' 等 */
  fontFamily: z.string().describe("字体族：如 'Arial', 'Microsoft YaHei' 等"),
  /** 字体样式：如 'normal', 'italic', 'oblique' */
  fontStyle: z.string().describe("字体样式：如 'normal', 'italic', 'oblique'"),
  /** 字体粗细：如 'normal', 'bold', '100-900' */
  fontWeight: z.string().describe("字体粗细：如 'normal', 'bold', '100-900'"),
  /** 字体大小：像素值 */
  fontSize: z.number().describe("字体大小：像素值"),
  /** 文字颜色：CSS颜色值，如 '#FFFFFF', 'rgba(255,255,255,0.5)' */
  color: z.string().describe("文字颜色：CSS颜色值，如 '#FFFFFF', 'rgba(255,255,255,0.5)'"),
  /** 旋转角度：水印旋转的角度，单位为度 */
  degree: z.number().describe("旋转角度：水印旋转的角度，单位为度").optional()
});

/** 终端启用数组 Schema */
export const TerminalEnableArrSchema: z.ZodSchema<TerminalEnableArr> = z.record(
  z.string().describe("终端ID"),
  z.string().describe("终端名称")
);

/** 禁止配置 Schema */
export const ProhibitionSchema: z.ZodSchema<Prohibition> = z.object({
  /** 是否隐藏图层：控制图层是否隐藏 */
  ihl: z.boolean().describe("是否隐藏图层：控制图层是否隐藏"),
  /** 过期日期：配置过期的时间，格式 'YYYY-MM-DD HH:mm:ss' */
  ed: z.string().describe("过期日期：配置过期的时间，格式 'YYYY-MM-DD HH:mm:ss'"),
  /** 是否启用水印：控制水印是否显示 */
  iwm: z.boolean().describe("是否启用水印：控制水印是否显示")
});
