import { readFileSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), applyComponentCreate: vi.fn() }));
vi.mock("@/mastra/storage/prisma", () => ({ prismaClient: { module: { findMany: mocks.findMany } } }));
vi.mock("@/mastra/services/bi-data-sync/screen-mutation", () => ({
  applyComponentCreate: mocks.applyComponentCreate
}));
vi.mock("@/mastra/tools/change-report", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  readCreatedChange: vi.fn().mockResolvedValue(undefined)
}));

import { createComponentTool } from "@/mastra/tools/create-component";

const template = JSON.parse(
  readFileSync(path.resolve(__dirname, "../data-read/mock/screen_75_1/component/4152_条形图.json"), "utf8")
);
const execute = createComponentTool.execute as unknown as (
  input: Record<string, unknown>,
  context: Record<string, unknown>
) => Promise<{ success: boolean; message: string; filePath?: string }>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findMany.mockResolvedValue([{ name: "条形图", javaScript: JSON.stringify(template) }]);
  mocks.applyComponentCreate.mockResolvedValue({ filePath: "screen_75_1/component/9101_条形图.json" });
});

describe("create_component 首次执行与恢复执行的空值语义", () => {
  it.each([
    ["截图中的批量入参", { components: [{ componentName: "条形图" }], placement: null, overrides: null }],
    ["批量模式的空 componentName", { components: [{ componentName: "条形图" }], componentName: null }],
    ["单个模式的空 components", { componentName: "条形图", components: null, overrides: null }]
  ])("%s：前端创建后能正常恢复并写入工作区", async (_label, args) => {
    const input = { screenId: "75_1", ...args };
    const suspend = vi.fn().mockResolvedValue(undefined);

    // 使用真实 Tool.execute 包装：首次校验会处理 null，resume 则直接回放原始入参。
    await execute(input, { agent: { suspend } });
    expect(suspend).toHaveBeenCalledTimes(1);
    expect(mocks.applyComponentCreate).not.toHaveBeenCalled();
    const component = { ...suspend.mock.calls[0][0].items[0].component, id: 9101 };

    const result = await execute(input, {
      agent: { suspend, resumeData: { results: [{ index: 0, component }] } }
    });

    expect(result.success).toBe(true);
    expect(mocks.applyComponentCreate).toHaveBeenCalledExactlyOnceWith("75_1", component, undefined);
    expect(suspend).toHaveBeenCalledTimes(1);
  });

  it.each([
    { componentName: "条形图" },
    { placement: { parentId: 4156, parentType: "group" } },
    { overrides: { name: "冲突的顶层配置" } }
  ])("批量模式仍拒绝实际的顶层配置：%j", async (conflict) => {
    const suspend = vi.fn();
    const result = await execute(
      { screenId: "75_1", components: [{ componentName: "条形图" }], ...conflict },
      { agent: { suspend } }
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("传了 components");
    expect(suspend).not.toHaveBeenCalled();
    expect(mocks.applyComponentCreate).not.toHaveBeenCalled();
  });
});
