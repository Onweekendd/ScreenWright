import type { ArtifactAppPiAgentRunner, PiAgentRunnerSession } from "@/artifact-app/agent/pi-agent-runner";
import type { ArtifactAppPiSessionFactory } from "@/artifact-app/agent/sessions/pi-session-factory";
import {
  type AppCodeExecutionResult,
  type AppCodeTask,
  AppCodeTaskError,
  AppCodeTaskSchema,
  ARTIFACT_APP_CODE_TASK_KIND,
  createFailedResult,
  getTaskAppId,
  getTaskKind,
  parseAppCodeTask
} from "@/artifact-app/contracts";
import type { AppSandbox } from "@/artifact-app/sandbox/app-sandbox";
import { SandboxAcquisitionError, type SandboxManager } from "@/artifact-app/sandbox/sandbox-manager";
import { getErrorMessage } from "@/artifact-app/shared/error-message";
import { type Task, type TaskIdentifier, TaskIdentifierSchema, TaskManager } from "@/task-management";

import {
  buildTaskBranchName,
  commitTaskBranchChanges,
  prepareTaskBranch,
  readCurrentBranchName
} from "./app-task-branch";
import type { InMemoryAppWriteLock } from "./app-write-lock";

/** 认领与执行 Artifact App 编码任务时使用的固定执行者标识，用于任务归属判断和中断恢复。 */
const ARTIFACT_APP_EXECUTOR_ID = "artifact-app-pi";

/** 进程意外中止的任务被恢复为可重试状态时写入 lastError 的提示信息。 */
const INTERRUPTED_EXECUTION_MESSAGE = "上一次执行意外中止，已恢复为可重试状态";

/** 构造 ArtifactAppService 所需的全部依赖。 */
export interface ArtifactAppServiceOptions {
  /** TaskManager 使用的任务存储根目录，例如共享 Workspace 下的 tasks 目录。 */
  taskStorageRoot: string;
  /** 负责按 appId 获取和释放 App 沙箱的管理器。 */
  sandboxManager: SandboxManager;
  /** 用于创建或复用 Pi Agent 会话的工厂。 */
  piSessionFactory: ArtifactAppPiSessionFactory;
  /** 实际驱动 Pi Agent 执行任务的运行器。 */
  piAgentRunner: ArtifactAppPiAgentRunner;
  /** 限制同一 App 同时只允许一个写任务的进程内写锁。 */
  appWriteLock: InMemoryAppWriteLock;
}

/** 任务认领成功时携带的已完成 schema 校验的编码任务。 */
interface ClaimedAppCodeTask {
  task: AppCodeTask;
}

/** 任务认领失败时返回给调用方的失败执行结果。 */
interface ClaimAppCodeTaskFailure {
  failure: AppCodeExecutionResult;
}

/** claimAppCodeTask 的联合返回类型：成功为已认领任务，失败为失败执行结果。 */
type ClaimAppCodeTaskResult = ClaimedAppCodeTask | ClaimAppCodeTaskFailure;

/** 执行已认领任务所需的任务管理器与任务定位信息。 */
interface TaskExecutionInput {
  taskManager: TaskManager;
  taskIdentifier: TaskIdentifier;
  task: AppCodeTask;
}

/** 在沙箱内执行任务时，在 {@link TaskExecutionInput} 基础上额外携带的沙箱实例。 */
interface SandboxTaskExecutionInput extends TaskExecutionInput {
  sandbox: AppSandbox;
}

/** 编排 Artifact App 编码任务的认领、工作区准备、Pi 执行和状态回写。 */
export class ArtifactAppService {
  private readonly taskStorageRoot: string;
  private readonly sandboxManager: SandboxManager;
  private readonly piSessionFactory: ArtifactAppPiSessionFactory;
  private readonly piAgentRunner: ArtifactAppPiAgentRunner;
  private readonly appWriteLock: InMemoryAppWriteLock;
  private readonly activeExecutions = new Map<string, Promise<AppCodeExecutionResult>>();

  constructor(options: ArtifactAppServiceOptions) {
    if (!options.taskStorageRoot.trim()) {
      throw new Error("taskStorageRoot 不能为空");
    }

    this.taskStorageRoot = options.taskStorageRoot;
    this.sandboxManager = options.sandboxManager;
    this.piSessionFactory = options.piSessionFactory;
    this.piAgentRunner = options.piAgentRunner;
    this.appWriteLock = options.appWriteLock;
  }

  /**
   * 执行或重试一个 Artifact App 编码任务。
   *
   * 相同 TaskIdentifier 在当前进程中只能存在一个活跃执行。失败任务复用原任务、
   * 原分支和原 Session；completed 或 cancelled 任务不会再次启动 Pi。
   *
   * @param taskIdentifier 要执行的任务列表 ID 与任务 ID。
   * @returns Pi Agent 的执行结果；任务无效、已在执行或编排失败时返回对应的失败结果。
   */
  async executeCodeTask(taskIdentifier: TaskIdentifier): Promise<AppCodeExecutionResult> {
    const parsedIdentifier = TaskIdentifierSchema.safeParse(taskIdentifier);
    if (!parsedIdentifier.success) {
      return createFailedResult({
        taskIdentifier,
        code: AppCodeTaskError.INVALID_TASK_IDENTIFIER,
        message: "TaskIdentifier 无效"
      });
    }

    const validatedTaskIdentifier = parsedIdentifier.data;
    const executionKey = createExecutionKey(validatedTaskIdentifier);
    if (this.activeExecutions.has(executionKey)) {
      return createFailedResult({
        taskIdentifier: validatedTaskIdentifier,
        code: AppCodeTaskError.TASK_ALREADY_RUNNING,
        message: "任务已经在当前进程中执行"
      });
    }

    const execution = this.executeValidatedTask(validatedTaskIdentifier);
    this.activeExecutions.set(executionKey, execution);

    try {
      return await execution;
    } finally {
      if (this.activeExecutions.get(executionKey) === execution) {
        this.activeExecutions.delete(executionKey);
      }
    }
  }

  /**
   * 执行已通过 schema 校验的任务。
   *
   * 依次完成中断任务恢复、任务认领和 App 写锁获取，拿到锁后才进入沙箱执行，
   * 写锁在执行结束后必然释放。
   */
  private async executeValidatedTask(taskIdentifier: TaskIdentifier): Promise<AppCodeExecutionResult> {
    const taskManager = this.createTaskManager(taskIdentifier.taskListId);
    await this.markInterruptedTasksFailed({ taskManager, currentTaskIdentifier: taskIdentifier });
    const claimResult = await this.claimAppCodeTask({ taskManager, taskIdentifier });

    if (isClaimFailure(claimResult)) {
      return claimResult.failure;
    }

    const { task } = claimResult;
    const releaseWriteLock = this.appWriteLock.tryAcquire(task.metadata.appId);
    if (!releaseWriteLock) {
      const message = `App ${task.metadata.appId} 已有写任务正在执行`;
      await markTaskFailed({ taskManager, taskId: task.id, message });
      return createFailedResult({
        taskIdentifier,
        appId: task.metadata.appId,
        code: AppCodeTaskError.APP_WRITE_CONFLICT,
        message
      });
    }

    try {
      return await this.executeClaimedTask({ taskManager, taskIdentifier, task });
    } finally {
      releaseWriteLock();
    }
  }

  /**
   * 认领任务并完成类型与 metadata 校验。
   *
   * @returns 校验通过时返回已认领的编码任务；认领失败或校验不通过时返回失败执行结果，
   * 且校验不通过的任务会被直接标记为 failed。
   */
  private async claimAppCodeTask(input: {
    taskManager: TaskManager;
    taskIdentifier: TaskIdentifier;
  }): Promise<ClaimAppCodeTaskResult> {
    const { taskManager, taskIdentifier } = input;
    const claim = await taskManager.claimTask({
      taskId: taskIdentifier.taskId,
      claimantAgentId: ARTIFACT_APP_EXECUTOR_ID
    });

    if (!claim.success) {
      return { failure: createClaimFailure(taskIdentifier, claim) };
    }

    const parsedTask = AppCodeTaskSchema.safeParse(claim.task);
    if (parsedTask.success) {
      return { task: parsedTask.data };
    }

    const code =
      getTaskKind(claim.task) === ARTIFACT_APP_CODE_TASK_KIND
        ? AppCodeTaskError.INVALID_TASK_METADATA
        : AppCodeTaskError.INVALID_TASK_KIND;
    const message =
      code === AppCodeTaskError.INVALID_TASK_KIND ? "任务类型不是 Artifact App 编码任务" : "任务 metadata 无效";
    await markTaskFailed({ taskManager, taskId: taskIdentifier.taskId, message });
    return { failure: createFailedResult({ taskIdentifier, code, message }) };
  }

  /**
   * 为已认领任务获取沙箱并在其中执行。
   *
   * 沙箱获取失败时任务标记为 failed；无论执行结果如何，沙箱最终都会被释放。
   */
  private async executeClaimedTask(input: TaskExecutionInput): Promise<AppCodeExecutionResult> {
    const { taskManager, taskIdentifier, task } = input;
    let sandbox: AppSandbox;

    try {
      sandbox = await this.sandboxManager.acquire(task.metadata.appId);
    } catch (error: unknown) {
      const code = error instanceof SandboxAcquisitionError ? error.code : AppCodeTaskError.SANDBOX_UNAVAILABLE;
      const message = getErrorMessage(error);
      await markTaskFailed({ taskManager, taskId: task.id, message });
      return createFailedResult({ taskIdentifier, appId: task.metadata.appId, code, message });
    }

    try {
      return await this.runInSandbox({ taskManager, taskIdentifier, task, sandbox });
    } finally {
      await this.sandboxManager.release(sandbox);
    }
  }

  /**
   * 在沙箱中执行任务的完整编排：前置检查点、任务分支准备、Pi 会话创建、
   * Agent 执行、完成提交以及任务状态回写。
   *
   * 任一阶段失败都会把任务标记为 failed 并返回对应的失败结果。
   */
  private async runInSandbox(input: SandboxTaskExecutionInput): Promise<AppCodeExecutionResult> {
    const { taskManager, taskIdentifier, task, sandbox } = input;

    try {
      await this.checkpointPreviousFailedTask(input);
      await prepareTaskBranch({ sandbox, taskIdentifier });
    } catch (error: unknown) {
      return this.failTask({
        taskManager,
        taskIdentifier,
        task,
        code: AppCodeTaskError.TASK_BRANCH_FAILED,
        error
      });
    }

    let session: PiAgentRunnerSession;
    try {
      session = await this.piSessionFactory.getOrCreate({ sandbox, taskListId: taskIdentifier.taskListId });
    } catch (error: unknown) {
      return this.failTask({
        taskManager,
        taskIdentifier,
        task,
        code: AppCodeTaskError.AGENT_SESSION_FAILED,
        error
      });
    }

    const result = await this.runPiAgent({ taskManager, taskIdentifier, task, sandbox, session });
    if (result.status === "failed") {
      return result;
    }

    try {
      await commitTaskBranchChanges({ sandbox, taskIdentifier, kind: "completed" });
    } catch (error: unknown) {
      return this.failTask({
        taskManager,
        taskIdentifier,
        task,
        sessionId: session.sessionId,
        code: AppCodeTaskError.TASK_BRANCH_FAILED,
        error
      });
    }

    await taskManager.updateTask(task.id, { status: "completed", lastError: undefined });
    return result;
  }

  /**
   * 驱动 Pi Agent 执行任务。
   *
   * Agent 返回 failed 或抛出异常时，任务都会被标记为 failed。
   */
  private async runPiAgent(
    input: SandboxTaskExecutionInput & { session: PiAgentRunnerSession }
  ): Promise<AppCodeExecutionResult> {
    const { taskManager, taskIdentifier, task, sandbox, session } = input;

    try {
      const result = await this.piAgentRunner.run({
        taskListId: taskIdentifier.taskListId,
        task,
        sandbox,
        session
      });

      if (result.status === "failed") {
        await markTaskFailed({ taskManager, taskId: task.id, message: result.error.message });
      }

      return result;
    } catch (error: unknown) {
      return this.failTask({
        taskManager,
        taskIdentifier,
        task,
        sessionId: session.sessionId,
        code: AppCodeTaskError.AGENT_EXECUTION_FAILED,
        error
      });
    }
  }

  /**
   * 在切换到当前任务分支前，为沙箱中遗留的历史失败任务保存 WIP 检查点。
   *
   * 沙箱当前停留在同 App 某个 failed 或 cancelled 任务的分支上时，先以
   * checkpoint 提交该分支的未提交修改，避免切换分支时丢失上一个任务的进展。
   * 已经位于当前任务分支或停留分支无法匹配历史任务时不做任何处理。
   */
  private async checkpointPreviousFailedTask(input: SandboxTaskExecutionInput): Promise<void> {
    const { taskManager, taskIdentifier, task, sandbox } = input;
    const currentBranch = await readCurrentBranchName(sandbox);
    const targetBranch = buildTaskBranchName(taskIdentifier);
    if (currentBranch === targetBranch) {
      return;
    }

    const tasks = await taskManager.listTasks();
    const previousTask = tasks.map(parseAppCodeTask).find((candidate) => {
      return (
        candidate !== undefined &&
        candidate.id !== task.id &&
        candidate.metadata.appId === task.metadata.appId &&
        (candidate.status === "failed" || candidate.status === "cancelled") &&
        buildTaskBranchName({ taskListId: taskIdentifier.taskListId, taskId: candidate.id }) === currentBranch
      );
    });

    if (previousTask) {
      await commitTaskBranchChanges({
        sandbox,
        taskIdentifier: { taskListId: taskIdentifier.taskListId, taskId: previousTask.id },
        kind: "checkpoint"
      });
    }
  }

  /**
   * 把上次进程意外中止遗留的 in_progress 任务改写为 failed。
   *
   * 只改写任务状态、不执行任何任务：解锁后的任务需等待后续显式的
   * executeCodeTask 调用才会重试。仅处理由当前执行者认领、且不在本
   * 进程活跃执行中的任务。
   */
  private async markInterruptedTasksFailed(input: {
    taskManager: TaskManager;
    currentTaskIdentifier: TaskIdentifier;
  }): Promise<void> {
    const { taskManager, currentTaskIdentifier } = input;
    const tasks = await taskManager.listTasks();

    await Promise.all(
      tasks
        .filter((task) => this.isInterruptedTask(task, currentTaskIdentifier))
        .map((task) =>
          taskManager.updateTask(task.id, {
            status: "failed",
            lastError: INTERRUPTED_EXECUTION_MESSAGE
          })
        )
    );
  }

  /**
   * 判断任务是否属于进程重启遗留的中断任务。
   *
   * 条件：任务仍处于 in_progress、由当前执行者持有，且既不是本次要执行的
   * 任务，也不在当前进程的活跃执行集合中。
   */
  private isInterruptedTask(task: Task, currentTaskIdentifier: TaskIdentifier): boolean {
    if (task.status !== "in_progress" || (task.owner && task.owner !== ARTIFACT_APP_EXECUTOR_ID)) {
      return false;
    }

    if (task.id === currentTaskIdentifier.taskId) {
      return true;
    }

    const taskKey = createExecutionKey({ taskListId: currentTaskIdentifier.taskListId, taskId: task.id });
    return !this.activeExecutions.has(taskKey);
  }

  /**
   * 把任务标记为 failed 并构造带错误码的失败执行结果。
   */
  private async failTask(input: {
    taskManager: TaskManager;
    taskIdentifier: TaskIdentifier;
    task: AppCodeTask;
    sessionId?: string;
    code: AppCodeTaskError;
    error: unknown;
  }): Promise<AppCodeExecutionResult> {
    const { taskManager, taskIdentifier, task, sessionId, code, error } = input;
    const message = getErrorMessage(error);
    await markTaskFailed({ taskManager, taskId: task.id, message });
    return createFailedResult({ taskIdentifier, appId: task.metadata.appId, sessionId, code, message });
  }

  /** 为指定任务列表创建基于本地文件存储的 TaskManager。 */
  private createTaskManager(taskListId: string): TaskManager {
    return new TaskManager({ taskListId, storageRoot: this.taskStorageRoot });
  }
}

type FailedClaim = Exclude<Awaited<ReturnType<TaskManager["claimTask"]>>, { success: true }>;

/** 判断任务认领结果是否为失败结果，收窄类型后可安全读取 failure 字段。 */
function isClaimFailure(result: ClaimAppCodeTaskResult): result is ClaimAppCodeTaskFailure {
  return "failure" in result;
}

/** 把任务认领的失败返回值转换为统一的失败执行结果。 */
function createClaimFailure(taskIdentifier: TaskIdentifier, claim: FailedClaim): AppCodeExecutionResult {
  const appId = getTaskAppId(claim.task);
  const { code, message } = mapClaimFailure(claim);
  return createFailedResult({ taskIdentifier, appId, code, message });
}

/** 把 TaskManager 的认领失败原因映射为错误码与用户可读信息。 */
function mapClaimFailure(claim: FailedClaim): { code: AppCodeTaskError; message: string } {
  if (claim.reason === "task_not_found") {
    return { code: AppCodeTaskError.TASK_NOT_FOUND, message: "任务不存在" };
  }
  if (claim.reason === "already_claimed") {
    return { code: AppCodeTaskError.TASK_ALREADY_CLAIMED, message: "任务已被其他执行者认领" };
  }
  if (claim.reason === "already_running" || claim.reason === "agent_busy") {
    return { code: AppCodeTaskError.TASK_ALREADY_RUNNING, message: "任务已经在执行" };
  }
  if (claim.reason === "blocked") {
    return { code: AppCodeTaskError.TASK_BLOCKED, message: "任务仍被前置任务阻塞" };
  }
  if (claim.task?.status === "cancelled") {
    return { code: AppCodeTaskError.TASK_CANCELLED, message: "任务已经取消" };
  }
  return { code: AppCodeTaskError.TASK_ALREADY_COMPLETED, message: "任务已经完成" };
}

/** 把任务状态更新为 failed 并记录最后错误信息。 */
async function markTaskFailed(input: { taskManager: TaskManager; taskId: string; message: string }): Promise<void> {
  const { taskManager, taskId, message } = input;
  await taskManager.updateTask(taskId, { status: "failed", lastError: message });
}

/** 由任务列表 ID 与任务 ID 生成进程内执行去重键。 */
function createExecutionKey(taskIdentifier: TaskIdentifier): string {
  return JSON.stringify([taskIdentifier.taskListId, taskIdentifier.taskId]);
}
