import { z } from "zod";

/**
 * 集成交互控制 (ft-integration-mutual)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `label` - 名称
 * - `value` - 值
 *
 * @example
 * ```typescript
 * const data: ftIntegrationMutualData = [
 *   { label: "集成区域点击", value: 1 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swIntegrationMutualDataItemSchema = z.object({
  label: z.string().describe("名称"),
  value: z.union([z.string(), z.number()]).describe("值")
});

export const swIntegrationMutualDataSchema = z.array(swIntegrationMutualDataItemSchema);
export type ftIntegrationMutualData = z.infer<typeof swIntegrationMutualDataSchema>;

/**
 * 集成交互控制配置选项 Schema
 */
export const swIntegrationMutualOptionSchema = z.object({
  fontSize: z.number().describe("字体大小"),
  fontFamily: z.string().describe("字体族"),
  fontColor: z.string().describe("字体颜色"),
  rotateX: z.number().describe("X轴旋转角度"),
  rotateY: z.number().describe("Y轴旋转角度"),
  rotateZ: z.number().describe("Z轴旋转角度"),
  skewX: z.number().describe("X轴倾斜角度"),
  skewY: z.number().describe("Y轴倾斜角度"),
  textTranslateX: z.number().describe("文本X偏移"),
  textTranslateY: z.number().describe("文本Y偏移"),
  bgImage: z.string().describe("背景图片"),
  isHovered: z.boolean().describe("是否启用悬停效果"),
  hoverFontSize: z.number().describe("悬停字体大小"),
  hoverFontFamily: z.string().describe("悬停字体族"),
  hoverFontColor: z.string().describe("悬停字体颜色"),
  hoverBgImage: z.string().describe("悬停背景图片"),
  isCursorPointer: z.string().describe("鼠标指针样式")
});

export type ftIntegrationMutualOption = z.infer<typeof swIntegrationMutualOptionSchema>;
