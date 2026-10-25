import { z } from "zod";

/**
 * 矩形 (swBox)
 * 媒体
 *
 * 纯 CSS 盒子，用于蒙层、渐变块、分隔区、发光边框、毛玻璃底板。无数据。
 */
export const swBoxDataSchema = z.array(z.unknown()).max(0);

export type SwBoxData = z.infer<typeof swBoxDataSchema>;

export const swBoxOptionSchema = z
  .object({
    background: z.string().describe("CSS background，可为渐变").optional(),
    border: z.string().describe("CSS border，如 '1px solid rgba(69,131,255,.4)'").optional(),
    borderRadius: z.union([z.number(), z.string()]).describe("圆角，数字为 px；字符串按 CSS，如 '8px 8px 0 0'").optional(),
    boxShadow: z.string().describe("CSS box-shadow，内发光如 'inset 0 0 20px rgba(69,131,255,.5)'").optional(),
    backdropFilter: z.string().describe("毛玻璃，如 'blur(8px)'").optional(),
    opacity: z.number().min(0).max(1).optional(),
    clipPath: z.string().describe("CSS clip-path，切角/斜边，如 'polygon(12px 0,100% 0,100% 100%,0 100%,0 12px)'").optional(),
    transform: z.string().optional(),
    animation: z.string().describe("CSS animation 简写，关键帧名取内置预设").optional(),
    pointerEvents: z.boolean().describe("是否响应鼠标，默认 false").optional()
  })
  .strict();

export type SwBoxOption = z.infer<typeof swBoxOptionSchema>;
