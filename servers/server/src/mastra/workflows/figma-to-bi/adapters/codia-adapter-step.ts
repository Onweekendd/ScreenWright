import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { StepEnum } from "@/mastra/types";
import type { Data } from "@/mastra/types/codia";

import { outputSchema as normalizedLayoutOutputSchema } from "../steps/normalize-layout-step";
import { convertCodiaToNormalizedNode } from "./codia-to-normalized";

/**
 * Codia 适配步骤
 *
 * 输入 Codia image_to_design 接口响应的 data 部分，产出与 normalizeLayoutStep 完全一致的
 * 输出形状（{ fileKey?, metadata?, nodes: NormalizedNode[] }），从而直接对接 bfsTraversalStep，
 * 跳过 fetchFigma / dataProcessor / resolveStyles / normalizeLayout 这几个 Figma 专属步骤。
 *
 * 布局解算细节见 ./codia-to-normalized.ts。
 */

// Codia data 结构未在运行时用 zod 校验（codia.ts 只给了 TS interface），
// 这里用 z.custom 透传，具体字段约束交由 TS 类型保证。
const inputSchema = z.object({
  fileKey: z.string().optional().describe("可选来源标识，透传给下游"),
  data: z.custom<Data>().describe("Codia image_to_design 响应的 data 部分")
});

export const codiaAdapterStep = createStep({
  id: StepEnum.CODIA_TO_NORMALIZED,
  description: "将 Codia VisualElement Schema 适配为 NormalizedNode 树",
  inputSchema,
  outputSchema: normalizedLayoutOutputSchema,
  execute: async ({ inputData }) => {
    if (!inputData?.data) {
      throw new Error("[CodiaAdapter] 缺少 Codia data 数据");
    }

    const root = await convertCodiaToNormalizedNode(inputData.data);

    return {
      fileKey: inputData.fileKey,
      metadata: undefined,
      nodes: [root]
    };
  }
});
