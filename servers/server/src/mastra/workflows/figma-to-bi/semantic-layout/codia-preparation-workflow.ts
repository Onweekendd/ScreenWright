import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { codiaAtomicAdapterStep } from "@/mastra/workflows/figma-to-bi/adapters/codia-atomic-adapter-step";
import { codiaImageToDesignStep } from "@/mastra/workflows/figma-to-bi/adapters/codia-image-to-design-step";
import { codiaUploadImagesStep } from "@/mastra/workflows/figma-to-bi/adapters/codia-upload-images-step";
import { outputSchema as normalizedLayoutOutputSchema } from "@/mastra/workflows/figma-to-bi/steps/normalize-layout-step";

export const CODIA_PREPARATION_WORKFLOW_ID = "prepare-codia-atomic-nodes";

/**
 * 可作为父 workflow 并发分支运行的 Codia 子工作流。
 */
export const codiaPreparationWorkflow = createWorkflow({
  id: CODIA_PREPARATION_WORKFLOW_ID,
  inputSchema: z.object({ imageUrl: z.string() }),
  outputSchema: normalizedLayoutOutputSchema
})
  .then(codiaImageToDesignStep)
  .then(codiaUploadImagesStep)
  .then(codiaAtomicAdapterStep)
  .commit();
