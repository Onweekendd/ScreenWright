/**
 * Lazy accessor for proper-lockfile.
 *
 * proper-lockfile depends on graceful-fs, which monkey-patches every fs
 * method on first require (~8ms). Static imports of proper-lockfile pull this
 * cost into the startup path even when no locking happens (e.g. `--help`).
 *
 * Import this module instead of `proper-lockfile` directly. The underlying
 * package is only loaded the first time a lock function is actually called.
 */

import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { CheckOptions, LockOptions, UnlockOptions } from "proper-lockfile";
import * as lockfile from "proper-lockfile";

export { lockfile };

export function lock(file: string, options?: LockOptions): Promise<() => Promise<void>> {
  return lockfile.lock(file, options);
}

export function lockSync(file: string, options?: LockOptions): () => void {
  return lockfile.lockSync(file, options);
}

export function unlock(file: string, options?: UnlockOptions): Promise<void> {
  return lockfile.unlock(file, options);
}

export function check(file: string, options?: CheckOptions): Promise<boolean> {
  return lockfile.check(file, options);
}

export const getTasksDir = (storageRoot: string, taskListId: string) => {
  return path.join(storageRoot, sanitizePathComponent(taskListId));
};

export async function ensureTasksDir(storageRoot: string, taskListId: string): Promise<void> {
  const dir = getTasksDir(storageRoot, taskListId);
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // Directory already exists or creation failed; callers will surface
    // errors from subsequent operations.
  }
}

/**
 * Gets the lock file path for a task list (used for list-level locking)
 */
function getTaskListLockPath(storageRoot: string, taskListId: string): string {
  return path.join(getTasksDir(storageRoot, taskListId), ".lock");
}

/**
 * Ensures the lock file exists for a task list
 */
export async function ensureTaskListLockFile(storageRoot: string, taskListId: string): Promise<string> {
  await ensureTasksDir(storageRoot, taskListId);
  const lockPath = getTaskListLockPath(storageRoot, taskListId);
  // proper-lockfile requires the target file to exist. Create it with the
  // 'wx' flag (write-exclusive) so concurrent callers don't both create it,
  // and the first one to create wins silently.
  try {
    await writeFile(lockPath, "", { flag: "wx" });
  } catch {
    // EEXIST or other — file already exists, which is fine.
  }
  return lockPath;
}

const HIGH_WATER_MARK_FILE = ".highwatermark";

function getHighWaterMarkPath(storageRoot: string, taskListId: string): string {
  return path.join(getTasksDir(storageRoot, taskListId), HIGH_WATER_MARK_FILE);
}

export async function readHighWaterMark(storageRoot: string, taskListId: string): Promise<number> {
  const path = getHighWaterMarkPath(storageRoot, taskListId);
  try {
    const content = (await readFile(path, "utf-8")).trim();
    const value = parseInt(content, 10);
    return isNaN(value) ? 0 : value;
  } catch {
    return 0;
  }
}

export async function writeHighWaterMark(storageRoot: string, taskListId: string, value: number): Promise<void> {
  const path = getHighWaterMarkPath(storageRoot, taskListId);
  await writeFile(path, String(value));
}

/**
 * Finds the highest task ID from existing task files (not including high water mark).
 */
export async function findHighestTaskIdFromFiles(storageRoot: string, taskListId: string): Promise<number> {
  const dir = getTasksDir(storageRoot, taskListId);
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return 0;
  }
  let highest = 0;
  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }
    const taskId = parseInt(file.replace(".json", ""), 10);
    if (!isNaN(taskId) && taskId > highest) {
      highest = taskId;
    }
  }
  return highest;
}

/**
 * Sanitizes a string for safe use in file paths.
 * Removes path traversal characters and other potentially dangerous characters.
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
export function sanitizePathComponent(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function getTaskPath(storageRoot: string, taskListId: string, taskId: string): string {
  return path.join(getTasksDir(storageRoot, taskListId), `${sanitizePathComponent(taskId)}.json`);
}

/**
 * Finds the highest task ID ever assigned, considering both existing files
 * and the high water mark (for deleted/reset tasks).
 */
export async function findHighestTaskId(storageRoot: string, taskListId: string): Promise<number> {
  const [fromFiles, fromMark] = await Promise.all([
    findHighestTaskIdFromFiles(storageRoot, taskListId),
    readHighWaterMark(storageRoot, taskListId)
  ]);
  return Math.max(fromFiles, fromMark);
}
