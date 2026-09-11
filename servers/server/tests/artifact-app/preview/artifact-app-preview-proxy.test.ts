import { createServer, type RequestListener, type Server } from "node:http";

import { afterEach, describe, expect, it, vi } from "vitest";

import { ArtifactAppPreviewProxy } from "@/artifact-app/preview/local/artifact-app-preview-proxy";
import type { PreviewManager } from "@/artifact-app/preview/preview-manager";

const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(closeServer));
});

describe("Artifact App 预览代理", () => {
  it("handleRequest：请求稳定预览路径时，应按 appId 启动预览并转发原始路径", async () => {
    // Arrange
    const targetServer = await startServer((_request, response) => {
      response.end("Vite page");
    });
    const targetAddress = targetServer.address();
    if (!targetAddress || typeof targetAddress === "string") {
      throw new Error("测试目标服务器没有分配端口");
    }
    const previewManager = createPreviewManager(targetAddress.port);
    const proxy = new ArtifactAppPreviewProxy({ previewManager });
    const proxyServer = await startServer((request, response) => void proxy.handleRequest(request, response));
    const proxyAddress = proxyServer.address();
    if (!proxyAddress || typeof proxyAddress === "string") {
      throw new Error("测试代理服务器没有分配端口");
    }

    // Act
    const response = await fetch(`http://127.0.0.1:${proxyAddress.port}/artifact-apps/app-001/`);

    // Assert
    await expect(response.text()).resolves.toBe("Vite page");
    expect(response.status).toBe(200);
    expect(previewManager.start).toHaveBeenCalledWith("app-001");
    proxy.close();
  });

  it("handleRequest：预览根路径缺少斜杠时，应保留查询参数并重定向", async () => {
    // Arrange
    const previewManager = createPreviewManager(43123);
    const proxy = new ArtifactAppPreviewProxy({ previewManager });
    const proxyServer = await startServer((request, response) => void proxy.handleRequest(request, response));
    const proxyAddress = proxyServer.address();
    if (!proxyAddress || typeof proxyAddress === "string") {
      throw new Error("测试代理服务器没有分配端口");
    }

    // Act
    const response = await fetch(`http://127.0.0.1:${proxyAddress.port}/artifact-apps/app-001?mode=dev`, {
      redirect: "manual"
    });

    // Assert
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("/artifact-apps/app-001/?mode=dev");
    expect(previewManager.start).not.toHaveBeenCalled();
    proxy.close();
  });
});

function createPreviewManager(port: number): PreviewManager {
  return {
    start: vi.fn(async (appId: string) => ({
      appId,
      port,
      publicPath: `/artifact-apps/${appId}/`,
      status: "running" as const
    })),
    get: vi.fn(),
    stop: vi.fn(async () => undefined),
    stopAll: vi.fn(async () => undefined)
  };
}

async function startServer(listener: RequestListener): Promise<Server> {
  const server = createServer(listener);
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return server;
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
