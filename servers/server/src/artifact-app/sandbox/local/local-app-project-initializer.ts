import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

import { createArtifactApp } from "create-screenwright-app";

import { getErrorMessage } from "../../shared/error-message";

export interface InitializeLocalAppProjectInput {
  /** 新项目的绝对工作目录。 */
  readonly workspacePath: string;
}

export type LocalAppProjectInitializer = (input: InitializeLocalAppProjectInput) => Promise<void>;

/**
 * 使用标准 Vue Artifact App 模板创建项目，并安装独立于主仓库的依赖。
 *
 * 项目文件和依赖安装结果会提交到工作区内的独立 Git 仓库，保证任务分支
 * 操作（见 {@link app-task-branch}）不会泄漏到宿主仓库。初始化任一步骤
 * 失败时会移除半成品目录，使后续 acquire 可以重新尝试。
 */
export const initializeLocalAppProject: LocalAppProjectInitializer = async ({ workspacePath }) => {
  try {
    await createArtifactApp({ targetDirectory: workspacePath });
    await installProjectDependencies(workspacePath);
    await initializeGitRepository(workspacePath);
  } catch (error) {
    await rm(workspacePath, { recursive: true, force: true });
    throw error;
  }
};

const GIT_AUTHOR_NAME = "screenwright Pi Agent";
const GIT_AUTHOR_EMAIL = "pi-agent@screenwright.local";
const INITIAL_COMMIT_MESSAGE = "artifact-app initial commit";

/**
 * 在 App 工作区内初始化独立于宿主仓库的 Git 仓库，并提交初始文件。
 *
 * 初始提交放在依赖安装之后，确保 pnpm 生成的 lockfile 变更也进入首个
 * 提交，任务开始时工作区即为干净状态。
 *
 * @throws 当 Git 不可用或任一 Git 命令失败时抛出。
 */
export async function initializeGitRepository(workspacePath: string): Promise<void> {
  await runGitCommand(workspacePath, ["init", "-b", "main"], "初始化仓库失败");
  await runGitCommand(workspacePath, ["add", "-A"], "暂存初始文件失败");
  await runGitCommand(workspacePath, createInitialCommitArgs(), "创建初始提交失败");
}

function createInitialCommitArgs(): string[] {
  return [
    "-c",
    `user.name=${GIT_AUTHOR_NAME}`,
    "-c",
    `user.email=${GIT_AUTHOR_EMAIL}`,
    "commit",
    "-m",
    INITIAL_COMMIT_MESSAGE
  ];
}

/** 执行单条 Git 命令，非零退出码时附带标准错误信息。 */
function runGitCommand(cwd: string, args: string[], action: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd,
      shell: false,
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true
    });

    let stderr = "";
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.once("error", (error) => {
      reject(new Error(`${action}：${getErrorMessage(error)}`));
    });
    child.once("close", (exitCode, signal) => {
      if (exitCode === 0) {
        resolve();
        return;
      }

      const detail = stderr.trim();
      reject(
        new Error(`${action} (exitCode=${String(exitCode)}, signal=${String(signal)})${detail ? `：${detail}` : ""}`)
      );
    });
  });
}

/** 在项目自带的独立 pnpm workspace 中安装依赖。 */
function installProjectDependencies(workspacePath: string): Promise<void> {
  const { executable, args } = resolvePnpmInstallCommand();

  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: workspacePath,
      shell: false,
      stdio: "inherit",
      windowsHide: true
    });

    child.once("error", reject);
    child.once("close", (exitCode, signal) => {
      if (exitCode === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Artifact App dependency installation failed (exitCode=${String(exitCode)}, signal=${String(signal)})`
        )
      );
    });
  });
}

/** Windows 的 cmd 脚本必须通过命令解释器启动；其他平台直接执行 pnpm。 */
function resolvePnpmInstallCommand(): { executable: string; args: string[] } {
  if (process.platform === "win32") {
    return {
      executable: process.env.ComSpec || "cmd.exe",
      args: ["/d", "/s", "/c", "pnpm install"]
    };
  }

  return { executable: "pnpm", args: ["install"] };
}
