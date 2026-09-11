import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { StepEnum, type TokenUsage, tokenUsageSchema } from "@/mastra/types";
import type { NormalizedNode } from "@/mastra/types/normalized-node-types";
import { outputSchema as normalizedLayoutOutputSchema } from "@/mastra/workflows/figma-to-bi/steps/normalize-layout-step";
import { NodeSuffix } from "@/mastra/workflows/figma-to-bi/utils/naming-rules";

import { analyzeScreenRegionsStep } from "./analyze-screen-regions-step";
import { assignNodesToRegionsStep } from "./assign-nodes-to-regions-step";
import { codiaPreparationWorkflow } from "./codia-preparation-workflow";
import { getNodeRect, type Rect, semanticBoundsToRect, unionRects } from "./semantic-layout-geometry";
import {
  type RegionAnalysisTask,
  type RegionGroupResult,
  regionGroupResultSchema,
  type SemanticGroup
} from "./semantic-layout-types";

const MIN_GROUP_CONFIDENCE = 0.75;

const withSuffix = (name: string, suffix: NodeSuffix): string => {
  const clean = name.trim().replace(/-(?:panel|group)$/i, "") || "语义容器";
  return `${clean}${suffix}`;
};

const createContainerLayout = (rect: Rect): NonNullable<NormalizedNode["layout"]> => ({
  mode: "none",
  absolutePosition: { x: rect.x, y: rect.y },
  dimensions: { width: rect.width, height: rect.height }
});

interface AcceptedGroup {
  suggestion: SemanticGroup;
  nodes: NormalizedNode[];
  rect: Rect;
  groupIndex: number;
}

const selectAcceptedGroups = (task: RegionAnalysisTask, result: RegionGroupResult | undefined): AcceptedGroup[] => {
  if (!result?.success || result.groups.length === 0) {
    return [];
  }

  const claimedNodeIds = new Set<string>();
  const accepted: AcceptedGroup[] = [];

  const ranked = result.groups
    .map((suggestion, groupIndex) => ({ suggestion, groupIndex }))
    .sort((a, b) => b.suggestion.confidence - a.suggestion.confidence);

  for (const { suggestion, groupIndex } of ranked) {
    if (suggestion.confidence < MIN_GROUP_CONFIDENCE) {
      continue;
    }

    const memberIndexes = [...new Set(suggestion.memberIndexes)].filter(
      (index) => index >= 0 && index < task.nodes.length
    );
    const nodes = memberIndexes
      .map((index) => task.nodes[index])
      .filter((node) => node && !claimedNodeIds.has(node.id));
    if (nodes.length < 2 || nodes.some((node) => node.children?.length)) {
      continue;
    }

    const rects = nodes.map(getNodeRect).filter((rect): rect is Rect => Boolean(rect));
    if (rects.length !== nodes.length) {
      continue;
    }

    for (const node of nodes) {
      claimedNodeIds.add(node.id);
    }
    accepted.push({
      suggestion,
      nodes,
      rect: unionRects(rects),
      groupIndex
    });
  }

  return accepted;
};

const indexGroupsByNodeId = (groups: AcceptedGroup[]): Map<string, AcceptedGroup> => {
  const groupByNodeId = new Map<string, AcceptedGroup>();
  for (const group of groups) {
    for (const node of group.nodes) {
      groupByNodeId.set(node.id, group);
    }
  }
  return groupByNodeId;
};

const buildGroups = (task: RegionAnalysisTask, result: RegionGroupResult | undefined): NormalizedNode[] => {
  const accepted = selectAcceptedGroups(task, result);
  if (accepted.length === 0) {
    return task.nodes;
  }

  const groupByNodeId = indexGroupsByNodeId(accepted);
  const emittedGroups = new Set<number>();
  const children: NormalizedNode[] = [];
  for (const node of task.nodes) {
    const group = groupByNodeId.get(node.id);
    if (!group) {
      children.push(node);
      continue;
    }
    if (emittedGroups.has(group.groupIndex)) {
      continue;
    }

    emittedGroups.add(group.groupIndex);
    children.push({
      id: `semantic-group:${task.regionIndex}:${group.groupIndex}`,
      name: withSuffix(group.suggestion.name, NodeSuffix.GROUP),
      type: "GROUP",
      layout: createContainerLayout(group.rect),
      visible: true,
      children: group.nodes
    });
  }

  return children;
};

const assertValidSemanticTree = (root: NormalizedNode, originalAtomIds: Set<string>): void => {
  const seenIds = new Set<string>();
  const seenAtoms = new Set<string>();
  const stack: Array<{ node: NormalizedNode; insideGroup: boolean; insidePanel: boolean }> = [
    { node: root, insideGroup: false, insidePanel: false }
  ];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (seenIds.has(current.node.id)) {
      throw new Error(`节点 ID 重复: ${current.node.id}`);
    }
    seenIds.add(current.node.id);

    const isGroup = current.node.name.endsWith(NodeSuffix.GROUP);
    const isPanel = current.node.name.endsWith(NodeSuffix.PANEL);
    if (isGroup && current.insideGroup) {
      throw new Error(`检测到 Group 嵌套: ${current.node.id}`);
    }
    if (isPanel && current.insidePanel) {
      throw new Error(`检测到 DynamicPanel 嵌套: ${current.node.id}`);
    }
    if (originalAtomIds.has(current.node.id)) {
      seenAtoms.add(current.node.id);
    }

    for (const child of current.node.children ?? []) {
      stack.push({
        node: child,
        insideGroup: current.insideGroup || isGroup,
        insidePanel: current.insidePanel || isPanel
      });
    }
  }

  if (seenAtoms.size !== originalAtomIds.size) {
    throw new Error(`语义重建丢失节点: expected=${originalAtomIds.size}, actual=${seenAtoms.size}`);
  }
};

/**
 * 根据经过校验的区域和分组建议重建固定两层的语义容器树。
 */
export function rebuildSemanticTree(
  root: NormalizedNode,
  tasks: RegionAnalysisTask[],
  groupResults: RegionGroupResult[]
): NormalizedNode {
  if (tasks.length === 0) {
    return root;
  }

  const originalChildren = root.children ?? [];
  const originalIndex = new Map(originalChildren.map((node, index) => [node.id, index]));
  const originalAtomIds = new Set(originalChildren.map((node) => node.id));
  const assignedNodeIds = new Set(tasks.flatMap((task) => task.nodes.map((node) => node.id)));
  const groupResultByRegion = new Map(groupResults.map((result) => [result.regionIndex, result]));
  const canvasWidth = root.layout?.dimensions?.width ?? 0;
  const canvasHeight = root.layout?.dimensions?.height ?? 0;

  const ordered: Array<{ order: number; tie: number; node: NormalizedNode }> = originalChildren
    .filter((node) => !assignedNodeIds.has(node.id))
    .map((node, index) => ({ order: originalIndex.get(node.id) ?? index, tie: 0, node }));

  for (const task of tasks) {
    const children = buildGroups(task, groupResultByRegion.get(task.regionIndex));
    const regionRect = semanticBoundsToRect(task.region.bounds, canvasWidth, canvasHeight);
    const nodeRects = task.nodes.map(getNodeRect).filter((rect): rect is Rect => Boolean(rect));
    const panelRect = nodeRects.length > 0 ? unionRects([regionRect, ...nodeRects]) : regionRect;
    const panel: NormalizedNode = {
      id: `semantic-panel:${task.regionIndex}`,
      name: withSuffix(task.region.name, NodeSuffix.PANEL),
      type: "FRAME",
      layout: createContainerLayout(panelRect),
      visible: true,
      children
    };
    ordered.push({
      order: Math.min(...task.nodes.map((node) => originalIndex.get(node.id) ?? Number.MAX_SAFE_INTEGER)),
      tie: task.regionIndex + 1,
      node: panel
    });
  }

  ordered.sort((a, b) => a.order - b.order || a.tie - b.tie);
  const rebuilt: NormalizedNode = {
    ...root,
    children: ordered.map((item) => item.node)
  };
  assertValidSemanticTree(rebuilt, originalAtomIds);
  return rebuilt;
}

const mergeTokenUsage = (...usages: Array<TokenUsage | undefined>): TokenUsage => {
  const merged: TokenUsage = {};
  for (const usage of usages) {
    for (const [stepId, entries] of Object.entries(usage ?? {})) {
      merged[stepId] = [...(merged[stepId] ?? []), ...entries];
    }
  }
  return merged;
};

export const rebuildSemanticContainersStep = createStep({
  id: StepEnum.REBUILD_SEMANTIC_CONTAINERS,
  description: "校验区域分组建议并重建固定两层的 DynamicPanel / Group 节点树",
  inputSchema: z.array(regionGroupResultSchema),
  outputSchema: normalizedLayoutOutputSchema,
  stateSchema: z.object({
    tokenUsage: tokenUsageSchema
  }),
  execute: async ({ inputData, state, setState, getStepResult }) => {
    const normalized = getStepResult(codiaPreparationWorkflow);
    const tasks = getStepResult(assignNodesToRegionsStep);
    const screenAnalysis = getStepResult(analyzeScreenRegionsStep);
    const root = normalized.nodes[0] as NormalizedNode | undefined;
    if (!root) {
      throw new Error("[SemanticLayout] Codia 原子节点树为空");
    }

    const tokenUsage = mergeTokenUsage(
      state.tokenUsage,
      screenAnalysis.tokenUsage,
      ...inputData.map((result) => result.tokenUsage)
    );
    setState({ tokenUsage });

    try {
      return {
        ...normalized,
        nodes: [rebuildSemanticTree(root, tasks as RegionAnalysisTask[], inputData)]
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[SemanticLayout] 语义树校验失败，降级为 Codia 原子平铺: ${message}`);
      return normalized;
    }
  }
});
