import type { FigmaNode } from "@/mastra/types/figma-type";
import type { NormalizedNode } from "@/mastra/types/normalized-node-types";
import { FtSubtabStrategy } from "@/mastra/workflows/figma-to-bi/steps/node-convert/strategies/FtSubtabStrategy";
import { normalizeNodeLayout } from "@/mastra/workflows/figma-to-bi/steps/normalize-layout-step";
import { resolveNodeStyles } from "@/mastra/workflows/figma-to-bi/steps/resolve-styles-step";

import subtabsData from "./subtabs.json";

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
    moduleId: 49,
    left: 0,
    top: 0,
    isLock: false,
    zIndex: 0,
    openFilter: false,
    ...subtabsData.config
  };
}

export async function runConvert(mockData: MockData) {
  const strategy = new FtSubtabStrategy();
  const normalizedNode = buildNormalizedNode(mockData);
  return strategy.convert({
    fileKey: "test-file-key",
    workflowId: "test-workflow-id",
    node: {
      node: normalizedNode,
      parentId: null,
      depth: 0,
      childrenIds: normalizedNode.children?.map((c) => c.id) ?? [],
      subtreeSize: 4,
      maxDepth: 3
    }
  });
}
