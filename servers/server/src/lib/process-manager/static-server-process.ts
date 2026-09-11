import fs from "fs";
import * as path from "path";

import { ManagedProcess } from "./managed-process";
import type { ProcessConfig } from "./types";
import { ProcessStatus } from "./types";

/**
 * 静态服务器配置选项
 */
export interface StaticServerConfig extends ProcessConfig {
  /**
   * 静态资源目录路径
   */
  dir: string;

  /**
   * 服务器端口（0 表示随机分配）
   */
  port?: number;

  /**
   * 服务器主机名
   */
  host?: string;

  /**
   * URL 路径前缀（默认 '/'）
   */
  route?: string;

  /**
   * 是否启用 CORS
   */
  enableCORS?: boolean;

  /**
   * 自定义 headers
   */
  headers?: Record<string, string>;
}

/**
 * 静态服务器进程类
 *
 * 在独立 Worker 线程中运行 Express 静态服务器
 */
export class StaticServerProcess extends ManagedProcess {
  protected config: StaticServerConfig;
  private serverURL: string = "";
  private serverPort: number = 0;

  constructor(config: StaticServerConfig) {
    super(config);
    this.config = config;
  }

  /**
   * 获取 Worker 脚本文件路径
   */
  protected getWorkerScript(): string {
    // 生产环境：检查 dist 是否存在，不存在则使用开发包装器
    const distPath = path.resolve(
      process.cwd(),
      "dist",
      "lib",
      "process-manager",
      "workers",
      "static-server.worker.js"
    );

    if (fs.existsSync(distPath)) {
      return distPath;
    }

    // 开发环境：使用 .mjs 包装器加载 TypeScript worker
    const workerWrapper = path.resolve(
      process.cwd(),
      "src",
      "lib",
      "process-manager",
      "workers",
      "static-server.worker.wrapper.mjs"
    );

    return workerWrapper;
  }

  /**
   * 获取 Worker 初始化数据
   */
  protected getWorkerData(): any {
    return {
      dir: this.config.dir,
      port: this.config.port || 0,
      host: this.config.host || "localhost",
      route: this.config.route || "/",
      enableCORS: this.config.enableCORS || false,
      headers: this.config.headers || {}
    };
  }

  /**
   * 启动静态服务器
   */
  async start(): Promise<string> {
    await super.start();

    // 通过健康检查获取 URL
    const healthResponse = await this.sendMessage({
      type: "health-check"
    });

    if (healthResponse.payload && healthResponse.payload.healthy) {
      // 如果需要 URL，可以从启动响应中获取
      this.serverURL = "";
    }

    return this.serverURL;
  }

  /**
   * 获取服务器 URL
   */
  getURL(): string {
    return this.serverURL;
  }

  /**
   * 获取服务器端口
   */
  getPort(): number {
    return this.serverPort;
  }

  /**
   * 处理 Worker 消息（重写以捕获服务器 URL）
   */
  protected handleMessage(message: any): void {
    super.handleMessage(message);

    // 捕获服务器启动时的 URL
    if (message.type === "started" && message.payload) {
      this.serverURL = message.payload.url || "";
      this.serverPort = message.payload.port || 0;
    }
  }

  /**
   * 获取服务器地址信息
   */
  getAddress(): { port: number; host: string; url: string } | null {
    if (this.status !== ProcessStatus.RUNNING) {
      return null;
    }

    return {
      port: this.serverPort,
      host: this.config.host || "localhost",
      url: this.serverURL
    };
  }
}
