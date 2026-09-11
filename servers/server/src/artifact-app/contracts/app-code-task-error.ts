export enum AppCodeTaskError {
  /**
   * 任务不存在
   */
  TASK_NOT_FOUND = "TASK_NOT_FOUND",

  /**
   * 任务已被认领
   */
  TASK_ALREADY_CLAIMED = "TASK_ALREADY_CLAIMED",

  /**
   * 任务被阻止
   */
  TASK_BLOCKED = "TASK_BLOCKED",

  /**
   * 任务类型无效
   */
  INVALID_TASK_KIND = "INVALID_TASK_KIND",

  /**
   * 任务元数据无效
   */
  INVALID_TASK_METADATA = "INVALID_TASK_METADATA",

  /**
   * 应用不存在
   */
  APP_NOT_FOUND = "APP_NOT_FOUND",

  /**
   * 沙箱不可用
   */
  SANDBOX_UNAVAILABLE = "SANDBOX_UNAVAILABLE",

  /**
   * 代理会话失败
   */
  AGENT_SESSION_FAILED = "AGENT_SESSION_FAILED",
  /**
   * 代理执行失败
   */
  AGENT_EXECUTION_FAILED = "AGENT_EXECUTION_FAILED",
  /**
   * 任务已在运行
   */
  TASK_ALREADY_RUNNING = "TASK_ALREADY_RUNNING",

  /** 任务已经完成，不能重复启动。 */
  TASK_ALREADY_COMPLETED = "TASK_ALREADY_COMPLETED",

  /** 任务已经取消，必须明确重新开启后才能执行。 */
  TASK_CANCELLED = "TASK_CANCELLED",

  /** TaskIdentifier 未通过运行时校验。 */
  INVALID_TASK_IDENTIFIER = "INVALID_TASK_IDENTIFIER",

  /** 同一个 App 已有其他写任务占用。 */
  APP_WRITE_CONFLICT = "APP_WRITE_CONFLICT",

  /** 创建、切换、检查点或提交任务分支失败。 */
  TASK_BRANCH_FAILED = "TASK_BRANCH_FAILED"
}
