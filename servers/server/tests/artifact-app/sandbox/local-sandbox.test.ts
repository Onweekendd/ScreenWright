import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { LocalSandbox } from "@/artifact-app/sandbox/local/local-sandbox";

const temporaryDirectories: string[] = [];

async function createWorkspace() {
  const workspacePath = await mkdtemp(path.join(tmpdir(), "screenwright-local-sandbox-"));
  temporaryDirectories.push(workspacePath);
  return workspacePath;
}

function nodeScript(source: string) {
  return `${JSON.stringify(process.execPath)} -e ${JSON.stringify(source)}`;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("本地沙箱", () => {
  it("run：传入空脚本时，应在启动进程前拒绝执行", async () => {
    // Arrange
    const workspacePath = await createWorkspace();
    const sandbox = new LocalSandbox("app-001", workspacePath);

    // Act
    const result = sandbox.run({ script: "  " });

    // Assert
    await expect(result).rejects.toThrow("script cannot be empty");
  });

  it("run：传入非正数超时时间时，应在启动进程前拒绝执行", async () => {
    // Arrange
    const workspacePath = await createWorkspace();
    const sandbox = new LocalSandbox("app-001", workspacePath);

    // Act
    const result = sandbox.run({ script: "echo test", timeoutMs: 0 });

    // Assert
    await expect(result).rejects.toThrow("timeoutMs must be greater than zero");
  });

  it("run：命令执行成功时，应返回捕获的输出和退出状态", async () => {
    // Arrange
    const workspacePath = await createWorkspace();
    const sandbox = new LocalSandbox("app-001", workspacePath);

    // Act
    const result = await sandbox.run({
      script: nodeScript('process.stdout.write("hello")')
    });

    // Assert
    expect(result).toEqual({
      exitCode: 0,
      stdout: "hello",
      stderr: "",
      termination: "exited"
    });
  });

  it("run：命令执行失败时，应返回标准错误和非零退出码", async () => {
    // Arrange
    const workspacePath = await createWorkspace();
    const sandbox = new LocalSandbox("app-001", workspacePath);

    // Act
    const result = await sandbox.run({
      script: nodeScript('process.stderr.write("failed"); process.exit(7)')
    });

    // Assert
    expect(result).toMatchObject({
      exitCode: 7,
      stderr: "failed",
      termination: "exited"
    });
  });

  it("run：命令读取当前目录时，应在指定工作区中执行", async () => {
    // Arrange
    const workspacePath = await createWorkspace();
    const expectedWorkspacePath = await realpath(workspacePath);
    const sandbox = new LocalSandbox("app-001", workspacePath);

    // Act
    const result = await sandbox.run({
      script: nodeScript("process.stdout.write(process.cwd())")
    });
    const actualWorkspacePath = await realpath(result.stdout);

    // Assert
    expect(actualWorkspacePath.toLocaleLowerCase()).toBe(expectedWorkspacePath.toLocaleLowerCase());
  });

  it("run：命令超过执行时限时，应提前终止并报告超时", async () => {
    // Arrange
    const workspacePath = await createWorkspace();
    const sandbox = new LocalSandbox("app-001", workspacePath);
    const startedAt = Date.now();

    // Act
    const result = await sandbox.run({
      script: nodeScript("setTimeout(() => {}, 2_000)"),
      timeoutMs: 20
    });

    // Assert
    expect(result.termination).toBe("timed_out");
    expect(Date.now() - startedAt).toBeLessThan(1_000);
  });

  it("run：调用方取消命令时，应终止进程并报告已取消", async () => {
    // Arrange
    const workspacePath = await createWorkspace();
    const sandbox = new LocalSandbox("app-001", workspacePath);
    const controller = new AbortController();
    const startedAt = Date.now();

    // Act
    const resultPromise = sandbox.run({
      script: nodeScript("setTimeout(() => {}, 2_000)"),
      signal: controller.signal
    });
    controller.abort();
    const result = await resultPromise;

    // Assert
    expect(result.termination).toBe("aborted");
    expect(Date.now() - startedAt).toBeLessThan(1_000);
  });
});
