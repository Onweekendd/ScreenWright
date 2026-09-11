import { describe, expect, it, vi } from "vitest";

import { AppCodeTaskError } from "@/artifact-app/contracts/app-code-task-error";
import { LocalPreviewManager } from "@/artifact-app/preview/local/local-preview-manager";
import type { ViteDevelopmentServerProcess } from "@/artifact-app/preview/local/vite-development-server";
import type { AppSandbox } from "@/artifact-app/sandbox/app-sandbox";
import { SandboxAcquisitionError } from "@/artifact-app/sandbox/sandbox-manager";

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function createSandbox(appId = "app-001"): AppSandbox {
  return {
    appId,
    workspacePath: `D:/artifact-apps/${appId}`,
    run: vi.fn()
  };
}

function createProcess() {
  const closed = createDeferred();
  const process: ViteDevelopmentServerProcess = {
    pid: 43120,
    port: 43123,
    targetUrl: "http://127.0.0.1:43123",
    closed: closed.promise,
    stop: vi.fn(async () => closed.resolve())
  };
  return { process, close: closed.resolve };
}

function createPidfile() {
  return {
    terminateStale: vi.fn(async (): Promise<void> => undefined),
    save: vi.fn(async (): Promise<void> => undefined),
    clear: vi.fn(async (): Promise<void> => undefined)
  };
}

describe("本地预览管理器", () => {
  it("start：首次启动应用时，应创建 Vite 服务并返回稳定预览路径", async () => {
    // Arrange
    const sandbox = createSandbox();
    const sandboxManager = {
      acquire: vi.fn(async () => sandbox),
      release: vi.fn(async () => undefined)
    };
    const viteProcess = createProcess();
    const pidfile = createPidfile();
    const startDevelopmentServer = vi.fn(async () => viteProcess.process);
    const manager = new LocalPreviewManager({ sandboxManager, startDevelopmentServer, pidfile });

    // Act
    const preview = await manager.start("app-001");

    // Assert
    expect(preview).toEqual({
      appId: "app-001",
      port: 43123,
      publicPath: "/artifact-apps/app-001/",
      status: "running"
    });
    expect(startDevelopmentServer).toHaveBeenCalledWith({
      appId: "app-001",
      workspacePath: sandbox.workspacePath,
      publicPath: "/artifact-apps/app-001/"
    });
    expect(pidfile.save).toHaveBeenCalledWith("app-001", { pid: 43120, port: 43123 });
  });

  it("start：启动前应先回收孤儿预览进程再启动新服务", async () => {
    // Arrange
    const sandbox = createSandbox();
    const viteProcess = createProcess();
    const pidfile = createPidfile();
    const startDevelopmentServer = vi.fn(async () => viteProcess.process);
    const manager = new LocalPreviewManager({
      sandboxManager: {
        acquire: vi.fn(async () => sandbox),
        release: vi.fn(async () => undefined)
      },
      startDevelopmentServer,
      pidfile
    });

    // Act
    await manager.start("app-001");

    // Assert
    expect(pidfile.terminateStale).toHaveBeenCalledWith("app-001");
    expect(pidfile.terminateStale.mock.invocationCallOrder[0]).toBeLessThan(
      startDevelopmentServer.mock.invocationCallOrder[0]
    );
  });

  it("start：并发启动同一应用时，应只创建一个 Vite 服务", async () => {
    // Arrange
    const sandbox = createSandbox();
    const allowStart = createDeferred();
    const viteProcess = createProcess();
    const sandboxManager = {
      acquire: vi.fn(async () => sandbox),
      release: vi.fn(async () => undefined)
    };
    const startDevelopmentServer = vi.fn(async () => {
      await allowStart.promise;
      return viteProcess.process;
    });
    const manager = new LocalPreviewManager({ sandboxManager, startDevelopmentServer, pidfile: createPidfile() });

    // Act
    const previewsPromise = Promise.all([manager.start("app-001"), manager.start("app-001")]);
    await vi.waitFor(() => expect(startDevelopmentServer).toHaveBeenCalledTimes(1));
    allowStart.resolve();
    const previews = await previewsPromise;

    // Assert
    expect(previews[0]).toBe(previews[1]);
    expect(sandboxManager.acquire).toHaveBeenCalledTimes(1);
    expect(startDevelopmentServer).toHaveBeenCalledTimes(1);
  });

  it("start：应用已经运行时，应复用已有预览", async () => {
    // Arrange
    const sandbox = createSandbox();
    const viteProcess = createProcess();
    const sandboxManager = {
      acquire: vi.fn(async () => sandbox),
      release: vi.fn(async () => undefined)
    };
    const startDevelopmentServer = vi.fn(async () => viteProcess.process);
    const manager = new LocalPreviewManager({ sandboxManager, startDevelopmentServer, pidfile: createPidfile() });
    const firstPreview = await manager.start("app-001");

    // Act
    const secondPreview = await manager.start("app-001");

    // Assert
    expect(secondPreview).toBe(firstPreview);
    expect(startDevelopmentServer).toHaveBeenCalledTimes(1);
  });

  it("stop：停止运行中的应用时，应关闭进程、移除映射并释放沙箱", async () => {
    // Arrange
    const sandbox = createSandbox();
    const viteProcess = createProcess();
    const sandboxManager = {
      acquire: vi.fn(async () => sandbox),
      release: vi.fn(async () => undefined)
    };
    const pidfile = createPidfile();
    const manager = new LocalPreviewManager({
      sandboxManager,
      startDevelopmentServer: vi.fn(async () => viteProcess.process),
      pidfile
    });
    await manager.start("app-001");

    // Act
    await manager.stop("app-001");

    // Assert
    expect(viteProcess.process.stop).toHaveBeenCalledTimes(1);
    expect(pidfile.clear).toHaveBeenCalledWith("app-001");
    expect(manager.get("app-001")).toBeUndefined();
    expect(sandboxManager.release).toHaveBeenCalledOnce();
    expect(sandboxManager.release).toHaveBeenCalledWith(sandbox);
  });

  it("进程意外退出：应移除预览映射并释放沙箱", async () => {
    // Arrange
    const sandbox = createSandbox();
    const viteProcess = createProcess();
    const sandboxManager = {
      acquire: vi.fn(async () => sandbox),
      release: vi.fn(async () => undefined)
    };
    const pidfile = createPidfile();
    const manager = new LocalPreviewManager({
      sandboxManager,
      startDevelopmentServer: vi.fn(async () => viteProcess.process),
      pidfile
    });
    await manager.start("app-001");

    // Act
    viteProcess.close();
    await vi.waitFor(() => expect(manager.get("app-001")).toBeUndefined());

    // Assert
    expect(pidfile.clear).toHaveBeenCalledWith("app-001");
    expect(sandboxManager.release).toHaveBeenCalledOnce();
    expect(sandboxManager.release).toHaveBeenCalledWith(sandbox);
  });

  it("start：沙箱获取失败时，应保留领域错误码", async () => {
    // Arrange
    const sandboxManager = {
      acquire: vi.fn(async () => {
        throw new SandboxAcquisitionError(AppCodeTaskError.APP_NOT_FOUND, "App 不存在");
      }),
      release: vi.fn(async () => undefined)
    };
    const manager = new LocalPreviewManager({
      sandboxManager,
      startDevelopmentServer: vi.fn(),
      pidfile: createPidfile()
    });

    // Act
    const result = manager.start("missing-app");

    // Assert
    await expect(result).rejects.toMatchObject({ code: AppCodeTaskError.APP_NOT_FOUND });
  });
});
