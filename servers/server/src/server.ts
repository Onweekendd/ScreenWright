import { createServer } from "node:http";

import { getRequestListener } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { MastraServer } from "@mastra/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

import { ArtifactAppPreviewProxy } from "./artifact-app/preview/local/artifact-app-preview-proxy";
import { fail } from "./lib/http/envelope";
import { mastra } from "./mastra/index";
import { encodedControlRelay } from "./mastra/realtime/encoded-control-relay";
import { initMastraRecordingBridge } from "./mastra/record/branch-resolver";
import { assetsRouter } from "./mastra/routes/assets.route";
import { blobRouter } from "./mastra/routes/blob.route";
import { dataSourceRouter } from "./mastra/routes/data-source.route";
import { customRoutes } from "./mastra/routes/index";
import { largeScreenRouter } from "./mastra/routes/large-screen.route";
import { layersRouter } from "./mastra/routes/layers.route";
import { miscRouter } from "./mastra/routes/misc.route";
import { moduleRouter } from "./mastra/routes/module.route";
import { onlineRouter } from "./mastra/routes/online.route";
import { userRouter } from "./mastra/routes/user.route";
import { versionRouter } from "./mastra/routes/version.route";
import { artifactAppPreviewManager } from "./mastra/runtime";
import { isLlmRecordingEnabled } from "./recording/exchange-record";
import { swaggerSpec } from "./swagger-spec";

const app = new Hono();

// 全局错误处理：把异常统一包装成前端期望的 BaseEntity 信封（用于 /user 与 /bi-system 回落路由）
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json(fail(null, error.message, error.status === 401 ? 401 : 500), error.status);
  }
  console.error("[Screenwright onError]", error);
  const message = error instanceof Error ? error.message : "服务器内部错误";
  return c.json(fail(null, message, 500), 500);
});

const corsAllowList = [process.env.CORS_ORIGIN ?? "http://localhost:5173", "http://localhost:3000"];

const isDevPrivateOrigin = (origin: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);

// Tauri 桌面外壳的 webview 源：Windows 为 http(s)://tauri.localhost，macOS/Linux 为 tauri://localhost
const isTauriOrigin = (origin: string) => /^(tauri:\/\/localhost|https?:\/\/tauri\.localhost)$/.test(origin);

app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin) {
        return null;
      }
      if (corsAllowList.includes(origin) || isDevPrivateOrigin(origin) || isTauriOrigin(origin)) {
        return origin;
      }
      return null;
    },
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Access-Token",
      "Version-Code",
      "X-Custom-Header",
      "Upgrade-Insecure-Requests",
      "x-mastra-dev-playground",
      "x-mastra-client-type"
    ],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
    credentials: true
  })
);

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
app.route("/", blobRouter); // → GET /blobs/<key> 静态素材，不鉴权

// 从 Java bi-backend 回落的顶层路由（保持原路径，前端改动最小）
app.route("/user", userRouter); // → /user/user/login 等
app.route("/bi-system", largeScreenRouter); // → /bi-system/largeScreen/list 等
app.route("/bi-system", moduleRouter); // → /bi-system/module/list 等
app.route("/bi-system", layersRouter); // → /bi-system/layers/* 等
app.route("/bi-system", dataSourceRouter); // → /bi-system/data/* 等
app.route("/bi-system", assetsRouter); // → /bi-system/minio/* 等
app.route("/bi-system", versionRouter); // → /bi-system/largeScreen/version/*、/largeScreen/publish
app.route("/bi-system", miscRouter); // → /bi-system/dict/info/:id（空兜底）
app.route("/online", onlineRouter); // → /online/layersAgg/save、/online/minioAgg/* 等

app.get("/swagger-spec", (c) => c.json(swaggerSpec));
app.get("/swagger", swaggerUI({ url: "/swagger-spec" }));

const port = Number(process.env.DEV_PORT) || 4111;
const previewProxy = new ArtifactAppPreviewProxy({ previewManager: artifactAppPreviewManager });
const honoRequestListener = getRequestListener(app.fetch);
const httpServer = createServer((request, response) => {
  if (previewProxy.matches(request.url)) {
    void previewProxy.handleRequest(request, response);
    return;
  }
  void honoRequestListener(request, response);
});

httpServer.on("upgrade", (request, socket, head) => {
  if (previewProxy.matches(request.url)) {
    void previewProxy.handleUpgrade(request, socket, head);
    return;
  }
  if (encodedControlRelay.matches(request.url)) {
    encodedControlRelay.handleUpgrade(request, socket, head);
    return;
  }
  socket.destroy();
});

httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

let shuttingDown = false;

async function shutdown(): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  await artifactAppPreviewManager.stopAll();
  previewProxy.close();
  encodedControlRelay.close();
  httpServer.close((error) => {
    if (error) {
      console.error("Failed to close Screenwright HTTP server", error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
