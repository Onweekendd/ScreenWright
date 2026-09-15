import { beforeEach, describe, expect, it, vi } from "vitest";

import { getComponentDefaultConfigByModuleId } from "@/mastra/tools/utils";
import type { SwRichtext } from "@/mastra/workflows/figma-to-bi/steps/node-convert/strategies/SwRichtextStrategy";

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

describe("SwRichtextStrategy", () => {
  beforeEach(() => {
    vi.mocked(getComponentDefaultConfigByModuleId).mockResolvedValue(
      makeMockDefaultConfig() as unknown as Awaited<ReturnType<typeof getComponentDefaultConfigByModuleId>>
    );
  });

  describe("convert，TEXT 节点带 characterStyleOverrides（5-9 字符 fontSize=32 + 蓝色）", () => {
    it('convert，正常节点，message 包含"成功转换"', async () => {
      const result = await runConvert(mockData);

      expect(result.message).toContain("成功转换");
    });

    it("convert，节点 name 为「智算中心、赋能中心、创新中心」，component.name 为该名称", async () => {
      const result = await runConvert(mockData);
      const component = result.component as SwRichtext;

      expect(component.name).toBe("智算中心、赋能中心、创新中心");
    });

    it("convert，layout 高度从 layout_c06300 提取，component.height 为 36", async () => {
      const result = await runConvert(mockData);
      const component = result.component as SwRichtext;

      expect(component.component.height).toBe(36);
    });

    it("convert，layout 绝对坐标 x=0 y=0，left 为 0 top 为 0", async () => {
      const result = await runConvert(mockData);
      const component = result.component as SwRichtext;

      expect(component.left).toBe(0);
      expect(component.top).toBe(0);
    });

    it("convert，option.content 应该是包裹在 <p> 标签中的 HTML", async () => {
      const result = await runConvert(mockData);
      const component = result.component as SwRichtext;

      const content = component.option.content;
      expect(content.startsWith("<p")).toBe(true);
      expect(content.endsWith("</p>")).toBe(true);
    });

    it("convert，option.content 应该包含完整原始文本", async () => {
      const result = await runConvert(mockData);
      const component = result.component as SwRichtext;

      const content = component.option.content;
      expect(content).toContain("智算中心、");
      expect(content).toContain("赋能中心");
      expect(content).toContain("、创新中心");
    });

    it("convert，base style 来自 style_b719c2，<p> 包含 font-family/font-size/font-weight", async () => {
      const result = await runConvert(mockData);
      const component = result.component as SwRichtext;

      const content = component.option.content;
      const pStyle = /<p style="([^"]+)"/.exec(content)?.[1] ?? "";
      expect(pStyle).toContain("font-family: ABeeZee");
      expect(pStyle).toContain("font-size: 26px");
      expect(pStyle).toContain("font-weight: 400");
    });

    it("convert，<p> 应包含来自 fill_9e843e 的有效 color（不含 NaN）", async () => {
      const result = await runConvert(mockData);
      const component = result.component as SwRichtext;

      const content = component.option.content;
      const pStyle = /<p style="([^"]+)"/.exec(content)?.[1] ?? "";
      expect(pStyle).toContain("color:");
      expect(pStyle).not.toContain("NaN");
    });

    it("convert，characterStyleOverrides 5-9 字符应该被 <span> 包裹", async () => {
      const result = await runConvert(mockData);
      const component = result.component as SwRichtext;

      const content = component.option.content;
      // 5-9 字符为「赋能中心」
      expect(content).toMatch(/<span[^>]*>赋能中心<\/span>/);
    });

    it("convert，<span> 应包含 override 的 font-size: 32px", async () => {
      const result = await runConvert(mockData);
      const component = result.component as SwRichtext;

      const content = component.option.content;
      const spanMatch = /<span style="([^"]+)">赋能中心<\/span>/.exec(content);
      expect(spanMatch).not.toBeNull();
      expect(spanMatch![1]).toContain("font-size: 32px");
    });

    it("convert，<span> 应包含 override 的蓝色 color", async () => {
      const result = await runConvert(mockData);
      const component = result.component as SwRichtext;

      const content = component.option.content;
      const spanMatch = /<span style="([^"]+)">赋能中心<\/span>/.exec(content);
      expect(spanMatch).not.toBeNull();
      // rgb(0, ~110, 255) -- 0.4333... * 255 ≈ 110
      expect(spanMatch![1]).toMatch(/color:\s*rgb\(\s*0\s*,/);
    });

    it("convert，option.textAnimationType 为空字符串", async () => {
      const result = await runConvert(mockData);
      const component = result.component as SwRichtext;

      expect(component.option.textAnimationType).toBe("");
    });

    it("convert，option.textAnimationTiming 为 50", async () => {
      const result = await runConvert(mockData);
      const component = result.component as SwRichtext;

      expect(component.option.textAnimationTiming).toBe(50);
    });

    it("convert，option.textAnimationDelay 为 0", async () => {
      const result = await runConvert(mockData);
      const component = result.component as SwRichtext;

      expect(component.option.textAnimationDelay).toBe(0);
    });
  });
});
