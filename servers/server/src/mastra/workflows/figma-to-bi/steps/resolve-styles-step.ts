import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { StepEnum } from "@/mastra/types";
import type { componentPropertyValueSchema, FigmaNode } from "@/mastra/types/figma-type";
import {
  characterStyleOverridesSchema,
  effectSchema,
  figmaFileSchema,
  figmaNodeTypeSchema,
  fillSchema,
  globalStylesSchema,
  metadataSchema,
  strokeSchema,
  textStyleSchema
} from "@/mastra/types/figma-type";

/**
 * 样式已解析的中间节点类型
 * textStyle, fills, strokes, effects 已从字符串引用转换为实际对象
 * layout 仍然是字符串引用，等待后续步骤处理
 */
export interface StyleResolvedNode {
  id: string;
  name: string;
  type: z.infer<typeof figmaNodeTypeSchema>;

  // 布局仍然是字符串引用
  layout?: string;

  // 文本相关
  text?: string;
  textStyle?: z.infer<typeof textStyleSchema>; // 已解析
  characterStyleOverrides?: z.infer<typeof characterStyleOverridesSchema>; // 字符级样式覆盖

  imgLocalPath?: string;

  // 样式 - 已解析为实际对象
  fills?: z.infer<typeof fillSchema>[];
  strokes?: z.infer<typeof strokeSchema>;
  effects?: z.infer<typeof effectSchema>;
  opacity?: number;
  borderRadius?: string;

  // 基础属性
  visible?: boolean;
  locked?: boolean;

  // 组件相关
  componentProperties?: Record<string, z.infer<typeof componentPropertyValueSchema>>;

  // 状态索引（用于多状态节点）
  stateIndex?: number;

  // 子节点 - 递归结构
  children?: StyleResolvedNode[];
}

/**
 * 样式已解析的节点 Schema
 */
export const styleResolvedNodeSchema: z.ZodType<StyleResolvedNode> = z.object({
  id: z.string(),
  name: z.string(),
  type: figmaNodeTypeSchema,
  layout: z.string().optional(),
  text: z.string().optional(),
  textStyle: textStyleSchema.optional(),
  characterStyleOverrides: characterStyleOverridesSchema.optional().describe("字符级样式覆盖对象"),
  imgLocalPath: z.string().optional().describe("图片本地路径"),
  fills: z.array(fillSchema).optional(),
  strokes: strokeSchema.optional(),
  effects: effectSchema.optional(),
  opacity: z.number().min(0).max(1).optional(),
  borderRadius: z.string().optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
  componentProperties: z.any(),
  stateIndex: z.number().optional(),
  children: z.array(z.lazy(() => styleResolvedNodeSchema)).optional()
});

/**
 * 样式已解析的文件结构 Schema
 */
export const styleResolvedFileSchema = z.object({
  fileKey: z.string().optional().describe("Figma 文件 Key"),
  metadata: metadataSchema.optional().describe("文件元数据"),
  nodes: z.array(styleResolvedNodeSchema).describe("样式已解析的节点树列表"),
  globalVars: z
    .object({
      styles: globalStylesSchema.describe("全局样式变量映射表")
    })
    .optional()
    .describe("全局变量(包含样式定义)")
});

/**
 * 解析单个节点的样式引用
 */
export function resolveNodeStyles(
  node: FigmaNode,
  globalStyles: z.infer<typeof globalStylesSchema>
): StyleResolvedNode {
  const resolved: StyleResolvedNode = {
    id: node.id,
    name: node.name,
    type: node.type,
    layout: node.layout, // 保持字符串引用，不处理
    text: node.text,
    characterStyleOverrides: node.characterStyleOverrides, // 传递字符级样式覆盖
    imgLocalPath: node.imgLocalPath, // 传递图片本地路径
    opacity: node.opacity,
    borderRadius: node.borderRadius,
    visible: node.visible,
    locked: node.locked,
    componentProperties: node.componentProperties
  };

  // 保留 stateIndex（如果存在）
  if ("stateIndex" in node && typeof node.stateIndex === "number") {
    resolved.stateIndex = node.stateIndex;
  }

  // 解析 textStyle 引用
  if (node.textStyle && typeof node.textStyle === "string") {
    const style = globalStyles[node.textStyle];
    if (style) {
      resolved.textStyle = style as z.infer<typeof textStyleSchema>;
    }
  }

  // 解析 fills 引用
  if (node.fills && typeof node.fills === "string") {
    const fillsData = globalStyles[node.fills];
    if (fillsData && Array.isArray(fillsData)) {
      resolved.fills = fillsData as z.infer<typeof fillSchema>[];
    }
  }

  // 解析 strokes 引用
  if (node.strokes && typeof node.strokes === "string") {
    const strokesData = globalStyles[node.strokes];
    if (strokesData) {
      resolved.strokes = strokesData as z.infer<typeof strokeSchema>;
    }
  }

  // 解析 effects 引用
  if (node.effects && typeof node.effects === "string") {
    const effectsData = globalStyles[node.effects];
    if (effectsData) {
      resolved.effects = effectsData as z.infer<typeof effectSchema>;
    }
  }

  // 递归处理子节点
  if (node.children && node.children.length > 0) {
    resolved.children = node.children.map((child) => resolveNodeStyles(child, globalStyles));
  }

  return resolved;
}

export const resolveStylesStep = createStep({
  id: StepEnum.RESOLVE_STYLES,
  description: "解析 Figma 节点的样式引用，将 textStyle、fills、strokes、effects 转换为实际对象",
  inputSchema: figmaFileSchema,
  outputSchema: styleResolvedFileSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }

    const { nodes, globalVars, metadata, fileKey } = inputData;

    const globalStyles = globalVars?.styles;
    if (!globalStyles) {
      throw new Error("Global styles not found");
    }

    // 解析所有节点的样式引用
    const resolvedNodes = nodes.map((node: FigmaNode) => resolveNodeStyles(node, globalStyles));

    return {
      fileKey: fileKey,
      metadata: metadata,
      nodes: resolvedNodes,
      globalVars: globalVars
    };
  }
});
