/**
 * TypeScript Worker Wrapper
 *
 * 使用 tsx 加载 TypeScript worker 文件
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { register } from "tsx/esm/api";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 注册 tsx 以支持 TypeScript
register();

// 动态导入实际的 TypeScript worker
// 使用 file:// URL 确保正确加载
const workerPath = pathToFileURL(resolve(__dirname, "./static-server.worker.ts")).href;
await import(workerPath);
