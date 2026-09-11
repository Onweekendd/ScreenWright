/**
 * Worker 开发环境包装器
 *
 * 使用 tsx 加载 TypeScript worker 文件
 */

// 注册 tsx 以支持 TypeScript
const tsx = require("tsx");

// 加载 TypeScript worker
require("./static-server.worker.ts");
