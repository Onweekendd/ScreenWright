import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * 取 SQLite 连接 URL，并保证 `file:` 路径所在目录存在。
 *
 * libsql / better-sqlite3 打开不存在目录下的文件会直接报 SQLITE_CANTOPEN（14），
 * 全新 checkout（CI、首次 clone）没有 `.data/`，模块顶层 `new LibSQLVector(...)` 就会炸。
 * 相对路径以进程 cwd（servers/server）为基准，与 .env.example 的约定一致。
 */
export function sqliteUrl(envName: string, fallback: string): string {
  const url = process.env[envName] ?? fallback;
  if (url.startsWith("file:")) {
    const filePath = url.slice("file:".length).replace(/^\/\/+/, "");
    if (filePath && filePath !== ":memory:") {
      mkdirSync(dirname(filePath), { recursive: true });
    }
  }
  return url;
}
