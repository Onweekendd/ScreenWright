import { z } from "zod";

/**
 * 文本框/跑马灯/超链接 (swtext)
 * 文字
 *
 * 字段名与取值与 CSS 保持一致。所有字段可选，缺省走渲染层默认值。
 * 跑马灯、超链接、普通文字由字段是否存在来区分（`marquee` / `href`），不再使用 `type` 枚举。
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 文本内容（唯一来源）
 *
 * @example
 * ```typescript
 * const data: FtTextData = [
 *   { value: "大屏标题文字" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swTextDataItemSchema = z.object({
  value: z.union([z.string(), z.number()]).describe("文本内容")
});

// 数据数组 Schema
export const swTextDataSchema = z.array(swTextDataItemSchema);

export type FtTextData = z.infer<typeof swTextDataSchema>;

// ==================== Option Schema ====================

/**
 * 文本框/跑马灯/超链接配置选项 Schema
 */
export const swTextOptionSchema = z
  .object({
    // ============ 字体 ============
    fontFamily: z.string().describe("CSS font-family").optional(),
    fontSize: z.number().describe("字号(px)").optional(),
    fontWeight: z.union([z.number(), z.string()]).describe("CSS font-weight，如 400 / 'bold'").optional(),
    fontStyle: z.enum(["normal", "italic"]).optional(),
    letterSpacing: z.number().describe("字间距(px)").optional(),
    lineHeight: z.number().describe("行高，CSS 无单位倍数，如 1.5").optional(),

    // ============ 颜色与效果 ============
    color: z
      .string()
      .describe("纯色 '#fff' / 'rgba(...)'，或 CSS 渐变 'linear-gradient(90deg,#fff,#496adc)'；多层渐变用逗号分隔")
      .optional(),
    textShadow: z.string().describe("CSS text-shadow，发光如 '0 0 24px rgba(69,131,255,1)'；可多层").optional(),
    background: z.string().describe("文字底色，CSS background").optional(),
    opacity: z.number().min(0).max(1).optional(),

    // ============ 排版 ============
    textAlign: z.enum(["left", "center", "right"]).optional(),
    verticalAlign: z.enum(["top", "middle", "bottom"]).describe("在组件框内的垂直位置").optional(),
    whiteSpace: z.enum(["nowrap", "normal", "pre-line"]).describe("nowrap 单行 / normal 自动换行 / pre-line 保留换行符").optional(),
    textOverflow: z.enum(["clip", "ellipsis"]).optional(),
    writingMode: z.enum(["horizontal-tb", "vertical-rl", "vertical-lr"]).optional(),
    textOrientation: z.enum(["mixed", "upright"]).optional(),

    // ============ 变换与动画 ============
    transform: z.string().describe("CSS transform，如 'rotateZ(15deg)'").optional(),
    animation: z.string().describe("CSS animation 简写，关键帧名取内置预设，如 'sw-breath 2s ease-in-out infinite'").optional(),

    // ============ 数值格式化 ============
    template: z.string().describe("显示模板，{value} 替换为内容，如 '{value} kWh'；不填直接显示内容").optional(),
    decimals: z.number().int().min(0).describe("内容为数字时保留的小数位").optional(),
    thousands: z.boolean().describe("内容为数字时显示千分位").optional(),

    // ============ 跑马灯 ============
    marquee: z
      .object({
        speed: z.number().describe("滚动速度(px/s)"),
        direction: z.enum(["left", "right"]).optional()
      })
      .describe("有此字段即为跑马灯")
      .optional(),

    // ============ 超链接 ============
    href: z.string().describe("有此字段即为超链接").optional(),
    target: z.enum(["_self", "_blank"]).optional(),

    // ============ 交互 ============
    pointerEvents: z.boolean().describe("是否响应鼠标，默认 false").optional()
  })
  .strict();

export type FtTextOption = z.infer<typeof swTextOptionSchema>;
