import { z } from "zod";

/**
 * 上升粒子 (simple-particle)
 * 扩展
 *
 * ## 数据结构
 * 无数据字段（data为空数组）
 */

export const simpleParticleDataSchema = z.array(z.never());
export type simpleParticleData = z.infer<typeof simpleParticleDataSchema>;

export const simpleParticleOptionSchema = z.object({
  size: z.number().describe("粒子大小"),
  number: z.number().describe("粒子数量"),
  direction: z.string().describe("运动方向(top/bottom/left/right)"),
  speed: z.number().describe("运动速度"),
  colorList: z.array(z.object({
    name: z.string().describe("颜色名称"),
    color: z.string().describe("颜色值")
  })).describe("粒子颜色列表，支持多种颜色随机分配")
});

export type simpleParticleOption = z.infer<typeof simpleParticleOptionSchema>;
