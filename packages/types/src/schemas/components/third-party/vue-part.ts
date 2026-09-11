import { z } from "zod";

/**
 * vue2 片段 (vue-part)
 * 第三方
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `name` - 类目名称
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: VuePartData = [
 *   { name: "广州", value: 10 },
 *   { name: "深圳", value: 10 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const vuePartDataItemSchema = z.object({
  name: z.string().describe("类目名称"),
  value: z.number().describe("数值")
});

// 数据数组 Schema
export const vuePartDataSchema = z.array(vuePartDataItemSchema);

export type VuePartData = z.infer<typeof vuePartDataSchema>;

// ==================== Option Schema ====================

/**
 * vue2 片段配置选项 Schema
 */
export const vuePartOptionSchema = z.object({
  // ============ 自定义函数名 ============
  funName: z.string().describe("自定义交互函数名称，用于事件通信标识"),

  // ============ 模板代码 ============
  template: z.string().describe("Vue模板代码，定义组件的HTML结构"),

  // ============ 脚本代码 ============
  js: z.string().describe("Vue脚本代码，定义组件的逻辑，包含data、methods、computed等"),

  // ============ 样式代码 ============
  css: z.string().describe("CSS样式代码，定义组件的样式")
});

export type VuePartOption = z.infer<typeof vuePartOptionSchema>;
