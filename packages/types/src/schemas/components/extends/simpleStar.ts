import { z } from "zod";

/**
 * 闪点组件 (simpleStar)
 * 扩展
 *
 * ## 数据结构
 * 无数据字段（data为空数组）
 */

export const simpleStarDataSchema = z.array(z.never());
export type simpleStarData = z.infer<typeof simpleStarDataSchema>;

export const simpleStarOptionSchema = z.object({
  color: z.string().describe("闪点颜色"),
  dotNum: z.number().describe("闪点数量"),
  radio: z.number().describe("闪点半径")
});

export type simpleStarOption = z.infer<typeof simpleStarOptionSchema>;
