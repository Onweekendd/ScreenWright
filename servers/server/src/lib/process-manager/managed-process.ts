import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";

import type { ProcessConfig, ProcessEventHandler, ProcessMessage, ProcessResponse, ProcessStats } from "./types";
import { ProcessStatus } from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 解析 tsx 模块路径
 */
async function resolveTsxPath(): Promise<string> {
  try {
    // 尝试解析 tsx 模块
    const tsxPath = resolve(__dirname, "../../../node_modules/tsx/esm/index.mjs");
    return tsxPath;
  } catch {
    // 回退到相对路径
    return "tsx";
  }
}

/**
 * 被管理进程基类
 *
 * 提供进程生命周期管理、消息通信、事件处理等核心功能
 */
export abstract class ManagedProcess {
  protected status: ProcessStatus;
  protected worker: Worker | null = null;
  protected config: ProcessConfig;
  protected eventHandlers: ProcessEventHandler[] = [];
  protected startTime: number | null = null;
  protected restartCount: number = 0;
  protected lastError: Error | null = null;
  protected lastRestartTime: number | null = null;
  protected pendingRequests: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = new Map();

  constructor(config: ProcessConfig) {
    this.config = config;
    this.status = ProcessStatus.IDLE;
  }

  /**
   * 抽象方法：子类必须实现 Worker 脚本代码
   */
  protected abstract getWorkerScript(): string;

  /**
   * 抽象方法：子类可以自定义 Worker 初始化数据
   */
  protected getWorkerData(): any {
    return {};
  }

  /**
   * 启动进程
   */
  async start(): Promise<any> {
    if (this.status === ProcessStatus.RUNNING || this.status === ProcessStatus.STARTING) {
      throw new Error(`Process ${this.config.id} is already running or starting`);
    }

    this.updateStatus(ProcessStatus.STARTING);
    this.emitEvent({
      type: "starting",
      processId: this.config.id,
      processName: this.config.name,
      timestamp: Date.now()
    });

    try {
      // 创建 Worker（子类通过 getWorkerScript() 返回文件路径）
      const workerScript = this.getWorkerScript();
      const isFilePath =
        workerScript.endsWith(".js") ||
        workerScript.endsWith(".ts") ||
        workerScript.endsWith(".mjs") ||
        workerScript.endsWith(".cjs");

      // 对于 .ts 文件，使用 tsx 包装器
      let actualWorkerScript = workerScript;
      const workerOptions: any = {
        eval: !isFilePath, // 如果是文件路径则不使用 eval
        workerData: {
          ...this.getWorkerData(),
          config: this.config
        }
      };

      if (workerScript.endsWith(".ts")) {
        // 使用 tsx 加载 TypeScript 文件
        // 创建一个包装脚本来使用 tsx 注册器
        const tsxLoaderPath = await resolveTsxPath();
        actualWorkerScript = `
          import { register } from '${tsxLoaderPath}';
          register();
          await import('${workerScript.replace(/\\/g, "/")}');
        `;
        workerOptions.eval = true;
      }

      this.worker = new Worker(actualWorkerScript, workerOptions);

      // 设置消息处理器
      this.worker.on("message", this.handleMessage.bind(this));
      this.worker.on("error", this.handleError.bind(this));
      this.worker.on("exit", this.handleExit.bind(this));

      // 发送启动消息
      await this.sendMessage({
        type: "start"
      });

      // 等待 Worker 确认启动
      await this.waitForStatus(ProcessStatus.RUNNING, 30000);

      this.startTime = Date.now();
      this.updateStatus(ProcessStatus.RUNNING);
      this.emitEvent({
        type: "started",
        processId: this.config.id,
        processName: this.config.name,
        timestamp: Date.now()
      });
    } catch (error) {
      this.updateStatus(ProcessStatus.ERROR);
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * 停止进程
   */
  async stop(): Promise<void> {
    if (this.status === ProcessStatus.STOPPED || this.status === ProcessStatus.IDLE) {
      return;
    }

    this.updateStatus(ProcessStatus.STOPPING);
    this.emitEvent({
      type: "stopping",
      processId: this.config.id,
      processName: this.config.name,
      timestamp: Date.now()
    });

    try {
      if (this.worker) {
        // 发送停止消息
        await this.sendMessage({
          type: "stop"
        });

        // 等待 Worker 退出
        await this.waitForWorkerExit(10000);

        // 如果还没退出，强制终止
        if (this.worker) {
          await this.worker.terminate();
        }
      }

      this.cleanup();
      this.updateStatus(ProcessStatus.STOPPED);
      this.emitEvent({
        type: "stopped",
        processId: this.config.id,
        processName: this.config.name,
        timestamp: Date.now()
      });
    } catch (error) {
      this.cleanup();
      this.updateStatus(ProcessStatus.ERROR);
      throw error;
    }
  }

  /**
   * 重启进程
   */
  async restart(): Promise<void> {
    const wasRunning = this.status === ProcessStatus.RUNNING;

    if (wasRunning) {
      await this.stop();
    }

    await this.start();

    if (wasRunning) {
      this.restartCount++;
      this.lastRestartTime = Date.now();
      this.emitEvent({
        type: "restarted",
        processId: this.config.id,
        processName: this.config.name,
        timestamp: Date.now(),
        data: {
          restartCount: this.restartCount
        }
      });
    }
  }

  /**
   * 获取进程状态
   */
  getStatus(): ProcessStatus {
    return this.status;
  }

  /**
   * 获取进程配置
   */
  getConfig(): ProcessConfig {
    return { ...this.config };
  }

  /**
   * 获取进程统计信息
   */
  getStats(): ProcessStats {
    return {
      id: this.config.id,
      name: this.config.name,
      status: this.status,
      startTime: this.startTime || undefined,
      uptime: this.startTime ? Date.now() - this.startTime : undefined,
      restartCount: this.restartCount,
      lastError: this.lastError || undefined,
      lastRestartTime: this.lastRestartTime || undefined
    };
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    if (this.status !== ProcessStatus.RUNNING || !this.worker) {
      return false;
    }

    try {
      const response = await this.sendMessage({
        type: "health-check"
      });

      return response.payload?.healthy === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 发送消息到 Worker
   */
  async sendMessage(message: ProcessMessage, timeout: number = 30000): Promise<ProcessResponse> {
    if (!this.worker) {
      throw new Error(`Worker for process ${this.config.id} is not available`);
    }

    const requestId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      // 设置超时
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Message timeout after ${timeout}ms`));
      }, timeout);

      // 存储待处理的请求
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle
      });

      // 发送消息
      this.worker!.postMessage({
        ...message,
        requestId
      });
    });
  }

  /**
   * 发送消息（不需要响应）
   */
  postMessage(message: ProcessMessage): void {
    if (!this.worker) {
      throw new Error(`Worker for process ${this.config.id} is not available`);
    }

    this.worker.postMessage(message);
  }

  /**
   * 添加事件监听器
   */
  on(eventHandler: ProcessEventHandler): void {
    this.eventHandlers.push(eventHandler);
  }

  /**
   * 移除事件监听器
   */
  off(eventHandler: ProcessEventHandler): void {
    const index = this.eventHandlers.indexOf(eventHandler);
    if (index !== -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  /**
   * 处理 Worker 消息
   */
  protected handleMessage(message: any): void {
    // 处理响应消息
    if (message.requestId && this.pendingRequests.has(message.requestId)) {
      const { resolve, timeout } = this.pendingRequests.get(message.requestId)!;
      clearTimeout(timeout);
      this.pendingRequests.delete(message.requestId);
      resolve(message);
      return;
    }

    // 处理状态变化消息
    if (message.type === "status-changed") {
      this.updateStatus(message.status);
    }
  }

  /**
   * 处理 Worker 错误
   */
  protected handleError(error: Error): void {
    this.lastError = error;
    this.updateStatus(ProcessStatus.ERROR);

    this.emitEvent({
      type: "error",
      processId: this.config.id,
      processName: this.config.name,
      timestamp: Date.now(),
      data: {
        error: error.message,
        stack: error.stack
      }
    });

    // 自动重启逻辑
    if (this.config.autoRestart) {
      const maxAttempts = this.config.maxRestartAttempts ?? -1;
      if (maxAttempts === -1 || this.restartCount < maxAttempts) {
        const delay = this.config.restartDelay ?? 1000;
        setTimeout(() => {
          this.restart().catch((err) => {
            console.error(`Failed to restart process ${this.config.id}:`, err);
          });
        }, delay);
      }
    }
  }

  /**
   * 处理 Worker 退出
   */
  protected handleExit(exitCode: number | null): void {
    if (this.status === ProcessStatus.RUNNING) {
      const error = new Error(`Worker exited with code ${exitCode}`);
      this.handleError(error);
    }
  }

  /**
   * 更新状态
   */
  protected updateStatus(status: ProcessStatus): void {
    const oldStatus = this.status;
    this.status = status;

    if (oldStatus !== status) {
      this.emitEvent({
        type: "status-changed",
        processId: this.config.id,
        processName: this.config.name,
        timestamp: Date.now(),
        data: {
          oldStatus,
          newStatus: status
        }
      });
    }
  }

  /**
   * 触发事件
   */
  protected emitEvent(event: any): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error("Error in event handler:", error);
      }
    });
  }

  /**
   * 等待状态变化
   */
  protected async waitForStatus(expectedStatus: ProcessStatus, timeout: number = 30000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (this.status === expectedStatus) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(`Timeout waiting for status ${expectedStatus}`);
  }

  /**
   * 等待 Worker 退出
   */
  protected async waitForWorkerExit(timeout: number = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (!this.worker) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * 清理资源
   */
  protected cleanup(): void {
    // 清理所有待处理的请求
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error("Process stopped"));
    });
    this.pendingRequests.clear();

    // 清理 Worker
    if (this.worker) {
      this.worker.removeAllListeners();
      this.worker = null;
    }

    this.startTime = null;
  }

  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return `${this.config.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
