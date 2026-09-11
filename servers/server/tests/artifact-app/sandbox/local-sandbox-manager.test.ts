import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { AppCodeTaskError } from "@/artifact-app/contracts/app-code-task-error";
import { LocalSandbox } from "@/artifact-app/sandbox/local/local-sandbox";
import { LocalSandboxManager } from "@/artifact-app/sandbox/local/local-sandbox-manager";

const temporaryDirectories: string[] = [];

async function createAppsRoot() {
  const appsRoot = await mkdtemp(path.join(tmpdir(), "screenwright-apps-"));
  temporaryDirectories.push(appsRoot);
  return appsRoot;
}

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("本地沙箱管理器", () => {
  it("acquire：App 目录存在时，应返回对应的本地沙箱", async () => {
    // Arrange
    const appsRoot = await createAppsRoot();
    const workspacePath = path.join(appsRoot, "app-001");
    await mkdir(workspacePath);
    const expectedWorkspacePath = await realpath(workspacePath);
    const manager = new LocalSandboxManager({ appsRoot });

    // Act
    const sandbox = await manager.acquire("app-001");

    // Assert
    expect(sandbox).toBeInstanceOf(LocalSandbox);
    expect(sandbox).toMatchObject({ appId: "app-001", workspacePath: expectedWorkspacePath });
  });

  it("acquire：appId 包含路径片段时，应返回 APP_NOT_FOUND", async () => {
    // Arrange
    const appsRoot = await createAppsRoot();
    const manager = new LocalSandboxManager({ appsRoot });

    // Act
    const result = manager.acquire("../outside");

    // Assert
    await expect(result).rejects.toMatchObject({ code: AppCodeTaskError.APP_NOT_FOUND });
  });

  it("acquire：App 目录不存在时，应初始化项目并返回本地沙箱", async () => {
    // Arrange
    const appsRoot = await createAppsRoot();
    const workspacePath = path.join(await realpath(appsRoot), "missing-app");
    const initializeAppProject = vi.fn(async () => {
      await mkdir(workspacePath);
    });
    const manager = new LocalSandboxManager({ appsRoot, initializeAppProject });

    // Act
    const sandbox = await manager.acquire("missing-app");

    // Assert
    expect(initializeAppProject).toHaveBeenCalledWith({ workspacePath });
    expect(sandbox).toMatchObject({ appId: "missing-app", workspacePath: await realpath(workspacePath) });
  });

  it("acquire：项目初始化失败时，应返回 SANDBOX_UNAVAILABLE", async () => {
    // Arrange
    const appsRoot = await createAppsRoot();
    const initializeAppProject = vi.fn().mockRejectedValue(new Error("install failed"));
    const manager = new LocalSandboxManager({ appsRoot, initializeAppProject });

    // Act
    const result = manager.acquire("app-001");

    // Assert
    await expect(result).rejects.toMatchObject({ code: AppCodeTaskError.SANDBOX_UNAVAILABLE });
  });

  it("acquire：并发获取同一个缺失项目时，应只执行一次初始化", async () => {
    // Arrange
    const appsRoot = await createAppsRoot();
    const workspacePath = path.join(await realpath(appsRoot), "app-001");
    const allowInitialization = createDeferred();
    const initializeAppProject = vi.fn(async () => {
      await allowInitialization.promise;
      await mkdir(workspacePath);
    });
    const manager = new LocalSandboxManager({ appsRoot, initializeAppProject });

    // Act
    const acquisitions = Promise.all([manager.acquire("app-001"), manager.acquire("app-001")]);
    await vi.waitFor(() => expect(initializeAppProject).toHaveBeenCalledTimes(1));
    allowInitialization.resolve();
    const sandboxes = await acquisitions;

    // Assert
    expect(initializeAppProject).toHaveBeenCalledTimes(1);
    expect(sandboxes.map((sandbox) => sandbox.workspacePath)).toEqual([workspacePath, workspacePath]);
  });

  it("acquire：Apps 根路径是文件时，应返回 SANDBOX_UNAVAILABLE", async () => {
    // Arrange
    const temporaryRoot = await createAppsRoot();
    const appsRoot = path.join(temporaryRoot, "apps-root-file");
    await writeFile(appsRoot, "not a directory");
    const manager = new LocalSandboxManager({ appsRoot });

    // Act
    const result = manager.acquire("app-001");

    // Assert
    await expect(result).rejects.toMatchObject({ code: AppCodeTaskError.SANDBOX_UNAVAILABLE });
  });

  it("acquire：App 符号链接指向根目录之外时，应返回 APP_NOT_FOUND", async () => {
    // Arrange
    const appsRoot = await createAppsRoot();
    const outsideDirectory = await createAppsRoot();
    await symlink(outsideDirectory, path.join(appsRoot, "app-link"), "junction");
    const manager = new LocalSandboxManager({ appsRoot });

    // Act
    const result = manager.acquire("app-link");

    // Assert
    await expect(result).rejects.toMatchObject({ code: AppCodeTaskError.APP_NOT_FOUND });
  });

  it("release：释放本地沙箱时，不应删除其工作区", async () => {
    // Arrange
    const appsRoot = await createAppsRoot();
    const workspacePath = path.join(appsRoot, "app-001");
    await mkdir(workspacePath);
    const expectedWorkspacePath = await realpath(workspacePath);
    const manager = new LocalSandboxManager({ appsRoot });
    const sandbox = await manager.acquire("app-001");

    // Act
    await manager.release(sandbox);

    // Assert
    await expect(manager.acquire("app-001")).resolves.toMatchObject({
      workspacePath: expectedWorkspacePath
    });
  });
});
