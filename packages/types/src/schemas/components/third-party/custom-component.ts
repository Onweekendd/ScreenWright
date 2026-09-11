import { z } from "zod";

/**
 * 自定义组件 (custom-component)
 * 第三方
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 文本值
 *
 * @example
 * ```typescript
 * const data: CustomComponentData = [
 *   { value: "欢迎使用新BI自定义组件" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const customComponentDataItemSchema = z.object({
  value: z.string().describe("文本值")
});

// 数据数组 Schema
export const customComponentDataSchema = z.array(customComponentDataItemSchema);

export type CustomComponentData = z.infer<typeof customComponentDataSchema>;

// ==================== Option Schema ====================

/**
 * 自定义组件配置选项 Schema
 */
export const customComponentOptionSchema = z.object({
  // ============ 代码库引用 ============
  codeLibraryIds: z.array(z.string()).describe("代码库ID列表"),

  // ============ 用户代码文件 ============
  user: z.record(
    z.string(),
    z.object({
      userMain: z.boolean().optional().describe("是否为用户主入口文件"),
      code: z.string().optional().describe("文件源代码"),
      compiled: z.object({
        js: z.string().describe("编译后的JS代码"),
        css: z.string().describe("编译后的CSS代码")
      }).optional()
    })
  ).describe("用户自定义代码文件映射，键为文件路径"),

  // ============ 系统代码文件 ============
  system: z.record(
    z.string(),
    z.object({
      systemMain: z.boolean().optional().describe("是否为系统主入口文件"),
      code: z.string().describe("文件源代码")
    })
  ).describe("系统代码文件映射，键为文件路径")
});

export type CustomComponentOption = z.infer<typeof customComponentOptionSchema>;
