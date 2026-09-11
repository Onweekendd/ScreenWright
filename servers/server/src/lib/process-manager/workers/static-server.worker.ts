/**
 * 静态服务器 Worker
 *
 * 在独立线程中运行 Express 静态服务器
 */

import express from "express";
import mime from "mime";
import { parentPort, workerData } from "worker_threads";

interface Config {
  id: string;
  name: string;
  dir: string;
  port?: number;
  host?: string;
  route?: string;
  enableCORS?: boolean;
  headers?: Record<string, string>;
}

interface WorkerMessage {
  type: "start" | "stop" | "health-check" | "status";
  requestId?: string;
}

interface ServerInfo {
  url: string;
  port: number;
}

const config = workerData.config as Config;
let server: any = null;
let isRunning = false;
let serverInfo: ServerInfo | null = null;

/**
 * 创建 Express 应用
 */
function createApp(): express.Express {
  const app = express();

  // 配置 CORS
  if (config.enableCORS) {
    app.use((_req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      next();
    });
  }

  // 配置静态文件服务
  const staticRoute = config.route || "/";
  const staticMiddleware = express.static(config.dir, {
    setHeaders: (res, filePath) => {
      // 设置自定义 headers
      if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }

      // 设置正确的 Content-Type
      const mimeType = mime.getType(filePath);
      if (mimeType) {
        res.setHeader("Content-Type", mimeType);
      }
    }
  });

  app.use(staticRoute, staticMiddleware);

  // 健康检查端点
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      server: "static-server",
      processId: config.id,
      url: serverInfo?.url
    });
  });

  // 404 处理
  app.use((req, res) => {
    res.status(404).json({ error: "Not Found", path: req.path });
  });

  return app;
}

/**
 * 启动服务器
 */
async function startServer(): Promise<ServerInfo> {
  if (isRunning) {
    throw new Error("Server is already running");
  }

  const app = createApp();
  const port = config.port || 0; // 0 表示随机端口
  const host = config.host || "localhost";

  return new Promise((resolve, reject) => {
    server = app.listen(port, host, () => {
      const address = server.address();
      let url = "";
      let portNumber = 0;

      if (!address) {
        reject(new Error("Failed to get server address"));
        return;
      }

      if (typeof address === "string") {
        url = address;
      } else {
        portNumber = address.port;
        const hostAddress = address.address === "::" ? "localhost" : address.address;
        url = `http://${hostAddress}:${portNumber}`;
      }

      isRunning = true;
      serverInfo = { url, port: portNumber };

      console.log(`✅ 静态服务器已启动: ${url}`);
      console.log(`📁 服务目录: ${config.dir}`);

      resolve(serverInfo);
    });

    server.on("error", (err: Error) => {
      reject(err);
    });
  });
}

/**
 * 停止服务器
 */
async function stopServer(): Promise<void> {
  if (!server) {
    return;
  }

  if (!isRunning) {
    server = null;
    return;
  }

  return new Promise((resolve, reject) => {
    server.close((err: Error | undefined) => {
      if (err) {
        reject(err);
      } else {
        console.log("🛑 静态服务器已停止");
        isRunning = false;
        server = null;
        serverInfo = null;
        resolve();
      }
    });
  });
}

/**
 * 健康检查
 */
function healthCheck(): { healthy: boolean; url?: string } {
  return {
    healthy: isRunning,
    url: serverInfo?.url
  };
}

/**
 * 发送消息到主线程
 */
function postMessage(message: any): void {
  if (parentPort) {
    parentPort.postMessage(message);
  }
}

/**
 * 消息处理
 */
parentPort?.on("message", async (message: WorkerMessage) => {
  try {
    switch (message.type) {
      case "start":
        postMessage({
          type: "started",
          requestId: message.requestId,
          payload: await startServer()
        });
        postMessage({
          type: "status-changed",
          status: "running"
        });
        break;

      case "stop":
        await stopServer();
        postMessage({
          type: "stopped",
          requestId: message.requestId
        });
        postMessage({
          type: "status-changed",
          status: "stopped"
        });
        break;

      case "health-check":
        postMessage({
          type: "healthy",
          requestId: message.requestId,
          payload: healthCheck()
        });
        break;

      case "status":
        postMessage({
          type: "status",
          requestId: message.requestId,
          payload: { status: isRunning ? "running" : "stopped" }
        });
        break;

      default:
        postMessage({
          type: "error",
          requestId: message.requestId,
          error: `Unknown message type: ${(message as any).type}`
        });
    }
  } catch (error: any) {
    postMessage({
      type: "error",
      requestId: message.requestId,
      error: error.message
    });
  }
});

/**
 * 优雅退出
 */
process.on("SIGINT", async () => {
  await stopServer();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await stopServer();
  process.exit(0);
});
