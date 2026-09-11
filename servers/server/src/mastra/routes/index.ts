import { Hono } from "hono";

import { aiModelRouter } from "./ai-model.route";
import { biChatRouter } from "./bi-chat.route";
import { biDataSyncRouter } from "./bi-data-sync.route";
import { chatImageRouter } from "./chat-image.route";
import { evalRouter } from "./eval.route";
import { figmaNodeAssetRouter } from "./figma-node-asset.route";
import { llmExchangeRouter } from "./llm-exchange.route";
import { modelCapabilityRouter } from "./model-capability.route";
import { swaggerRegistryRouter } from "./swagger-registry.route";

export const customRoutes = new Hono()
  .route("/customApi/bi-chat", biChatRouter)
  .route("/customApi/chat-images", chatImageRouter)
  .route("/customApi", biDataSyncRouter)
  .route("/customApi/figma-node-assets", figmaNodeAssetRouter)
  .route("/customApi/llm-exchanges", llmExchangeRouter)
  .route("/customApi/evals", evalRouter)
  .route("/customApi", modelCapabilityRouter)
  .route("/customApi", aiModelRouter)
  .route("/customApi/datasource", swaggerRegistryRouter);

export type AppType = typeof customRoutes;
