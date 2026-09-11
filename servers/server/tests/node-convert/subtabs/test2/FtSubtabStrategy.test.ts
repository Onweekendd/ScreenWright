import { beforeEach, describe, expect, it, vi } from "vitest";

import { getComponentDefaultConfigByModuleId } from "@/mastra/tools/utils";
import type { FtSubtabs } from "@/mastra/workflows/figma-to-bi/steps/node-convert/strategies/FtSubtabStrategy";

import { makeMockDefaultConfig, runConvert } from "../helpers";
import mockData from "./data.mock.json";

vi.mock("@/mastra/tools/utils", async () => {
  const actual = (await vi.importActual("@/mastra/tools/utils")) as Record<string, unknown>;
  return {
    ...actual,
    getComponentDefaultConfigByModuleId: vi.fn()
  };
});

vi.mock("@/mastra/services/figma-node-asset.server", () => ({
  batchByNodeIds: vi.fn().mockResolvedValue({ data: [] })
}));

vi.mock("@/mastra/state", () => ({
  stateManager: {
    getStore: vi.fn().mockReturnValue({
      getAllNodes: vi.fn().mockReturnValue([])
    })
  }
}));

vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: { module: { findFirst: vi.fn() } }
}));

// ── 测试套件 ────────────────────────────────────────────────────────
// test2 数据特点：
//   - 根 INSTANCE name = "二级导航-subtab"，dimensions 452×45，x=0 y=0
//   - 2 个 tabitem 子节点（同行，y≈3-4）：
//     index 0: 做好承接人-tabitem  (x=252, w=200)  componentProperties: noActive
//     index 1: 当好收信人-tabitem  (x=0,   w=202)  componentProperties: active
//   - TEXT 字号 22；做好承接人 fontWeight=500，当好收信人 fontWeight=700

describe("FtSubtabStrategy", () => {
  beforeEach(() => {
    vi.mocked(getComponentDefaultConfigByModuleId).mockResolvedValue(
      makeMockDefaultConfig() as unknown as Awaited<ReturnType<typeof getComponentDefaultConfigByModuleId>>
    );
  });

  describe("convert，二级导航-subtab（2 个 tabitem，带 active/noActive 变体）", () => {
    it('convert，正常节点，message 包含"成功转换"', async () => {
      const result = await runConvert(mockData);

      expect(result.message).toContain("成功转换");
    });

    it("convert，2 个 tabitem 子节点，data 长度为 2", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.data).toHaveLength(2);
    });

    it("convert，按 absolutePosition 推算，option.columns 为 2", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.option.columns).toBe(2);
    });

    it("convert，2 个 tabitem 同行，option.rows 为 1", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.option.rows).toBe(1);
    });

    it("convert，相邻 tabitem 间距 50px，option.columnGap 为 50", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      // 按 x 排序：当好(0..202) → 做好(252..452)，gap = 50
      expect(component.option.columnGap).toBe(50);
    });

    it("convert，subtab(45h) 内 tabitem 顶部 y=3，option.paddingTop 为 3", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.option.paddingTop).toBe(3);
    });

    it("convert，tabitem 覆盖到 subtab 底部，option.paddingBottom 为 0", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.option.paddingBottom).toBe(0);
    });

    it("convert，data[0].label 来自第一个 tabitem 的 TEXT 节点 text 字段", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.data[0].label).toBe("  做好“承接人”");
    });

    it("convert，data[1].label 来自第二个 tabitem 的 TEXT 节点 text 字段", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.data[1].label).toBe("  当好“收信人”");
    });

    it("convert，索引 1 的 tabitem 变体值为 active，option.active 为 1", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.option.active).toBe(1);
    });

    it("convert，active tabitem 字重 700，activeObj.fontWeight 为 true（>=700 转 true）", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.option.activeObj.fontWeight).toBe(true);
    });

    it("convert，noActive tabitem 字重 500，defaultObj.fontWeight 为 500", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.option.defaultObj.fontWeight).toBe(500);
    });

    it("convert，TEXT fontSize=22，activeObj.fontSize 与 defaultObj.fontSize 均为 22", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.option.activeObj.fontSize).toBe(22);
      expect(component.option.defaultObj.fontSize).toBe(22);
    });

    it("convert，layout 宽度从 layout_6ebe7c 提取，component.width 为 452", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.component.width).toBe(452);
    });

    it("convert，layout 高度从 layout_6ebe7c 提取，component.height 为 45", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.component.height).toBe(45);
    });

    it('convert，节点 name 为"二级导航-subtab"，component.name 为"二级导航-subtab"', async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.name).toBe("二级导航-subtab");
    });
  });
});
