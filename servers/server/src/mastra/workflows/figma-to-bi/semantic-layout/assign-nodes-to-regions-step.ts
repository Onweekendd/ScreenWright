import { createStep } from "@mastra/core/workflows";
import sharp from "sharp";
import { z } from "zod";

import { fetchChatImageBuffer } from "@/mastra/services/chat-image.server";
import { StepEnum } from "@/mastra/types";
import type { NormalizedNode } from "@/mastra/types/normalized-node-types";
import { outputSchema as normalizedLayoutOutputSchema } from "@/mastra/workflows/figma-to-bi/steps/normalize-layout-step";

import { analyzeScreenRegionsStep } from "./analyze-screen-regions-step";
import { CODIA_PREPARATION_WORKFLOW_ID } from "./codia-preparation-workflow";
import {
  getNodeRect,
  intersectionArea,
  type Rect,
  semanticBoundsToRect,
  toRelativeSemanticBounds
} from "./semantic-layout-geometry";
import {
  type RegionAnalysisTask,
  regionAnalysisTaskSchema,
  type RegionCandidate,
  type ScreenRegion,
  screenRegionStepOutputSchema
} from "./semantic-layout-types";

const MIN_INTERSECTION_OVER_NODE = 0.65;
const GLOBAL_NODE_AREA_RATIO = 0.5;
const MAX_GROUP_CANDIDATES = 160;

interface RegionAssignment {
  regionIndex: number;
  region: ScreenRegion;
  bounds: Rect;
  nodes: NormalizedNode[];
  candidates: RegionCandidate[];
}

const parallelInputSchema = z.object({
  [CODIA_PREPARATION_WORKFLOW_ID]: normalizedLayoutOutputSchema,
  [analyzeScreenRegionsStep.id]: screenRegionStepOutputSchema
});

/**
 * 确定性地把根下原子节点分配给一个且仅一个一级区域。
 */
export function assignNodesToRegions(root: NormalizedNode, regions: ScreenRegion[]): RegionAssignment[] {
  const canvasWidth = root.layout?.dimensions?.width ?? 0;
  const canvasHeight = root.layout?.dimensions?.height ?? 0;
  const canvasArea = canvasWidth * canvasHeight;
  if (canvasArea <= 0) {
    return [];
  }

  const assignments: RegionAssignment[] = regions.map((region, regionIndex) => ({
    regionIndex,
    region,
    bounds: semanticBoundsToRect(region.bounds, canvasWidth, canvasHeight),
    nodes: [],
    candidates: []
  }));

  for (const [zOrder, node] of (root.children ?? []).entries()) {
    const nodeRect = getNodeRect(node);
    if (!nodeRect || (nodeRect.width * nodeRect.height) / canvasArea >= GLOBAL_NODE_AREA_RATIO) {
      continue;
    }

    const centerX = nodeRect.x + nodeRect.width / 2;
    const centerY = nodeRect.y + nodeRect.height / 2;
    const nodeArea = nodeRect.width * nodeRect.height;
    let best: { assignment: RegionAssignment; score: number } | undefined;

    for (const assignment of assignments) {
      const regionRect = assignment.bounds;
      const centerInside =
        centerX >= regionRect.x &&
        centerX <= regionRect.x + regionRect.width &&
        centerY >= regionRect.y &&
        centerY <= regionRect.y + regionRect.height;
      const overlap = intersectionArea(nodeRect, regionRect) / nodeArea;
      if (!centerInside && overlap < MIN_INTERSECTION_OVER_NODE) {
        continue;
      }

      const score = overlap + (centerInside ? 0.25 : 0);
      if (!best || score > best.score) {
        best = { assignment, score };
      }
    }

    if (!best) {
      continue;
    }

    const index = best.assignment.nodes.length;
    best.assignment.nodes.push(node);
    if (index < MAX_GROUP_CANDIDATES) {
      best.assignment.candidates.push({
        index,
        nodeId: node.id,
        type: node.type,
        name: node.name,
        text: node.text,
        bounds: toRelativeSemanticBounds(nodeRect, best.assignment.bounds),
        zOrder
      });
    }
  }

  return assignments.filter((assignment) => assignment.nodes.length > 0);
}

const toCropRect = (region: ScreenRegion, imageWidth: number, imageHeight: number): Rect => {
  const raw = semanticBoundsToRect(region.bounds, imageWidth, imageHeight);
  const left = Math.max(0, Math.min(imageWidth - 1, Math.floor(raw.x)));
  const top = Math.max(0, Math.min(imageHeight - 1, Math.floor(raw.y)));
  const right = Math.max(left + 1, Math.min(imageWidth, Math.ceil(raw.x + raw.width)));
  const bottom = Math.max(top + 1, Math.min(imageHeight, Math.ceil(raw.y + raw.height)));
  return { x: left, y: top, width: right - left, height: bottom - top };
};

export const assignNodesToRegionsStep = createStep({
  id: StepEnum.ASSIGN_NODES_TO_REGIONS,
  description: "将原子节点唯一分配到一级区域，并裁剪区域图片供 foreach 分组分析",
  inputSchema: parallelInputSchema,
  outputSchema: z.array(regionAnalysisTaskSchema),
  execute: async ({ inputData }) => {
    const normalized = inputData[CODIA_PREPARATION_WORKFLOW_ID];
    const regionAnalysis = inputData[analyzeScreenRegionsStep.id];
    const root = normalized.nodes[0];
    if (!root || regionAnalysis.regions.length === 0) {
      return [];
    }

    const assignments = assignNodesToRegions(root, regionAnalysis.regions);
    if (assignments.length === 0) {
      return [];
    }

    const { buffer } = await fetchChatImageBuffer(regionAnalysis.imageUrl);
    const tasks: RegionAnalysisTask[] = [];
    for (const assignment of assignments) {
      const crop = toCropRect(assignment.region, regionAnalysis.imageWidth, regionAnalysis.imageHeight);
      const cropped = await sharp(buffer)
        .extract({
          left: crop.x,
          top: crop.y,
          width: crop.width,
          height: crop.height
        })
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true
        })
        .jpeg({ quality: 88 })
        .toBuffer();

      tasks.push({
        regionIndex: assignment.regionIndex,
        region: assignment.region,
        croppedImageDataUrl: `data:image/jpeg;base64,${cropped.toString("base64")}`,
        nodes: assignment.nodes,
        candidates: assignment.candidates
      });
    }
    return tasks;
  }
});
