import { z } from "zod";

/**
 * 图片 (swimg)
 * 媒体
 *
 * 字段名与取值与 CSS 保持一致。所有字段可选，缺省走渲染层默认值。
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 图片地址（唯一来源）
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
export const swimgOptionSchema = z
  .object({
    objectFit: z.enum(["fill", "contain", "cover"]).describe("CSS object-fit，默认 fill").optional(),

    // ============ 外观 ============
    background: z.string().describe("图片下方的底色，CSS background").optional(),
    opacity: z.number().min(0).max(1).optional(),
    borderRadius: z.number().describe("圆角(px)").optional(),
    filter: z.string().describe("CSS filter，如 'blur(4px) brightness(1.2) grayscale(1)'").optional(),
    mixBlendMode: z.string().describe("CSS mix-blend-mode，如 'screen'").optional(),

    // ============ 变换与动画 ============
    transform: z.string().describe("CSS transform，如 'scaleX(-1)' 水平翻转、'rotateY(30deg)'").optional(),
    animation: z
      .string()
      .describe("CSS animation 简写，关键帧名取内置预设，如 'sw-rotate 8s linear infinite'")
      .optional(),
    keyframes: z
      .array(z.record(z.string(), z.union([z.string(), z.number()])))
      .describe(
        "自定义关键帧（Web Animations API 格式），如 [{transform:'translateY(0)'},{transform:'translateY(-10px)'}]；有此字段时 animation 只取时长/缓动/次数"
      )
      .optional(),
    transition: z.string().describe("换图时的过渡，CSS transition，如 'opacity 300ms'").optional(),

    // ============ 交互 ============
    pointerEvents: z.boolean().describe("是否响应鼠标，默认 false（装饰图不挡交互）").optional()
  })
  .strict();

export type SwimgOption = z.infer<typeof swimgOptionSchema>;
