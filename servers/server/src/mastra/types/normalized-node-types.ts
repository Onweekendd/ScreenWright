import { z } from "zod";

import {
  characterStyleOverridesSchema,
  effectSchema,
  figmaNodeTypeSchema,
  fillSchema,
  layoutModeSchema,
  strokeSchema,
  textStyleSchema
} from "./figma-type";

/**
 * 归一化后的节点类型
 * 将 FigmaNode 中的字符串引用字段转换为实际的类型对象
 */
export interface NormalizedNode {
  // 基础属性
  id: string;
  name: string;
  type: z.infer<typeof figmaNodeTypeSchema>;

  // 布局信息 - 从字符串引用转为实际对象
  layout?: z.infer<typeof layoutModeSchema>;

  imgLocalPath?: string;

  // 文本相关
  text?: string;
  textStyle?: z.infer<typeof textStyleSchema>;
  characterStyleOverrides?: z.infer<typeof characterStyleOverridesSchema>;

  // 样式 - 从字符串引用转为实际对象
  fills?: z.infer<typeof fillSchema>[];
  strokes?: z.infer<typeof strokeSchema>;
  effects?: z.infer<typeof effectSchema>;
  opacity?: number;
  borderRadius?: string;

  // 可选基础属性
  visible?: boolean;
  locked?: boolean;

  // 层级值（BFS 遍历顺序的全局递增值）
  depth?: number;

  // 组件相关
  componentProperties?: any;

  // 状态索引（用于多状态节点）
  stateIndex?: number;

  isLeaf?: boolean;

  // 子节点 - 递归结构
  children?: NormalizedNode[];
}

/**
 * 归一化后的节点 Schema（不含 children）
 */
export const normalizedNodeSchemaWithoutChild = z.object({
  // 基础属性
  id: z.string().describe("节点唯一标识"),
  name: z.string().describe("节点名称"),
  type: figmaNodeTypeSchema.describe("节点类型"),

  // 布局信息 - 从字符串引用转为实际对象
  layout: layoutModeSchema.optional().describe("布局样式对象"),

  // 文本相关
  text: z.string().optional().describe("文本内容"),
  textStyle: textStyleSchema.optional().describe("文本样式对象"),
  characterStyleOverrides: characterStyleOverridesSchema.optional().describe("字符级样式覆盖对象"),

  imgLocalPath: z.string().optional().describe("图片本地路径"),

  // 样式 - 从字符串引用转为实际对象
  fills: z.array(fillSchema).optional().describe("填充样式数组"),
  strokes: strokeSchema.optional().describe("描边样式对象"),
  effects: effectSchema.optional().describe("效果样式对象"),
  opacity: z.number().min(0).max(1).optional().describe("透明度 0-1"),
  borderRadius: z.string().optional().describe("圆角半径"),

  // 可选基础属性
  visible: z.boolean().optional().describe("是否可见"),
  locked: z.boolean().optional().describe("是否锁定"),

  // 层级值（BFS 遍历顺序的全局递增值）
  depth: z.number().optional().describe("节点层级值，用于设置 zIndex"),

  // 组件相关
  componentProperties: z.any(),

  // 状态索引（用于多状态节点）
  stateIndex: z.number().optional().describe("状态索引，用于标记多状态节点"),

  isLeaf: z.boolean().optional().describe("是否为叶子节点")
});

/**
 * 归一化后的节点 Schema（递归结构）
 */
export const normalizedNodeSchema: z.ZodSchema<NormalizedNode> = normalizedNodeSchemaWithoutChild.extend({
  children: z
    .lazy(() => z.array(normalizedNodeSchema))
    .optional()
    .describe("子节点列表")
});
