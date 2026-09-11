import { z } from "zod";

import { tokenUsageSchema } from "@/mastra/types";
import { normalizedNodeSchema } from "@/mastra/types/normalized-node-types";

export const semanticBoundsSchema = z.object({
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(1000),
  width: z.number().positive().max(1000),
  height: z.number().positive().max(1000)
});

export type SemanticBounds = z.infer<typeof semanticBoundsSchema>;

export const screenRegionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  bounds: semanticBoundsSchema,
  confidence: z.number().min(0).max(1)
});

export type ScreenRegion = z.infer<typeof screenRegionSchema>;

export const screenRegionAnalysisSchema = z.object({
  regions: z.array(screenRegionSchema).max(20)
});

export const screenRegionStepOutputSchema = z.object({
  imageUrl: z.string(),
  imageWidth: z.number().positive(),
  imageHeight: z.number().positive(),
  regions: z.array(screenRegionSchema),
  tokenUsage: tokenUsageSchema.optional(),
  error: z.string().optional()
});

export const regionCandidateSchema = z.object({
  index: z.number().int().nonnegative(),
  nodeId: z.string(),
  type: z.string(),
  name: z.string(),
  text: z.string().optional(),
  bounds: semanticBoundsSchema,
  zOrder: z.number().int().nonnegative()
});

export type RegionCandidate = z.infer<typeof regionCandidateSchema>;

export const regionAnalysisTaskSchema = z.object({
  regionIndex: z.number().int().nonnegative(),
  region: screenRegionSchema,
  croppedImageDataUrl: z.string(),
  nodes: z.array(normalizedNodeSchema),
  candidates: z.array(regionCandidateSchema)
});

export type RegionAnalysisTask = z.infer<typeof regionAnalysisTaskSchema>;

export const semanticGroupSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  memberIndexes: z.array(z.number().int().nonnegative()).min(2),
  confidence: z.number().min(0).max(1)
});

export type SemanticGroup = z.infer<typeof semanticGroupSchema>;

export const regionGroupAnalysisSchema = z.object({
  groups: z.array(semanticGroupSchema).max(30)
});

export const regionGroupResultSchema = z.object({
  regionIndex: z.number().int().nonnegative(),
  regionId: z.string(),
  success: z.boolean(),
  groups: z.array(semanticGroupSchema),
  tokenUsage: tokenUsageSchema.optional(),
  error: z.string().optional()
});

export type RegionGroupResult = z.infer<typeof regionGroupResultSchema>;
