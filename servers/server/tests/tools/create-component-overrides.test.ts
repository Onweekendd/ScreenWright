import { readFileSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
vi.mock("@/mastra/storage/prisma", () => ({ prismaClient: { module: { findMany } } }));

import { createComponentTool } from "@/mastra/tools/create-component";

const template = readFileSync(
  path.resolve(__dirname, "../data-read/mock/screen_75_1/component/4152_条形图.json"),
  "utf8"
);
const execute = createComponentTool.execute as unknown as (
  input: Record<string, unknown>,
  context: Record<string, unknown>
) => Promise<{ success: boolean; validationErrors?: string[] }>;

beforeEach(() => {
  findMany.mockResolvedValue([{ name: "条形图", javaScript: template }]);
});

describe("create_component 的位置和尺寸", () => {
  it("顶层尺寸在创建前被拒绝，并提示正确的嵌套路径", async () => {
    const suspend = vi.fn();
    const result = await execute(
      { screenId: "75_1", componentName: "条形图", overrides: { left: 0, top: 0, width: 1920, height: 1080 } },
      { agent: { suspend } }
    );

    expect(result.success).toBe(false);
    expect(suspend).not.toHaveBeenCalled();
    expect(result.validationErrors).toEqual([
      expect.stringContaining("overrides.component.width"),
      expect.stringContaining("overrides.component.height")
    ]);
    expect(result.validationErrors?.join("\n")).not.toContain("是否想写：id");
  });

  it("嵌套尺寸与顶层位置合并到模板后交给前端", async () => {
    const suspend = vi.fn().mockResolvedValue(undefined);
    await execute(
      {
        screenId: "75_1",
        componentName: "条形图",
        overrides: { left: 12, top: 24, component: { width: 1920, height: 1080 } }
      },
      { agent: { suspend } }
    );

    expect(suspend).toHaveBeenCalledTimes(1);
    expect(suspend.mock.calls[0][0].items[0].component).toMatchObject({
      left: 12,
      top: 24,
      component: { prop: JSON.parse(template).component.prop, width: 1920, height: 1080 }
    });
  });
});
