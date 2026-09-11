import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { readFileSync } from "fs";
import dts from "rollup-plugin-dts";
import esbuild from "rollup-plugin-esbuild";

/**
 * 项目依赖配置
 * @type {{ dependencies?: Record<string, string>, devDependencies?: Record<string, string> }}
 * @description 从 package.json 读取的依赖信息
 */
const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));

/**
 * 外部依赖正则表达式数组
 * @type {RegExp[]}
 * @description 所有依赖包都标记为外部依赖，避免打包到 bundle 中
 */
const external = [
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {})
].map((name) => new RegExp(`^${name}(/.*)?$`));

/**
 * Rollup 基础插件配置
 * @type {import('rollup').Plugin[]}
 * @description 用于处理 TypeScript、模块解析和 CommonJS 转换
 *
 * JS 产物只需转译，不需类型检查：改用 esbuild 只做 transpile，
 * 避免 @rollup/plugin-typescript 对整个 tsconfig include（src/tests/scripts
 * 共 200+ 文件）做全量 strict typecheck，以及对 hono `hc<AppType>` 递归类型
 * 的重推断——那正是 build:client 耗时 ~49s 且偶发卡死/OOM 的根因。
 * 类型安全仍由下方 dts 链路与独立的 `mastra:check-types` 脚本保证。
 */
const basePlugins = [
  resolve({
    extensions: [".ts", ".tsx", ".js", ".jsx"]
  }),
  commonjs(),
  esbuild({
    target: "es2022",
    tsconfig: "./tsconfig.json"
  })
];

/**
 * Rollup 打包配置
 * @type {import('rollup').RollupOptions[]}
 * @description 配置两个模块的导出：prismaType 和 apiClient
 *
 * 每个模块包含两个配置项：
 * - 代码打包：将 TypeScript 编译为 ESM 格式的 JavaScript
 * - 类型声明：生成对应的 .d.ts 类型定义文件
 *
 * @example
 * // 执行打包
 * npm run bundle
 *
 * // 使用打包后的模块
 * import type { Agent } from '@mocean/mastra/prismaType'
 * import { agentsApi } from '@mocean/mastra/apiClient'
 */
export default [
  // RPC 客户端打包
  {
    input: "src/mastra/api/client.ts",
    output: {
      file: "dist/rpcClient.js",
      format: "esm",
      sourcemap: true
    },
    external,
    plugins: basePlugins
  },
  // RPC 客户端 - 类型声明
  {
    input: "src/mastra/api/client.ts",
    output: {
      file: "dist/rpcClient.d.ts",
      format: "esm"
    },
    external,
    plugins: [dts({ respectExternal: true })]
  }
];
