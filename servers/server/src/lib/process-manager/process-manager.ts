import type { ManagedProcess } from "./managed-process";
import type { ProcessEvent, ProcessEventHandler, ProcessStats } from "./types";
import { ProcessStatus } from "./types";

/**
 * 进程管理器
 *
 * 负责管理多个子进程的生命周期
 */
export class ProcessManager {
  private processes: Map<string, ManagedProcess> = new Map();
  private eventHandlers: ProcessEventHandler[] = [];
  private isShuttingDown: boolean = false;

  constructor() {
    // 确保进程管理器在退出时清理所有进程
    this.setupGracefulShutdown();
  }

  /**
   * 注册进程
   */
  registerProcess(process: ManagedProcess): void {
    const { id } = process.getConfig();

    if (this.processes.has(id)) {
      throw new Error(`Process with id '${id}' is already registered`);
    }

    this.processes.set(id, process);

    // 转发进程事件
    process.on((event) => {
      this.emitEvent(event);
    });

    console.log(`✅ 进程已注册: ${id} (${process.getConfig().name})`);
  }

  /**
   * 注销进程
   */
  async unregisterProcess(processId: string): Promise<void> {
    const process = this.processes.get(processId);

    if (!process) {
      throw new Error(`Process '${processId}' not found`);
    }

    // 如果进程正在运行，先停止它
    if (process.getStatus() === ProcessStatus.RUNNING) {
      await this.stopProcess(processId);
    }

    this.processes.delete(processId);
    console.log(`❌ 进程已注销: ${processId}`);
  }

  /**
   * 启动进程
   */
  async startProcess(processId: string): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error("Process manager is shutting down");
    }

    const process = this.processes.get(processId);

    if (!process) {
      throw new Error(`Process '${processId}' not found`);
    }

    console.log(`🚀 正在启动进程: ${processId}`);
    await process.start();
    console.log(`✅ 进程已启动: ${processId}`);
  }

  /**
   * 停止进程
   */
  async stopProcess(processId: string): Promise<void> {
    const process = this.processes.get(processId);

    if (!process) {
      throw new Error(`Process '${processId}' not found`);
    }

    console.log(`🛑 正在停止进程: ${processId}`);
    await process.stop();
    console.log(`✅ 进程已停止: ${processId}`);
  }

  /**
   * 重启进程
   */
  async restartProcess(processId: string): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error("Process manager is shutting down");
    }

    const process = this.processes.get(processId);

    if (!process) {
      throw new Error(`Process '${processId}' not found`);
    }

    console.log(`🔄 正在重启进程: ${processId}`);
    await process.restart();
    console.log(`✅ 进程已重启: ${processId}`);
  }

  /**
   * 启动所有进程
   */
  async startAll(): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error("Process manager is shutting down");
    }

    console.log(`🚀 正在启动所有进程...`);

    const startPromises = Array.from(this.processes.values()).map(async (process) => {
      const { id } = process.getConfig();
      try {
        await process.start();
        console.log(`✅ 进程已启动: ${id}`);
      } catch (error) {
        console.error(`❌ 进程启动失败: ${id}`, error);
        throw error;
      }
    });

    await Promise.all(startPromises);
    console.log(`✅ 所有进程已启动`);
  }

  /**
   * 停止所有进程
   */
  async stopAll(): Promise<void> {
    console.log(`🛑 正在停止所有进程...`);

    const stopPromises = Array.from(this.processes.values()).map(async (process) => {
      const { id } = process.getConfig();
      try {
        await process.stop();
        console.log(`✅ 进程已停止: ${id}`);
      } catch (error) {
        console.error(`❌ 进程停止失败: ${id}`, error);
      }
    });

    await Promise.allSettled(stopPromises);
    console.log(`✅ 所有进程已停止`);
  }

  /**
   * 重启所有进程
   */
  async restartAll(): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error("Process manager is shutting down");
    }

    console.log(`🔄 正在重启所有进程...`);

    const restartPromises = Array.from(this.processes.values()).map(async (process) => {
      const { id } = process.getConfig();
      try {
        await process.restart();
        console.log(`✅ 进程已重启: ${id}`);
      } catch (error) {
        console.error(`❌ 进程重启失败: ${id}`, error);
        throw error;
      }
    });

    await Promise.all(restartPromises);
    console.log(`✅ 所有进程已重启`);
  }

  /**
   * 获取进程
   */
  getProcess(processId: string): ManagedProcess | undefined {
    return this.processes.get(processId);
  }

  /**
   * 获取所有进程
   */
  getAllProcesses(): ManagedProcess[] {
    return Array.from(this.processes.values());
  }

  /**
   * 获取所有进程ID
   */
  getProcessIds(): string[] {
    return Array.from(this.processes.keys());
  }

  /**
   * 检查进程是否存在
   */
  hasProcess(processId: string): boolean {
    return this.processes.has(processId);
  }

  /**
   * 获取进程数量
   */
  getProcessCount(): number {
    return this.processes.size;
  }

  /**
   * 获取所有进程的统计信息
   */
  getAllStats(): ProcessStats[] {
    return Array.from(this.processes.values()).map((process) => process.getStats());
  }

  /**
   * 获取运行中的进程
   */
  getRunningProcesses(): ManagedProcess[] {
    return Array.from(this.processes.values()).filter((process) => process.getStatus() === ProcessStatus.RUNNING);
  }

  /**
   * 获取运行中的进程数量
   */
  getRunningProcessCount(): number {
    return this.getRunningProcesses().length;
  }

  /**
   * 对所有进程执行健康检查
   */
  async healthCheckAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    const healthChecks = Array.from(this.processes.entries()).map(async ([processId, process]) => {
      try {
        const healthy = await process.healthCheck();
        results.set(processId, healthy);
      } catch (error) {
        results.set(processId, false);
      }
    });

    await Promise.all(healthChecks);
    return results;
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
   * 触发事件
   */
  private emitEvent(event: ProcessEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error("Error in event handler:", error);
      }
    });
  }

  /**
   * 设置优雅退出
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        return;
      }

      this.isShuttingDown = true;
      console.log(`\n${signal} received, shutting down gracefully...`);

      try {
        await this.stopAll();
        console.log("✅ All processes stopped successfully");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  }

  /**
   * 销毁进程管理器
   */
  async destroy(): Promise<void> {
    this.isShuttingDown = true;
    await this.stopAll();
    this.processes.clear();
    this.eventHandlers = [];
  }
}
