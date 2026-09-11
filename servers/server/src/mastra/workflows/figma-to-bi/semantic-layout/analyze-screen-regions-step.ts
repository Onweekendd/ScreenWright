import { createStep } from "@mastra/core/workflows";
import sharp from "sharp";
import { z } from "zod";

import { semanticLayoutAgent } from "@/mastra/agents/semantic-layout-agent";
import { fetchChatImageBuffer } from "@/mastra/services/chat-image.server";
import { StepEnum } from "@/mastra/types";

import { intersectionArea } from "./semantic-layout-geometry";
import { retrySemanticLayoutGenerate } from "./semantic-layout-retry";
import { screenRegionAnalysisSchema, screenRegionStepOutputSchema } from "./semantic-layout-types";

const MIN_REGION_CONFIDENCE = 0.65;
const MIN_REGION_AREA = 10_000;
const MAX_REGION_CONTAINMENT = 0.9;

type Region = z.infer<typeof screenRegionAnalysisSchema>["regions"][number];

/**
 * 物理结构只允许一级动态面板。模型若同时返回父区域和其中的子区域，
 * 优先保留更具体的小区域，移除几乎包含已有区域的大范围父区域。
 */
export const normalizeScreenRegions = (regions: Region[]): Region[] => {
  const valid = regions
    .filter((region) => {
      const right = region.bounds.x + region.bounds.width;
      const bottom = region.bounds.y + region.bounds.height;
      const area = region.bounds.width * region.bounds.height;
      return region.confidence >= MIN_REGION_CONFIDENCE && area >= MIN_REGION_AREA && right <= 1000 && bottom <= 1000;
    })
    .sort((a, b) => {
      const areaA = a.bounds.width * a.bounds.height;
      const areaB = b.bounds.width * b.bounds.height;
      return areaA - areaB || b.confidence - a.confidence;
    });

  const accepted: Region[] = [];
  for (const candidate of valid) {
    const containsAcceptedRegion = accepted.some((existing) => {
      const existingArea = existing.bounds.width * existing.bounds.height;
      return intersectionArea(candidate.bounds, existing.bounds) / existingArea >= MAX_REGION_CONTAINMENT;
    });
    if (!containsAcceptedRegion) {
      accepted.push(candidate);
    }
  }
  return accepted;
};

export const analyzeScreenRegionsStep = createStep({
  id: StepEnum.ANALYZE_SCREEN_REGIONS,
  description: "识别大屏设计稿中扁平的一级功能区域",
  inputSchema: z.object({
    imageUrl: z.string()
  }),
  outputSchema: screenRegionStepOutputSchema,
  execute: async ({ inputData }) => {
    const { imageUrl } = inputData;
    let imageWidth = 1;
    let imageHeight = 1;

    try {
      const { buffer, mime } = await fetchChatImageBuffer(imageUrl);
      const metadata = await sharp(buffer).metadata();
      imageWidth = metadata.width ?? 1;
      imageHeight = metadata.height ?? 1;
      const imageDataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

      const result = await retrySemanticLayoutGenerate("一级区域识别", () =>
        semanticLayoutAgent.generate(
          [
            {
              role: "user",
              content: [
                { type: "image", image: imageDataUrl },
                {
                  type: "text",
                  text: `
                        识别这张大屏设计稿中的一级大块功能区域。
                        
                        要求：
                        - 区域将用于创建动态面板，应覆盖主要内容块，但不要把整张画布作为单一区域。
                        - 只输出同一层级的区域，禁止嵌套。
                        - 全屏背景、跨区域装饰和纯留白不是区域。
                        - bounds 使用 0 到 1000 的归一化坐标。
                        - 相邻区域尽量不重叠。
                        - confidence 表示区域边界和功能判断的可信度。
                      `
                }
              ]
            }
          ],
          {
            structuredOutput: {
              schema: screenRegionAnalysisSchema,
              jsonPromptInjection: true
            }
          }
        )
      );

      const regions = normalizeScreenRegions(result.object.regions);

      return {
        imageUrl,
        imageWidth,
        imageHeight,
        regions
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[SemanticLayout] 一级区域识别失败，后续将降级为原子平铺: ${message}`);
      return {
        imageUrl,
        imageWidth,
        imageHeight,
        regions: [],
        error: message
      };
    }
  }
});
