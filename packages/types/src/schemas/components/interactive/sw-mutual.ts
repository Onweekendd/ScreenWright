import { z } from "zod";

/**
 * 交互组件 (ft-mutual)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `label` - 名称
 * - `value` - 值
 *
 * @example
 * ```typescript
 * const data: ftMutualData = [
 *   { label: "区域点击", value: 1 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swMutualDataItemSchema = z.object({
  label: z.string().describe("名称"),
  value: z.union([z.string(), z.number()]).describe("值")
});

export const swMutualDataSchema = z.array(swMutualDataItemSchema);
export type ftMutualData = z.infer<typeof swMutualDataSchema>;

/**
 * 交互组件配置选项 Schema
 */
export const swMutualOptionSchema = z.object({
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
  isCursorPointer: z.boolean().describe("是否显示手型指针"),
  aiChatShow: z.boolean().describe("是否显示AI聊天"),
  aichatQa: z
    .object({
      fontSize: z.number(),
      fontWeight: z.boolean(),
      fontStyle: z.boolean(),
      fontFamily: z.string(),
      fontColor: z.string(),
      backgroundColor: z.string(),
      backgroundImage: z.string(),
      backgroundImageType: z.string(),
      backgroundType: z.string(),
      boxWidth: z.number(),
      boxHeight: z.number(),
      boxX: z.number(),
      boxY: z.number(),
      boxCompWidth: z.number(),
      boxCompHeight: z.number(),
      borderRadius: z.number(),
      filterBlur: z.number(),
      qaUrl: z.string(),
      defaultAsk: z.string()
    })
    .passthrough()
    .optional()
    .describe("AI聊天配置"),
  opacity: z.number().describe("透明度")
});

export type ftMutualOption = z.infer<typeof swMutualOptionSchema>;
