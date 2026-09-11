import type { FigmaNode } from "@/mastra/types/figma-type";
import type { NormalizedNode } from "@/mastra/types/normalized-node-types";
import { FtRichtextStrategy } from "@/mastra/workflows/figma-to-bi/steps/node-convert/strategies/FtRichtextStrategy";
import { normalizeNodeLayout } from "@/mastra/workflows/figma-to-bi/steps/normalize-layout-step";
import { resolveNodeStyles } from "@/mastra/workflows/figma-to-bi/steps/resolve-styles-step";

import ftRichtextData from "./ftRichtext.json";

interface MockData {
  globalVars: { styles: Record<string, unknown> };
  nodes: unknown[];
}

export function buildNormalizedNode(mockData: MockData): NormalizedNode {
  const globalStyles = mockData.globalVars.styles;
  const rawNode = mockData.nodes[0] as FigmaNode;
  const resolved = resolveNodeStyles(rawNode, globalStyles);
  return normalizeNodeLayout(resolved, globalStyles);
}

export function makeMockDefaultConfig() {
  return {
    id: 1,
    moduleId: 113,
    zIndex: 0,
    openFilter: false,
    ...ftRichtextData.config
  };
}

export async function runConvert(mockData: MockData) {
  const strategy = new FtRichtextStrategy();
  const normalizedNode = buildNormalizedNode(mockData);
  return strategy.convert({
    fileKey: "test-file-key",
    workflowId: "test-workflow-id",
    node: {
      node: normalizedNode,
      parentId: null,
      depth: 0,
      childrenIds: normalizedNode.children?.map((c) => c.id) ?? [],
      subtreeSize: 1,
      maxDepth: 0
    }
  });
}
