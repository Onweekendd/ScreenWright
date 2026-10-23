import { readFileSync } from "fs";
import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
vi.mock("@/mastra/storage/prisma", () => ({ prismaClient: { module: { findMany } } }));

import { createComponentTool } from "@/mastra/tools/create-component";

/** 组件模板：库里 Module.javaScript 存的就是整个组件 json，这里拿 mock 大屏里的条形图当模板 */
const TEMPLATE = readFileSync(
  path.resolve(__dirname, "..", "data-read", "mock", "screen_75_1", "component", "4152_条形图.json"),
  "utf8"
);

const execute = createComponentTool.execute as unknown as (
  input: Record<string, unknown>,
  context: Record<string, unknown>
) => Promise<{ success: boolean; message: string }>;

const run = (overrides: Record<string, unknown>) => {
  const suspended: Array<Record<string, unknown>> = [];
  const result = execute(
    { screenId: "75_1", componentName: "条形图", overrides },
    {
      requestContext: { get: () => undefined },
      agent: { suspend: async (payload: Record<string, unknown>) => void suspended.push(payload) }
    }
  );
  return { result, suspended };
};

beforeEach(() => {
  findMany.mockResolvedValue([{ name: "条形图", javaScript: TEMPLATE }]);
});

describe("create_component 的 title", () => {
  it("overrides 改 title 被拒绝，不交给前端，提示用 name 起名", async () => {
    const { result, suspended } = run({ title: "销售额" });

    const outcome = await result;
    expect(suspended).toHaveLength(0);
    expect(outcome.success).toBe(false);
    expect(outcome.message).toContain("title 是组件类型标识");
  });

  it("用 name 起名照常创建，title 保持类型名", async () => {
    const { result, suspended } = run({ name: "销售额" });

    await result;
    expect(suspended).toHaveLength(1);
    expect(suspended[0]).toMatchObject({ ops: [{ component: { name: "销售额", title: "条形图" } }] });
  });
});
