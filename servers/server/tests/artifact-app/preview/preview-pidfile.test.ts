import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createTempDirPreviewPidfile } from "@/artifact-app/preview/local/preview-pidfile";

function appId() {
  return `test-${randomUUID()}`;
}

function pidfilePathOf(appId: string) {
  return path.join(tmpdir(), `screenwright-preview-${appId}.json`);
}

/** 启动一个存活的子进程，返回其 PID 与退出回调。 */
function spawnAliveProcess() {
  const child = spawn(process.execPath, ["-e", "setTimeout(() => {}, 30_000)"], {
    stdio: "ignore",
    windowsHide: true
  });
  const exited = new Promise<void>((resolve) => {
    child.once("close", () => resolve());
  });
  return { pid: child.pid as number, exited };
}

/** 启动一个立即退出的子进程，返回其已不可用的 PID。 */
async function spawnDeadProcessPid(): Promise<number> {
  const child = spawn(process.execPath, ["-e", ""], { stdio: "ignore", windowsHide: true });
  await new Promise<void>((resolve) => {
    child.once("close", () => resolve());
  });
  return child.pid as number;
}

const usedAppIds: string[] = [];

afterEach(async () => {
  await Promise.all(usedAppIds.splice(0).map((id) => rm(pidfilePathOf(id), { force: true })));
});

function createTrackedAppId() {
  const id = appId();
  usedAppIds.push(id);
  return id;
}

describe("预览 pidfile", () => {
  it("save：应把 PID 与端口写入系统临时目录", async () => {
    // Arrange
    const appId = createTrackedAppId();
    const pidfile = createTempDirPreviewPidfile();

    // Act
    await pidfile.save(appId, { pid: 43120, port: 43123 });

    // Assert
    await expect(readFile(pidfilePathOf(appId), "utf8")).resolves.toBe('{"pid":43120,"port":43123}');
  });

  it("clear：应删除对应的 pidfile", async () => {
    // Arrange
    const appId = createTrackedAppId();
    const pidfile = createTempDirPreviewPidfile();
    await pidfile.save(appId, { pid: 43120, port: 43123 });

    // Act
    await pidfile.clear(appId);

    // Assert
    await expect(readFile(pidfilePathOf(appId), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("terminateStale：pidfile 不存在时，应为空操作", async () => {
    // Arrange
    const appId = createTrackedAppId();
    const pidfile = createTempDirPreviewPidfile();

    // Act + Assert
    await expect(pidfile.terminateStale(appId)).resolves.toBeUndefined();
  });

  it("terminateStale：记录的进程已退出时，应仅清理 pidfile", async () => {
    // Arrange
    const appId = createTrackedAppId();
    const pidfile = createTempDirPreviewPidfile();
    const deadPid = await spawnDeadProcessPid();
    await pidfile.save(appId, { pid: deadPid, port: 43123 });

    // Act
    await pidfile.terminateStale(appId);

    // Assert
    await expect(readFile(pidfilePathOf(appId), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("terminateStale：记录的进程仍存活时，应终止进程树并清理 pidfile", async () => {
    // Arrange
    const appId = createTrackedAppId();
    const pidfile = createTempDirPreviewPidfile();
    const child = spawnAliveProcess();
    await pidfile.save(appId, { pid: child.pid, port: 43123 });

    // Act
    await pidfile.terminateStale(appId);

    // Assert
    await child.exited;
    await expect(readFile(pidfilePathOf(appId), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("terminateStale：pidfile 内容无效时，应清理文件且不抛出", async () => {
    // Arrange
    const appId = createTrackedAppId();
    const pidfile = createTempDirPreviewPidfile();
    const { writeFile } = await import("node:fs/promises");
    await writeFile(pidfilePathOf(appId), "not-json", "utf8");

    // Act
    await pidfile.terminateStale(appId);

    // Assert
    await expect(readFile(pidfilePathOf(appId), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
});
