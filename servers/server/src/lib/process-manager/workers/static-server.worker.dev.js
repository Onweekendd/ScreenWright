/**
 * 开发环境 Worker 包装器
 *
 * 使用 tsx 加载 TypeScript worker 文件
 */

const { pathToFileURL } = require("url");
const { Worker } = require("worker_threads");
const path = require("path");

// 获取 TS worker 文件路径
const tsWorkerPath = path.resolve(__dirname, "static-server.worker.ts");

// 使用 tsx 加载
// 注意：这需要在项目根目录安装了 tsx
const tsxPath = require.resolve("tsx");

// 动态导入并执行
async function loadWorker() {
  const { register } = require(tsxPath);
  register();

  // 加载 TypeScript worker
  require(tsWorkerPath);
}

loadWorker().catch((err) => {
  console.error("Failed to load worker:", err);
  process.exit(1);
});
