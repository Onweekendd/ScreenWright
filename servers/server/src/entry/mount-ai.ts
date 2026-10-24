import type { Hono } from "hono";

import { authMiddleware } from "@/middleware/auth";

import type { RoleMount } from "./mount";

/**
 * ai 角色：对话 SSE、Mastra agent / workflow、artifact 沙箱预览。
 * Mastra 及其整棵依赖（agent、模型注册表、沙箱管理器）都用动态 import，
 * 这样 api / worker 进程根本不会加载它们。
 */
export async function mountAi(app: Hono): Promise<RoleMount> {
  const [
    { MastraServer },
    { mastra },
    { customRoutes },
    { artifactAppPreviewManager },
    { ArtifactAppPreviewProxy },
    { initMastraRecordingBridge },
    { isLlmRecordingEnabled },
    { closeImageQueueClient },
    { closeVideoQueueClient }
  ] = await Promise.all([
    import("@mastra/hono"),
    import("@/mastra/index"),
    import("@/mastra/routes/index"),
    import("@/mastra/runtime"),
    import("@/artifact-app/preview/local/artifact-app-preview-proxy"),
    import("@/mastra/record/branch-resolver"),
    import("@/recording/exchange-record"),
    import("@/queue/image-client"),
    import("@/queue/video-client")
  ]);

  // AI 接口与 Mastra 内置路由（/api/*）必须登录，否则任何人都能直接消耗模型额度。
  // 须在 server.init() 注册 Mastra 路由之前挂上，中间件才会排在它们前面。
  app.use("/customApi/*", authMiddleware);
  app.use("/api/*", authMiddleware);

  const server = new MastraServer({ app, mastra });

  if (isLlmRecordingEnabled()) {
    /**
     * 初始化 Mastra 录制桥接器，确保在录制模块中可以获取到当前执行的线程 ID。
     */
    initMastraRecordingBridge();
  }

  await server.init();
  await mastra.startWorkers(); // ← 启动 OrchestrationWorker + BackgroundTaskWorker,接上 "workflows" topic

  app.route("/", customRoutes);

  const previewProxy = new ArtifactAppPreviewProxy({ previewManager: artifactAppPreviewManager });

  return {
    handleRequest: (request, response) => {
      if (!previewProxy.matches(request.url)) {
        return false;
      }
      void previewProxy.handleRequest(request, response);
      return true;
    },
    handleUpgrade: (request, socket, head) => {
      if (!previewProxy.matches(request.url)) {
        return false;
      }
      void previewProxy.handleUpgrade(request, socket, head);
      return true;
    },
    close: async () => {
      await artifactAppPreviewManager.stopAll();
      previewProxy.close();
      await Promise.all([closeImageQueueClient(), closeVideoQueueClient()]);
    }
  };
}
