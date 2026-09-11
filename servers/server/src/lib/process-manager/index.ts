/**
 * 进程管理器模块
 *
 * 提供子进程管理功能，支持在独立 Worker 线程中运行静态资源服务器等任务
 */

// 导出类型定义
export * from "./types";

// 导出被管理进程基类
export { ManagedProcess } from "./managed-process";

// 导出静态服务器进程类
export { StaticServerProcess } from "./static-server-process";

// 导出进程管理器
export { ProcessManager } from "./process-manager";
