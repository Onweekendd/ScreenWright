import { z } from "zod";

/**
 * 线性渐变遮罩层 (ft-mask-layer)
 * 扩展
 *
 * ## 数据结构
 * 数据字段:
 * - `text` - 文本内容
 */

// 单个数据项的 Schema
const swMaskLayerDataItemSchema = z.object({
  text: z.string().describe("文本内容")
});

export const swMaskLayerDataSchema = z.array(swMaskLayerDataItemSchema);
export type ftMaskLayerData = z.infer<typeof swMaskLayerDataSchema>;

export const swMaskLayerOptionSchema = z.object({
  linearGradient: z.object({
    markColor: z.string().describe("渐变遮罩颜色"),
    markPosition: z.number().describe("渐变位置"),
    markRadius: z.number().describe("渐变半径"),
    markOpacity: z.number().describe("渐变透明度")
  }).describe("线性渐变配置"),
  radioactiveGradation: z.object({
    markColor: z.string().describe("径向遮罩颜色"),
    markOpacityRadius: z.number().describe("透明区域半径"),
    markOpacity: z.number().describe("中心透明度"),
    markUnOpacityRadius: z.number().describe("不透明区域半径"),
    showLengthWidthRatio: z.boolean().describe("是否显示长宽比"),
    lengthWidthRatio: z.number().describe("长宽比值")
  }).describe("径向渐变配置"),
  markType: z.string().describe("遮罩类型(linearGradient/radioactiveGradation)"),
  pointerEvents: z.boolean().describe("是否响应鼠标事件"),
  refresh: z.boolean().describe("是否刷新"),
  backdropFilter: z.boolean().describe("是否启用背景滤镜"),
  backdropFilterBlur: z.number().describe("背景模糊度"),
  backdropFilterSaturate: z.number().describe("背景饱和度")
});

export type ftMaskLayerOption = z.infer<typeof swMaskLayerOptionSchema>;
