import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { prepareTaskBranch } from "@/artifact-app/application/app-task-branch";
import type { AppSandbox } from "@/artifact-app/sandbox/app-sandbox";
import { initializeGitRepository } from "@/artifact-app/sandbox/local/local-app-project-initializer";
import { LocalSandbox } from "@/artifact-app/sandbox/local/local-sandbox";

const temporaryDirectories: string[] = [];

async function createWorkspace() {
  const workspacePath = await mkdtemp(path.join(tmpdir(), "screenwright-app-init-"));
  temporaryDirectories.push(workspacePath);
  return workspacePath;
}

async function createProjectFiles(workspacePath: string) {
  await writeFile(path.join(workspacePath, "package.json"), '{\n  "name": "app-001"\n}\n');
  await writeFile(path.join(workspacePath, ".gitignore"), "node_modules\n");
  await mkdir(path.join(workspacePath, "src"), { recursive: true });
  await writeFile(path.join(workspacePath, "src", "main.ts"), "console.log('app');\n");
  await mkdir(path.join(workspacePath, "node_modules", "vue"), { recursive: true });
  await writeFile(path.join(workspacePath, "node_modules", "vue", "index.js"), "/* dependency */\n");
}

async function createSandbox(workspacePath: string) {
  return new LocalSandbox("app-001", await realpath(workspacePath));
}

async function runGitScript(sandbox: AppSandbox, script: string) {
  const result = await sandbox.run({ script });
  expect(result).toMatchObject({ exitCode: 0, termination: "exited" });
  return result.stdout.trim();
}

function normalizeGitPath(value: string) {
  return realpath(value).then((resolvedPath) => path.resolve(resolvedPath).toLocaleLowerCase());
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("本地 App 项目 Git 初始化", () => {
  it("initializeGitRepository：应创建独立于宿主仓库的干净工作区", async () => {
    // Arrange
    const workspacePath = await createWorkspace();
    await createProjectFiles(workspacePath);
    const sandbox = await createSandbox(workspacePath);

    // Act
    await initializeGitRepository(workspacePath);

    // Assert
    const expectedToplevelPath = await normalizeGitPath(workspacePath);
    const toplevelPath = await runGitScript(sandbox, "git rev-parse --show-toplevel");
    await expect(normalizeGitPath(toplevelPath)).resolves.toBe(expectedToplevelPath);
    await expect(runGitScript(sandbox, "git status --porcelain --untracked-files=normal")).resolves.toBe("");
    await expect(runGitScript(sandbox, "git branch --show-current")).resolves.toBe("main");
  });

  it("initializeGitRepository：初始提交应包含项目文件并忽略 node_modules", async () => {
    // Arrange
    const workspacePath = await createWorkspace();
    await createProjectFiles(workspacePath);
    const sandbox = await createSandbox(workspacePath);

    // Act
    await initializeGitRepository(workspacePath);

    // Assert
    await expect(runGitScript(sandbox, "git log -1 --pretty=%B")).resolves.toBe("artifact-app initial commit");
    await expect(runGitScript(sandbox, "git ls-files")).resolves.toBe(
      [".gitignore", "package.json", "src/main.ts"].join("\n")
    );
  });

  it("initializeGitRepository：Git 仓库就位后，应能直接准备任务分支", async () => {
    // Arrange
    const workspacePath = await createWorkspace();
    await createProjectFiles(workspacePath);
    await initializeGitRepository(workspacePath);
    const sandbox = await createSandbox(workspacePath);

    // Act
    const result = await prepareTaskBranch({
      sandbox,
      taskIdentifier: { taskListId: "thread-001", taskId: "42" }
    });

    // Assert
    expect(result).toEqual({ branchName: "pi/thread-001/task-42", created: true });
    await expect(runGitScript(sandbox, "git branch --show-current")).resolves.toBe("pi/thread-001/task-42");
  });

  it("initializeGitRepository：切换其他任务分支前存在未提交修改时，应保持原有保护行为", async () => {
    // Arrange
    const workspacePath = await createWorkspace();
    await createProjectFiles(workspacePath);
    await initializeGitRepository(workspacePath);
    const sandbox = await createSandbox(workspacePath);
    await prepareTaskBranch({ sandbox, taskIdentifier: { taskListId: "thread-001", taskId: "42" } });
    await writeFile(path.join(workspacePath, "src", "main.ts"), "console.log('wip');\n");

    // Act
    const result = prepareTaskBranch({
      sandbox,
      taskIdentifier: { taskListId: "thread-001", taskId: "43" }
    });

    // Assert
    await expect(result).rejects.toThrow("Git 工作区存在未提交修改");
    await expect(runGitScript(sandbox, "git branch --show-current")).resolves.toBe("pi/thread-001/task-42");
  });

  it("initializeGitRepository：工作目录不存在时，应抛出初始化失败错误", async () => {
    // Arrange
    const workspacePath = path.join(await realpath(tmpdir()), "screenwright-app-init-missing");

    // Act
    const result = initializeGitRepository(workspacePath);

    // Assert
    await expect(result).rejects.toThrow("初始化仓库失败");
  });
});
