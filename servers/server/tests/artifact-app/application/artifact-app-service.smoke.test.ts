import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { ArtifactAppPiAgentRunner, PiAgentRunnerSession } from "@/artifact-app/agent/pi-agent-runner";
import type { ArtifactAppPiSessionFactory } from "@/artifact-app/agent/sessions/pi-session-factory";
import { buildTaskBranchName } from "@/artifact-app/application/app-task-branch";
import { InMemoryAppWriteLock } from "@/artifact-app/application/app-write-lock";
import { ArtifactAppService } from "@/artifact-app/application/artifact-app-service";
import { AppCodeTaskError } from "@/artifact-app/contracts";
import { LocalSandboxManager } from "@/artifact-app/sandbox/local/local-sandbox-manager";
import { TaskManager } from "@/task-management";

const temporaryDirectories: string[] = [];

interface RunGitInput {
  readonly cwd: string;
  readonly args: string[];
}

function runGit(input: RunGitInput): string {
  return execFileSync("git", input.args, {
    cwd: input.cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function createSessionStub(): PiAgentRunnerSession {
  return {
    sessionId: "session-smoke-001",
    prompt: async () => {},
    subscribe: () => () => {}
  };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("ArtifactAppService 本地冒烟测试", () => {
  it(
    "executeCodeTask：真实本地项目执行完成时，应在任务分支提交且不污染主分支和项目目录外文件",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const testRoot = await mkdtemp(path.join(tmpdir(), "screenwright-artifact-smoke-"));
      temporaryDirectories.push(testRoot);
      const appsRoot = path.join(testRoot, "apps");
      const appPath = path.join(appsRoot, "app-001");
      const sourcePath = path.join(appPath, "src");
      const taskStorageRoot = path.join(testRoot, "tasks");
      const outsideFile = path.join(testRoot, "outside.txt");
      await mkdir(sourcePath, { recursive: true });
      await writeFile(path.join(sourcePath, "main.ts"), "export const initial = true;\n", "utf8");
      await writeFile(
        path.join(appPath, "tsconfig.json"),
        JSON.stringify(
          { compilerOptions: { noEmit: true, strict: true, target: "ES2022" }, include: ["src"] },
          null,
          2
        ),
        "utf8"
      );
      await writeFile(outsideFile, "outside-safe\n", "utf8");
      runGit({ cwd: appPath, args: ["init"] });
      runGit({ cwd: appPath, args: ["branch", "-M", "main"] });
      runGit({ cwd: appPath, args: ["add", "-A"] });
      runGit({
        cwd: appPath,
        args: [
          "-c",
          "user.name=Artifact App Test",
          "-c",
          "user.email=artifact-test@example.com",
          "commit",
          "-m",
          "initial"
        ]
      });

      const taskListId = "task-list-smoke";
      const taskManager = new TaskManager({ taskListId, storageRoot: taskStorageRoot });
      const taskId = await taskManager.createTask({
        subject: "生成页面入口",
        description: "新增一个生成文件",
        status: "pending",
        blocks: [],
        blockedBy: [],
        metadata: {
          task_kind: "artifact-app-code",
          appId: "app-001",
          screenId: "screen-001",
          acceptanceCriteria: ["生成文件存在"]
        }
      });
      const taskIdentifier = { taskListId, taskId };
      const session = createSessionStub();
      const typescriptCompiler = path.join(process.cwd(), "node_modules", "typescript", "bin", "tsc");
      const getOrCreate = vi.fn<ArtifactAppPiSessionFactory["getOrCreate"]>().mockResolvedValue(session);
      const run = vi.fn<ArtifactAppPiAgentRunner["run"]>().mockImplementation(async ({ sandbox, task }) => {
        await writeFile(
          path.join(sandbox.workspacePath, "src", "generated.ts"),
          "export const generated = true;\n",
          "utf8"
        );
        const typecheck = await sandbox.run({
          script: `${JSON.stringify(process.execPath)} ${JSON.stringify(typescriptCompiler)} --noEmit --project tsconfig.json`
        });
        if (typecheck.exitCode !== 0) {
          throw new Error(typecheck.stderr || typecheck.stdout || "TypeScript 检查失败");
        }

        return {
          taskListId,
          taskId: task.id,
          appId: sandbox.appId,
          sessionId: session.sessionId,
          status: "completed",
          summary: "生成文件已经完成",
          changedFiles: ["src/generated.ts"],
          checks: [{ name: "tsc --noEmit", status: "passed" }]
        };
      });
      const service = new ArtifactAppService({
        taskStorageRoot,
        sandboxManager: new LocalSandboxManager({ appsRoot }),
        piSessionFactory: { getOrCreate },
        piAgentRunner: { run },
        appWriteLock: new InMemoryAppWriteLock()
      });

      // Act
      const firstResult = await service.executeCodeTask(taskIdentifier);
      const duplicateResult = await service.executeCodeTask(taskIdentifier);

      // Assert
      expect(firstResult).toMatchObject({
        status: "completed",
        appId: "app-001",
        sessionId: "session-smoke-001",
        checks: [{ name: "tsc --noEmit", status: "passed" }]
      });
      expect(duplicateResult).toMatchObject({
        status: "failed",
        error: { code: AppCodeTaskError.TASK_ALREADY_COMPLETED }
      });
      expect(run).toHaveBeenCalledOnce();
      expect(runGit({ cwd: appPath, args: ["branch", "--show-current"] }).trim()).toBe(
        buildTaskBranchName(taskIdentifier)
      );
      expect(runGit({ cwd: appPath, args: ["status", "--porcelain"] })).toBe("");
      expect(runGit({ cwd: appPath, args: ["log", "-1", "--pretty=%s"] }).trim()).toBe(
        `artifact-app completed ${buildTaskBranchName(taskIdentifier)}`
      );
      expect(() => runGit({ cwd: appPath, args: ["cat-file", "-e", "main:src/generated.ts"] })).toThrow();
      await expect(readFile(outsideFile, "utf8")).resolves.toBe("outside-safe\n");
    }
  );
});
