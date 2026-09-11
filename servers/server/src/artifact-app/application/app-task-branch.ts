import { createHash } from "node:crypto";

import { type TaskIdentifier, TaskIdentifierSchema } from "@/task-management";

import type { AppSandbox, SandboxCommandResult } from "../sandbox/app-sandbox";

const MAX_BRANCH_SEGMENT_LENGTH = 48;
const HASH_LENGTH = 8;
const SAFE_BRANCH_SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/** 准备任务分支所需的应用工作区和任务定位信息。 */
export interface PrepareTaskBranchInput {
  /** 执行 Git 命令的目标 App Sandbox。 */
  sandbox: AppSandbox;

  /** 用于生成稳定分支名的任务列表 ID 和任务 ID。 */
  taskIdentifier: TaskIdentifier;
}

/** 任务分支准备完成后的结果。 */
export interface PreparedTaskBranch {
  /** 当前工作区最终所在的完整 Git 分支名。 */
  branchName: string;

  /** 本次是否创建了新分支；复用已有分支时为 false。 */
  created: boolean;
}

export type TaskBranchCommitKind = "completed" | "checkpoint";

/** 提交任务分支修改所需的参数。 */
export interface CommitTaskBranchChangesInput extends PrepareTaskBranchInput {
  /** 正常完成提交或失败任务的 WIP 检查点。 */
  kind: TaskBranchCommitKind;
}

/** 提交任务分支修改后的结果。 */
export interface CommitTaskBranchChangesResult {
  /** 本次检查对应的任务分支名。 */
  branchName: string;

  /** 工作区存在修改并成功创建提交时为 true。 */
  committed: boolean;
}

/**
 * 根据任务标识生成稳定且可安全传给 Shell 的 Git 分支名。
 *
 * 分支名格式为 `pi/{taskListId}/task-{taskId}`。不安全或过长的标识片段
 * 会经过清理并附加短哈希，既避免 Shell 注入，也降低清理后的名称冲突风险。
 *
 * @param taskIdentifier 任务列表 ID 和任务 ID。
 * @returns 与该任务稳定对应的 Git 分支名。
 * @throws 当任务标识不符合 {@link TaskIdentifierSchema} 时抛出校验错误。
 */
export function buildTaskBranchName(taskIdentifier: TaskIdentifier): string {
  const { taskListId, taskId } = TaskIdentifierSchema.parse(taskIdentifier);
  return `pi/${sanitizeBranchSegment(taskListId)}/task-${sanitizeBranchSegment(taskId)}`;
}

/**
 * 将 App 工作区切换到当前任务分支。
 *
 * 当前已经位于目标分支时直接复用，以便保留同一任务尚未提交的修改。
 * 创建新分支或从其他分支切换前，要求工作区保持干净。
 *
 * @param input 目标 Sandbox 和任务标识。
 * @returns 最终分支名以及本次是否创建了新分支。
 * @throws 当任务标识无效、Git 命令失败，或切换前存在未提交修改时抛出。
 */
export async function prepareTaskBranch(input: PrepareTaskBranchInput): Promise<PreparedTaskBranch> {
  const { sandbox, taskIdentifier } = input;
  const branchName = buildTaskBranchName(taskIdentifier);
  const currentBranch = await readCurrentBranchName(sandbox);

  if (currentBranch === branchName) {
    return { branchName, created: false };
  }

  const exists = await branchExists({ sandbox, branchName });
  await assertWorkspaceClean(sandbox);

  if (exists) {
    await runRequiredGitCommand({
      sandbox,
      script: `git switch ${branchName}`,
      action: `切换任务分支 ${branchName}`
    });
    return { branchName, created: false };
  }

  await runRequiredGitCommand({
    sandbox,
    script: `git switch -c ${branchName}`,
    action: `创建任务分支 ${branchName}`
  });
  return { branchName, created: true };
}

/**
 * 将当前任务分支中的全部修改提交为完成记录或 WIP 检查点。
 *
 * 只有工作区确实位于该任务的稳定分支名时才允许提交，避免将其他分支的
 * 来源不明修改归入当前任务。工作区没有修改时直接返回，不创建空提交。
 *
 * @param input 目标 Sandbox、任务标识和提交类型。
 * @returns 任务分支名以及本次是否创建了提交。
 * @throws 当前分支与任务不匹配，或 Git 命令执行失败时抛出。
 */
export async function commitTaskBranchChanges(
  input: CommitTaskBranchChangesInput
): Promise<CommitTaskBranchChangesResult> {
  const { sandbox, taskIdentifier, kind } = input;
  const branchName = buildTaskBranchName(taskIdentifier);
  const currentBranch = await readCurrentBranchName(sandbox);

  if (currentBranch !== branchName) {
    throw new Error(`当前分支 ${currentBranch || "detached HEAD"} 不属于任务 ${branchName}`);
  }

  const status = await getWorkspaceStatus(sandbox);
  if (!status) {
    return { branchName, committed: false };
  }

  await runRequiredGitCommand({ sandbox, script: "git add -A", action: "暂存任务修改" });
  await runRequiredGitCommand({
    sandbox,
    script: createCommitScript({ branchName, kind }),
    action: `提交任务分支 ${branchName}`
  });

  return { branchName, committed: true };
}

/**
 * 将外部任务 ID 转换为安全的 Git 引用片段。
 *
 * 合法短片段保持原样；其他值清理后附加原始值哈希，确保结果稳定并减少碰撞。
 */
function sanitizeBranchSegment(value: string): string {
  if (SAFE_BRANCH_SEGMENT_PATTERN.test(value) && value.length <= MAX_BRANCH_SEGMENT_LENGTH) {
    return value;
  }

  const sanitized = value
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const hash = createHash("sha256").update(value).digest("hex").slice(0, HASH_LENGTH);
  const baseLength = MAX_BRANCH_SEGMENT_LENGTH - HASH_LENGTH - 1;
  const base = (sanitized || "id").slice(0, baseLength);
  return `${base}-${hash}`;
}

/** 读取 Sandbox 工作区当前所在的本地 Git 分支；处于 detached HEAD 时返回空字符串。 */
export async function readCurrentBranchName(sandbox: AppSandbox): Promise<string> {
  const result = await sandbox.run({ script: "git branch --show-current" });
  assertCommandSucceeded("读取当前 Git 分支", result);
  return result.stdout.trim();
}

/** 查询本地任务分支是否已经存在所需的参数。 */
interface BranchExistsInput {
  /** 执行 Git 查询命令的 Sandbox。 */
  sandbox: AppSandbox;

  /** 要查询的完整本地分支名。 */
  branchName: string;
}

/**
 * 判断本地分支是否存在。
 *
 * `git show-ref` 的退出码 1 表示引用不存在，属于正常查询结果；其他失败会抛出异常。
 */
async function branchExists({ sandbox, branchName }: BranchExistsInput): Promise<boolean> {
  const result = await sandbox.run({
    script: `git show-ref --verify --quiet refs/heads/${branchName}`
  });

  if (result.termination === "exited" && result.exitCode === 1) {
    return false;
  }

  assertCommandSucceeded(`检查任务分支 ${branchName}`, result);
  return true;
}

/** 确认工作区没有已跟踪或未跟踪的未提交修改，避免切换任务时污染其他分支。 */
async function assertWorkspaceClean(sandbox: AppSandbox): Promise<void> {
  if (await getWorkspaceStatus(sandbox)) {
    throw new Error("Git 工作区存在未提交修改，无法创建或切换任务分支");
  }
}

/** 读取包含已跟踪和未跟踪文件的 Git porcelain 状态。 */
async function getWorkspaceStatus(sandbox: AppSandbox): Promise<string> {
  const result = await sandbox.run({ script: "git status --porcelain --untracked-files=normal" });
  assertCommandSucceeded("检查 Git 工作区状态", result);
  return result.stdout.trim();
}

interface CreateCommitScriptInput {
  branchName: string;
  kind: TaskBranchCommitKind;
}

/** 使用固定 Git 身份和安全分支名生成非交互式提交命令。 */
function createCommitScript({ branchName, kind }: CreateCommitScriptInput): string {
  return [
    'git -c user.name="screenwright Pi Agent"',
    '-c user.email="pi-agent@screenwright.local"',
    `commit -m "artifact-app ${kind} ${branchName}"`
  ].join(" ");
}

/** 执行必须成功的 Git 命令所需参数。 */
interface RunRequiredGitCommandInput {
  /** 执行命令的 Sandbox。 */
  sandbox: AppSandbox;

  /** 交给 Sandbox Shell 执行的 Git 脚本。 */
  script: string;

  /** 命令失败时用于构造错误信息的业务动作描述。 */
  action: string;
}

/** 执行 Git 命令，并将非正常退出统一转换为异常。 */
async function runRequiredGitCommand(input: RunRequiredGitCommandInput): Promise<void> {
  const { sandbox, script, action } = input;
  const result = await sandbox.run({ script });
  assertCommandSucceeded(action, result);
}

/** 校验 Sandbox 命令是否以退出码 0 正常结束，并保留可用于诊断的输出。 */
function assertCommandSucceeded(action: string, result: SandboxCommandResult): void {
  if (result.termination === "exited" && result.exitCode === 0) {
    return;
  }

  const detail = result.stderr.trim() || result.stdout.trim() || result.termination;
  throw new Error(`${action}失败：${detail}`);
}
