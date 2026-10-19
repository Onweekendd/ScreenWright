import path from "node:path";

import { build } from "esbuild";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");

/** 以 entry 为入口打包（第三方包外置），返回它依赖到的本地源文件和外部包 */
async function dependencyGraph(entry: string) {
  const result = await build({
    entryPoints: [path.join(root, entry)],
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    write: false,
    metafile: true,
    alias: { "@": path.join(root, "src"), "~": root },
    logLevel: "silent"
  });
  const local = Object.keys(result.metafile.inputs).map((f) => f.replaceAll("\\", "/"));
  const external = new Set<string>();
  for (const input of Object.values(result.metafile.inputs)) {
    for (const imp of input.imports) {
      if (imp.external) {
        external.add(imp.path);
      }
    }
  }
  return { local, external: [...external] };
}

/** AI 运行时：Mastra 实例、agent、工具、工作区、沙箱 */
const AI_RUNTIME_LOCAL = /src\/(mastra\/(index|runtime|agents|tools|workspace|mcp)\b|artifact-app\/)/;
/** api 连整个 AI 侧都不该碰：工作流、对话录制也算（figma-to-bi/utils 下的纯工具函数除外） */
const AI_STACK_LOCAL =
  /src\/(mastra\/(index|runtime|agents|workflows\/(?!figma-to-bi\/utils\/)|tools|workspace|mcp)|artifact-app|recording)\b/;

describe("角色之间的依赖隔离", () => {
  it("api 角色不会引入 Mastra / agent / 沙箱 / 队列", async () => {
    const { local, external } = await dependencyGraph("src/entry/mount-api.ts");

    expect(local.filter((f) => AI_STACK_LOCAL.test(f) || f.includes("src/queue/"))).toEqual([]);
    expect(external.filter((p) => /^(@mastra\/|bullmq|ioredis)/.test(p))).toEqual([]);
  });

  it("worker 角色不会引入 HTTP 路由 / Mastra 运行时", async () => {
    const { local, external } = await dependencyGraph("src/entry/worker.ts");

    // 生图任务依赖模型注册表（带 recording 的 fetch 包装）和一个纯工具函数，这两个允许；
    // 真正的 AI 运行时（Mastra 实例 / agent / 工具 / 沙箱）和 HTTP 路由都不应出现
    expect(local.filter((f) => AI_RUNTIME_LOCAL.test(f) || f.includes("src/mastra/routes/"))).toEqual([]);
    expect(external.filter((p) => /^(@mastra\/core|@mastra\/hono|hono$)/.test(p))).toEqual([]);
  });
});
