import { z } from "zod";

/**
 * 字符云 (echartwordcloud)
 * 指标
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `name` - 文本/类目名称
 * - `value` - 权重值
 *
 * @example
 * ```typescript
 * const data: EchartWordcloudData = [
 *   { name: "汽车", value: 928 },
 *   { name: "视频", value: 906 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const echartWordcloudDataItemSchema = z.object({
  name: z.string().describe("文本/类目名称"),
  value: z.number().describe("权重值")
});

// 数据数组 Schema（最终导出的类型）
export const echartWordcloudDataSchema = z.array(echartWordcloudDataItemSchema);

export type EchartWordcloudData = z.infer<typeof echartWordcloudDataSchema>;

/**
 * 字符云配置选项 Schema
 */
export const echartWordcloudOptionSchema = z.object({
  // ============ 位置配置 ============
  left: z.number().describe("左边距"),
  top: z.number().describe("上边距"),

  // ============ 字体配置 ============
  fontFamily: z.string().describe("字体名称"),

  // ============ 字号范围 ============
  sizeRangeMax: z.number().describe("最大字号"),
  sizeRangeMin: z.number().describe("最小字号"),

  // ============ 旋转配置 ============
  rotationRangeMax: z.number().describe("最大旋转角度"),
  rotationRangeMin: z.number().describe("最小旋转角度"),
  rotationStep: z.number().describe("旋转步长"),

  // ============ 网格与形状 ============
  gridSize: z.number().describe("网格大小（词间距）"),
  shape: z.string().describe("云形状，如 circle/square/cardioid/diamond/triangle/star"),

  // ============ 遮罩图片 ============
  maskImageShow: z.boolean().describe("是否启用遮罩图片"),
  maskImage: z.string().describe("遮罩图片地址"),

  // ============ 其他配置 ============
  keepAspect: z.boolean().describe("是否保持遮罩图片宽高比"),
  drawOutOfBound: z.boolean().describe("是否允许绘制超出边界")
});

export type EchartWordcloudOption = z.infer<typeof echartWordcloudOptionSchema>;
