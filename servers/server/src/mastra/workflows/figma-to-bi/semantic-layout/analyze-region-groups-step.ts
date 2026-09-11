import { createStep } from "@mastra/core/workflows";

import { semanticLayoutAgent } from "@/mastra/agents/semantic-layout-agent";
import { StepEnum } from "@/mastra/types";

import { retrySemanticLayoutGenerate } from "./semantic-layout-retry";
import { regionAnalysisTaskSchema, regionGroupAnalysisSchema, regionGroupResultSchema } from "./semantic-layout-types";

export const analyzeRegionGroupsStep = createStep({
  id: StepEnum.ANALYZE_REGION_GROUPS,
  description: "识别单个一级区域内部的一层功能分组；由 workflow foreach 控制区域并发",
  inputSchema: regionAnalysisTaskSchema,
  outputSchema: regionGroupResultSchema,
  execute: async ({ inputData }) => {
    const { region, regionIndex, croppedImageDataUrl, candidates } = inputData;
    if (candidates.length < 2) {
      return {
        regionIndex,
        regionId: region.id,
        success: true,
        groups: []
      };
    }

    try {
      const candidateJson = JSON.stringify(
        candidates.map(({ index, type, name, text, bounds, zOrder }) => ({
          index,
          type,
          name,
          text,
          bounds,
          zOrder
        }))
      );

      const result = await retrySemanticLayoutGenerate(`区域 ${region.id} 分组识别`, () =>
        semanticLayoutAgent.generate(
          [
            {
              role: "user",
              content: [
                { type: "image", image: croppedImageDataUrl },
                {
                  type: "text",
                  text: `
                        分析区域“${region.name}”（功能：${region.role}）内部需要共同维护的一层功能分组。
                                      
                        候选节点：
                        ${candidateJson}
                                      
                        要求：
                        - memberIndexes 只能引用候选节点中真实存在的 index。
                        - Group 只能包含原子节点，禁止 Group 嵌套。
                        - 典型分组包括：标题背景+标题文字、指标名称+数值+单位、筛选框内部元素、图例符号+图例文字。
                        - 单个节点不要建组；每组至少两个节点。
                        - 大面积区域背景、跨多个功能块的装饰不能和局部内容组成 Group。
                        - 同一个节点不要出现在多个分组。
                        - 不确定时不要分组。
                      `
                }
              ]
            }
          ],
          {
            structuredOutput: {
              schema: regionGroupAnalysisSchema,
              jsonPromptInjection: true
            }
          }
        )
      );

      return {
        regionIndex,
        regionId: region.id,
        success: true,
        groups: result.object.groups
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[SemanticLayout] 区域 ${region.id} 分组识别失败，区域内部将保持平铺: ${message}`);
      return {
        regionIndex,
        regionId: region.id,
        success: false,
        groups: [],
        error: message
      };
    }
  }
});
