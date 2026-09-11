import { createStep } from "@mastra/core/workflows";
import { z } from "zod";

import { StepEnum } from "@/mastra/types";
import type { Data } from "@/mastra/types/codia";
import { outputSchema as normalizedLayoutOutputSchema } from "@/mastra/workflows/figma-to-bi/steps/normalize-layout-step";

import { convertCodiaToAtomicNormalizedNode } from "./codia-to-normalized";

const inputSchema = z.object({
  fileKey: z.string().optional(),
  data: z.custom<Data>()
});

export const codiaAtomicAdapterStep = createStep({
  id: StepEnum.CODIA_TO_ATOMIC_NORMALIZED,
  description: "解算 Codia 布局并展开其容器，输出待语义重建的原子 NormalizedNode",
  inputSchema,
  outputSchema: normalizedLayoutOutputSchema,
  execute: async ({ inputData }) => {
    if (!inputData?.data) {
      throw new Error("[CodiaAtomicAdapter] 缺少 Codia data 数据");
    }

    return {
      fileKey: inputData.fileKey,
      metadata: undefined,
      nodes: [await convertCodiaToAtomicNormalizedNode(inputData.data)]
    };
  }
});
