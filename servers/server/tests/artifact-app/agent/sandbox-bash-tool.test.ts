import { describe, expect, it, vi } from "vitest";

import { createSandboxBashOperations, createSandboxBashTool } from "@/artifact-app/agent/tools/sandbox-bash-tool";
import type { AppSandbox } from "@/artifact-app/sandbox/app-sandbox";

describe("Sandbox Bash 工具", () => {
  it("createSandboxBashTool：创建工具时，应覆盖 Pi 的 bash 工具名称", () => {
    // Arrange
    const sandbox = createSandboxStub();

    // Act
    const tool = createSandboxBashTool(sandbox);

    // Assert
    expect(tool.name).toBe("bash");
  });

  it("exec：执行带超时的命令时，应委托给 Sandbox 并转换为毫秒", async () => {
    // Arrange
    const run = vi.fn<AppSandbox["run"]>().mockResolvedValue(createSuccessfulResult());
    const sandbox = createSandboxStub(run);
    const operations = createSandboxBashOperations(sandbox);

    // Act
    await operations.exec("pnpm test", sandbox.workspacePath, {
      onData: () => undefined,
      timeout: 2
    });

    // Assert
    expect(run).toHaveBeenCalledWith({
      script: "pnpm test",
      timeoutMs: 2_000,
      signal: undefined
    });
  });

  it("exec：Sandbox 返回标准输出和错误输出时，应交给 Pi 输出通道", async () => {
    // Arrange
    const sandbox = createSandboxStub(async () => ({
      exitCode: 0,
      stdout: "build output",
      stderr: "build warning",
      termination: "exited"
    }));
    const operations = createSandboxBashOperations(sandbox);
    let output = "";

    // Act
    await operations.exec("pnpm build", sandbox.workspacePath, {
      onData: (data) => {
        output += data.toString("utf8");
      }
    });

    // Assert
    expect(output).toBe("build outputbuild warning");
  });
});

function createSandboxStub(run: AppSandbox["run"] = async () => createSuccessfulResult()): AppSandbox {
  return {
    appId: "app-001",
    workspacePath: "D:/artifact-apps/app-001",
    run
  };
}

function createSuccessfulResult() {
  return {
    exitCode: 0,
    stdout: "",
    stderr: "",
    termination: "exited" as const
  };
}
