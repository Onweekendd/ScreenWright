/**
 * 进程状态枚举
 */
export enum ProcessStatus {
  IDLE = "idle",
  STARTING = "starting",
  RUNNING = "running",
  STOPPING = "stopping",
  STOPPED = "stopped",
  ERROR = "error"
}

/**
 * 进程配置接口
 */
export interface ProcessConfig {
  /**
   * 进程唯一标识符
   */
  id: string;

  /**
   * 进程名称
   */
  name: string;

  /**
   * 是否自动重启（当进程意外退出时）
   */
  autoRestart?: boolean;

  /**
   * 重启延迟（毫秒）
   */
  restartDelay?: number;

  /**
   * 最大重启次数（-1 表示无限）
   */
  maxRestartAttempts?: number;
}

/**
 * 进程消息类型
 */
export interface ProcessMessage {
  type: "start" | "stop" | "status" | "health-check" | "custom";
  payload?: any;
  requestId?: string;
}

/**
 * 进程响应类型
 */
export interface ProcessResponse {
  type: "started" | "stopped" | "status" | "healthy" | "error" | "custom";
  payload?: any;
  requestId?: string;
  error?: string;
}

/**
 * 进程事件类型
 */
export interface ProcessEvent {
  type: "starting" | "started" | "stopping" | "stopped" | "error" | "status-changed" | "restarted";
  processId: string;
  processName: string;
  timestamp: number;
  data?: any;
}

/**
 * 进程统计信息
 */
export interface ProcessStats {
  id: string;
  name: string;
  status: ProcessStatus;
  startTime?: number;
  uptime?: number;
  restartCount: number;
  lastError?: Error;
  lastRestartTime?: number;
}

/**
 * 进程事件处理器类型
 */
export type ProcessEventHandler = (event: ProcessEvent) => void;

/**
 * Worker 数据接口
 */
export interface WorkerData {
  config: any;
  workerScript: string;
}
