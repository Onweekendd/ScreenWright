import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { StepEnum } from "@/mastra/types";
import type { globalStylesSchema, layoutModeSchema } from "@/mastra/types/figma-type";
import { metadataSchema } from "@/mastra/types/figma-type";

import { type NormalizedNode, normalizedNodeSchema } from "../../../types/normalized-node-types";
import { styleResolvedFileSchema, type StyleResolvedNode } from "./resolve-styles-step";

// 输出 schema - 完全归一化的节点数组
export const outputSchema = z.object({
  fileKey: z.string().optional().describe("Figma 文件 Key"),
  metadata: metadataSchema.optional().describe("文件元数据"),
  nodes: z.array(normalizedNodeSchema).describe("完全归一化的节点树列表")
});

/**
 * 解析节点的布局样式引用
 * @param node 样式已解析的节点
 * @param globalStyles 全局样式映射
 */
export function normalizeNodeLayout(
  node: StyleResolvedNode,
  globalStyles: z.infer<typeof globalStylesSchema>
): NormalizedNode {
  const normalized: NormalizedNode = {
    id: node.id,
    name: node.name,
    type: node.type,
    text: node.text,
    characterStyleOverrides: node.characterStyleOverrides, // 传递字符级样式覆盖
    imgLocalPath: node.imgLocalPath, // 传递图片本地路径
    textStyle: node.textStyle,
    fills: node.fills,
    strokes: node.strokes,
    effects: node.effects,
    opacity: node.opacity,
    borderRadius: node.borderRadius,
    visible: node.visible,
    locked: node.locked,
    componentProperties: node.componentProperties
  };

  // 保留 stateIndex（如果存在）
  if ("stateIndex" in node && typeof node.stateIndex === "number") {
    normalized.stateIndex = node.stateIndex;
  }

  // 解析 layout 引用
  if (node.layout && typeof node.layout === "string") {
    const layoutData = globalStyles[node.layout];
    if (layoutData) {
      const layout = layoutData as z.infer<typeof layoutModeSchema>;
      normalized.layout = layout;
    }
  }

  // 递归处理子节点
  if (node.children && node.children.length > 0) {
    normalized.children = node.children.map((child) => normalizeNodeLayout(child, globalStyles));
  }

  return normalized;
}

export const normalizeLayoutStep = createStep({
  id: StepEnum.NORMALIZE_LAYOUT,
  description: "解析 Figma 节点的布局样式引用",
  inputSchema: styleResolvedFileSchema,
  outputSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }

    const globalStyles = inputData.globalVars?.styles || {};

    // 处理所有根节点
    const normalizedNodes = inputData.nodes.map((node: StyleResolvedNode) => normalizeNodeLayout(node, globalStyles));

    return {
      fileKey: inputData.fileKey,
      metadata: inputData.metadata,
      nodes: normalizedNodes
    };
  }
});
