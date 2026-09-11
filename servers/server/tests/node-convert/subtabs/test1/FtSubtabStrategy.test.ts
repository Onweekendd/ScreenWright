import { beforeEach, describe, expect, it, vi } from "vitest";

import { getComponentDefaultConfigByModuleId } from "@/mastra/tools/utils";
import type { FtSubtabs } from "@/mastra/workflows/figma-to-bi/steps/node-convert/strategies/FtSubtabStrategy";

import { makeMockDefaultConfig, runConvert } from "../helpers";
import subtabsData from "../subtabs.json";
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

describe("FtSubtabStrategy", () => {
  beforeEach(() => {
    vi.mocked(getComponentDefaultConfigByModuleId).mockResolvedValue(
      makeMockDefaultConfig() as unknown as Awaited<ReturnType<typeof getComponentDefaultConfigByModuleId>>
    );
  });

  describe("convert，主题选择1-subtab（3 个 tabitem 子节点）", () => {
    it('convert，正常节点，message 包含"成功转换"', async () => {
      const result = await runConvert(mockData);

      expect(result.message).toContain("成功转换");
    });

    it("convert，3 个 tabitem 子节点，data 长度为 3", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.data).toHaveLength(3);
    });

    it("convert，按 absolutePosition 推算，option.columns 为 3", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.option.columns).toBe(3);
    });

    it("convert，3 个 tabitem 同 y=0，option.rows 为 1", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.option.rows).toBe(1);
    });

    it("convert，相邻 tabitem 间距 43px，option.columnGap 为 43", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      // 三个 tabitem 按 x 排列：x=0..237, x=280..517, x=560..797，gap = 43
      expect(component.option.columnGap).toBe(43);
    });

    it("convert，data[0].label 来自首个 tabitem 的 TEXT 子节点，为 '五大深耕行业'", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.data[0].label).toBe("五大深耕行业");
    });

    it("convert，data[1].label 来自第二个 tabitem 的 TEXT 子节点，为 '四大核心技术'", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.data[1].label).toBe("四大核心技术");
    });

    it("convert，data[2].label 来自第三个 tabitem 的 TEXT 子节点，为 '三大发展历程'", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.data[2].label).toBe("三大发展历程");
    });

    it('convert，data value 按顺序从 0 开始，data[0].value 为"0"', async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.data[0].value).toBe("0");
    });

    it("convert，layout 宽度从 layout_c0cd02 提取，component.width 为 789", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.component.width).toBe(789);
    });

    it("convert，layout 高度从 layout_c0cd02 提取，component.height 为 52", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.component.height).toBe(52);
    });

    it("convert，layout 绝对坐标 x=0 y=0，left 为 0 top 为 0", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.left).toBe(0);
      expect(component.top).toBe(0);
    });

    it('convert，节点 name 为"主题选择1-subtab"，component.name 为"主题选择1-subtab"', async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.name).toBe("主题选择1-subtab");
    });

    it("convert，tabitem 无 componentProperties 变体属性，seriesTabsList 保留默认配置中的 3 条", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      // 无 active/noActive 变体时 strategy 不写入 seriesTabsList，保留默认配置原值
      expect(component.option.seriesTabsList).toHaveLength(subtabsData.config.option.seriesTabsList.length);
    });

    it("convert，textStyle.fontSize=24，defaultObj.fontSize 提取为 24", async () => {
      const result = await runConvert(mockData);
      const component = result.component as FtSubtabs;

      expect(component.option.defaultObj.fontSize).toBe(24);
    });
  });
});
