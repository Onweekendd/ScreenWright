import { createStep } from "@mastra/core/workflows";

import { StepEnum } from "@/mastra/types";
import type { FigmaFileType } from "@/mastra/types/figma-type";
import { figmaFileSchema } from "@/mastra/types/figma-type";

import { DataProcessor } from "./data-processor";

/**
 * 数据预处理步骤
 *
 * 功能：
 * 1. 处理多状态节点（-status）下的 -merge 合并
 * 2. 清空 -image 节点的子节点
 * 3. 跨 frame 的 -subtab 节点去重，只保留一个为公共节点
 * 4. -panel 跨 frame 找到对应的 -panel 后，如果两个 -panel 的结构一致且含有同名 -panel 的子节点，则需要嵌套合并
 *
 * 输入：FigmaFileType - 原始 Figma 文件数据
 * 输出：FigmaFileType - 预处理后的 Figma 文件数据
 */
export const dataProcessorStep = createStep({
  id: StepEnum.DATA_PROCESSOR,
  description: "数据预处理：处理多状态节点、面板合并、跨 frame 去重、清空图片节点子节点",
  inputSchema: figmaFileSchema.describe("原始 Figma 文件数据"),
  outputSchema: figmaFileSchema.describe("预处理后的 Figma 文件数据"),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }

    console.log("[DataProcessorStep] 开始数据预处理");

    // 创建 DataProcessor 实例
    const processor = new DataProcessor(inputData as FigmaFileType);

    if (!processor.root) {
      throw new Error("根节点数据为空");
    }

    // 执行预处理
    processor.startProcessNode();

    // 获取处理后的完整数据
    const processedData = processor.assembleFullFigmaData();

    console.log("[DataProcessorStep] 数据预处理完成");
    console.log(`[DataProcessorStep] 根节点: ${processedData.nodes[0]?.name}`);
    console.log(`[DataProcessorStep] 全局样式: ${Object.keys(processedData.globalVars?.styles || {}).length} 个`);

    return processedData as FigmaFileType;
  }
});
