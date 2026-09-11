import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { terminateProcessTree } from "../../shared/process-tree";

/** pidfile 中持久化的预览进程信息。 */
export interface PreviewPidfileData {
  /** 预览进程树根进程（cmd/pnpm/vite 链的最外层）的进程 ID。 */
  readonly pid: number;
  /** 预览服务监听的本地端口。 */
  readonly port: number;
}

/** LocalPreviewManager 依赖的 pidfile 读写与孤儿回收能力。 */
export interface PreviewPidfile {
  /** 终止上一个 Screenwright 实例遗留的孤儿预览进程并清理 pidfile。 */
  terminateStale(appId: string): Promise<void>;
  /** 记录当前预览进程信息，供进程重启后回收使用。 */
  save(appId: string, data: PreviewPidfileData): Promise<void>;
  /** 清理预览对应的 pidfile。 */
  clear(appId: string): Promise<void>;
}

/**
 * 基于系统临时目录的 pidfile 实现。
 *
 * pidfile 独立于 App 工作区存放，避免被任务分支的 `git add -A` 提交；
 * 文件在进程重启后仍然存在，使新的 Screenwright 实例可以回收旧实例遗留的
 * 孤儿预览进程。
 */
export function createTempDirPreviewPidfile(): PreviewPidfile {
  return {
    terminateStale: terminateStalePreviewProcess,
    save: writePreviewPidfile,
    clear: removePreviewPidfile
  };
}

/** 由 appId 派生 pidfile 路径；appId 中的特殊字符会被清理，防止路径注入。 */
function previewPidfilePath(appId: string): string {
  const safeAppId = appId.replace(/[^A-Za-z0-9_-]/g, "-");
  return path.join(tmpdir(), `screenwright-preview-${safeAppId}.json`);
}

/** 读回 pidfile；文件不存在或内容无效时返回 undefined。 */
async function readPreviewPidfile(appId: string): Promise<PreviewPidfileData | undefined> {
  let content: string;
  try {
    content = await readFile(previewPidfilePath(appId), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw error;
  }

  return parsePidfileContent(content);
}

function parsePidfileContent(content: string): PreviewPidfileData | undefined {
  try {
    const parsed = JSON.parse(content) as { pid?: unknown; port?: unknown };
    if (isPositiveInteger(parsed.pid) && isPositiveInteger(parsed.port)) {
      return { pid: parsed.pid as number, port: parsed.port as number };
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

async function writePreviewPidfile(appId: string, data: PreviewPidfileData): Promise<void> {
  await writeFile(previewPidfilePath(appId), JSON.stringify(data), "utf8");
}

async function removePreviewPidfile(appId: string): Promise<void> {
  await rm(previewPidfilePath(appId), { force: true });
}

/**
 * 回收孤儿预览进程：读取 pidfile，若其指向的进程仍然存活则终止整个进程树。
 *
 * 无论进程是否存活都会先删除 pidfile；进程已死时不再做任何处理。
 * 终止失败不抛出，孤儿进程最多存活到下一次手动清理，不影响新预览启动。
 */
async function terminateStalePreviewProcess(appId: string): Promise<void> {
  const data = await readPreviewPidfile(appId);
  await removePreviewPidfile(appId);
  if (!data || !isProcessAlive(data.pid)) {
    return;
  }
  await terminateProcessTree(data.pid);
}

/** 通过信号 0 探测进程是否存活；EPERM 表示进程存在但无权发信号。 */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}
