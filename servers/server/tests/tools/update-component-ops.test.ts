import { cpSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 这些工具先写工作区再挂起推前端，不能直接用只读的 mock 目录。
// 它们在模块加载时就把工作区路径快照下来了，所以环境变量必须在 import 之前（vi.hoisted）就设好
const OUTPUT_DIR = vi.hoisted(() => {
  const dir = `${process.cwd().split("\\").join("/")}/tests/tools/output-update-component`;
  process.env.MASTRA_WORKSPACE_PATH = dir;
  return dir;
});

import { configureCallbackArgs } from "@/mastra/tools/configure-callback-args";
import { createEventTemplate } from "@/mastra/tools/create-event-template";

const SCREEN_ID = "75_1";
const FIXTURE = path.resolve(__dirname, "..", "data-read", "mock", `screen_${SCREEN_ID}`);
const screenDir = path.join(OUTPUT_DIR, `screen_${SCREEN_ID}`);

type Execute = (input: Record<string, unknown>, context: Record<string, unknown>) => Promise<unknown>;

const callbackInput = { componentRef: `${SCREEN_ID}/4152`, args: [{ origin: "name", target: "selectedName" }] };
const eventInput = { eventName: "点击", insertTo: `screen_${SCREEN_ID}/component/4152/events/0` };

const tools = [
  ["configure_callback_args", configureCallbackArgs, callbackInput, "回调参数"],
  ["createEventTemplate", createEventTemplate, eventInput, "推送组件更新"]
] as const;

/** 首次执行：收下工具挂起时发给前端的载荷。mode 不传就是自动模式 */
const suspendedPayload = async (
  tool: { execute?: unknown },
  input: Record<string, unknown>,
  mode?: string
): Promise<Record<string, unknown>> => {
  let payload: Record<string, unknown> | undefined;
  await (tool.execute as Execute)(input, {
    requestContext: { get: (key: string) => (key === "mode" ? mode : undefined) },
    agent: {
      suspend: async (p: Record<string, unknown>) => {
        payload = p;
      }
    }
  });
  return payload!;
};

const resume = (tool: { execute?: unknown }, input: Record<string, unknown>, resumeData: Record<string, unknown>) =>
  (tool.execute as Execute)(input, {
    requestContext: { get: () => undefined },
    agent: { resumeData, suspend: async () => undefined }
  });

/**
 * 「先写工作区、再挂起推前端」的这几个工具改成发 update_component op 之后的协议行为。
 * 它们和 edit_files 同属组件更新，前端是同一个处理函数。
 */
describe.each(tools)("%s 的 canvas_ops 协议", (_name, tool, input, purposeHint) => {
  beforeEach(() => {
    rmSync(OUTPUT_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    cpSync(FIXTURE, screenDir, { recursive: true, filter: (src) => !src.split(/[\\/]/).includes(".git") });
    // 这两个工具直接拿磁盘文本过 schema，夹具里是旧的数字层级；真实工作区由后端写出，本来就是字符串键
    const file = path.join(screenDir, "component", "4152_条形图.json");
    writeFileSync(file, JSON.stringify({ ...JSON.parse(readFileSync(file, "utf8")), zIndex: "a0" }, null, 2));
  });

  afterEach(() => rmSync(OUTPUT_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }));

  it("自动模式：发 update_component op，载荷里的组件 id 是纯数字，不带 approval", async () => {
    const payload = await suspendedPayload(tool, input);

    expect(payload.type).toBe("canvas_ops");
    expect(payload.approval).toBeUndefined();
    expect(payload.ops).toEqual([expect.objectContaining({ op: "update_component", component: expect.anything() })]);
    expect((payload.ops as Array<{ component: { id: unknown } }>)[0].component.id).toBe(4152);
  });

  it("ASK 模式：同一个 canvas_ops 带上 approval", async () => {
    const payload = await suspendedPayload(tool, input, "ask_before_edit");

    expect(payload.type).toBe("canvas_ops");
    expect(payload.approval).toEqual({ purpose: expect.stringContaining(purposeHint) });
  });

  it("前端应用成功：正常收尾", async () => {
    await suspendedPayload(tool, input);

    await expect(resume(tool, input, { results: [{ ok: true }] })).resolves.toBeDefined();
  });

  it("前端应用失败：抛出前端给的原因", async () => {
    await suspendedPayload(tool, input);

    await expect(resume(tool, input, { results: [{ ok: false, error: "前端离线" }] })).rejects.toThrow("前端离线");
  });

  it("用户拒绝：如实说明工作区已写入、画布未应用，而不是重新挂起一遍", async () => {
    await suspendedPayload(tool, input);

    await expect(resume(tool, input, { approved: false })).rejects.toThrow("用户拒绝");
  });
});
