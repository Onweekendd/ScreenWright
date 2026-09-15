import { beforeAll, describe, expect, it, vi } from "vitest";

import type { Data } from "@/mastra/types/codia";
import type { NodeConvertOutput } from "@/mastra/workflows/figma-to-bi/steps/node-convert/NodeConverter";

import swRichtextDefault from "../../../node-convert/richtext/swRichtext.json";
import mockResponse from "./data.mock.json";
import swImgDefault from "./swImg.default-config.json";
import ftPanelDefault from "./ftPanel.default-config.json";
import { runCodiaToBIComponents } from "./helpers";

// 真实 Codia 整页样本，一路跑完 bfsTraversalStep → ruleBasedClassificationStep →
// nodeConvertToBIStep（细节见 helpers.ts），验证「设计稿 → BI 组件」全链路在真实数据上可跑通。
//
// getComponentDefaultConfigByModuleId 是唯一的 DB 依赖，这里换成从 fundb 实际导出的
// 默认组件配置（43=图片 / 69=动态面板 / 113=富文本，见同目录 *.default-config.json 及
// ../../../node-convert/richtext/swRichtext.json），而不是手造的假数据。

const DEFAULT_CONFIG_BY_MODULE_ID: Record<number, any> = {
  43: swImgDefault.config,
  69: ftPanelDefault.config,
  113: swRichtextDefault.config
};

vi.mock("@/mastra/tools/utils", async () => {
  const actual = await vi.importActual<typeof import("@/mastra/tools/utils")>("@/mastra/tools/utils");
  return {
    ...actual,
    getComponentDefaultConfigByModuleId: vi.fn(async (moduleId: number) => {
      const base = DEFAULT_CONFIG_BY_MODULE_ID[moduleId];
      if (!base) {
        return null;
      }
      // 深拷贝：真实实现每次调用都是新 JSON.parse 出来的对象，多个节点共用同一 moduleId
      // 时（本样本有 35+ 张图片）不能共享同一份嵌套对象，否则会互相覆盖 left/top/width/height。
      return { id: 0, moduleId, zIndex: 0, openFilter: false, ...structuredClone(base) };
    })
  };
});

vi.mock("@/mastra/services/figma-node-asset.server", () => ({
  batchByNodeIds: vi.fn().mockResolvedValue({ data: [] })
}));

describe("Codia 真实样本：从设计稿一路转到 BI 组件", () => {
  let results: NodeConvertOutput[];

  beforeAll(async () => {
    const data = (mockResponse as unknown as { data: Data }).data;
    results = await runCodiaToBIComponents(data);
  });

  it("root(-exhibition) 被跳过转换，不产出组件", () => {
    const rootResult = results.find((r) => r.nodeId === "root_0");
    expect(rootResult?.skipped).toBe(true);
    expect(rootResult?.component).toBeNull();
  });

  it("Button(-panel 默认规则) 转换为动态面板组件，且携带画布绝对坐标", () => {
    const button = results.find((r) => r.nodeId === "Button_3072_375_38");
    expect(button?.success).toBe(true);
    expect(button?.targetType).toBe("sw-panel"); // PanelEnum.dynamicPanel 的实际值
    expect(button?.component?.component.prop).toBe("sw-panel");
    expect(button?.component?.left).toBe(3072);
    expect(button?.component?.top).toBe(375);
  });

  it("嵌套在 Button 里的文字被收纳进面板的 panelData[0].config，坐标转为相对面板；imageSource 为空的背景图节点被丢弃", () => {
    const button = results.find((r) => r.nodeId === "Button_3072_375_38");
    const panelConfig = (button!.component as any).panelData[0].config as any[];

    const bg = panelConfig.find((c) => c.name === "Background-image");
    const text = panelConfig.find((c) => c.name === "Overseas Busines");
    expect(bg).toBeUndefined();
    expect(text).toBeDefined();
    // Button 自身画布坐标 (3072,375)；text 画布坐标 (3104,401) → 相对面板 = 差值 (32,26)
    expect(text.left).toBe(32);
    expect(text.top).toBe(26);
  });

  it("普通图片节点转换为 swImg 组件，url 直接透传 Codia CDN 直链", () => {
    const overlay = results.find((r) => r.nodeId === "ImageView_4650_747_2");
    expect(overlay?.success).toBe(true);
    expect(overlay?.targetType).toBe("swimg"); // MediaEnum.SwImg 的实际值
    expect((overlay!.component as any).option.url).toBe(
      "https://static.codia.ai/s/image_8b9b6d0e-96cd-45a9-b18b-ea3ecfa608d1.png"
    );
    expect(overlay?.component?.left).toBe(4650);
    expect(overlay?.component?.top).toBe(747);
  });

  it("独立文本节点转换为富文本组件，内容包含原始文字", () => {
    const text = results.find((r) => r.nodeId === "TextView_4862_896_47");
    expect(text?.success).toBe(true);
    expect(text?.targetType).toBe("swRichtext");
    expect((text!.component as any).option.content).toContain("COMMODITY TRADING");
  });

  it("整页统计：成功转换数 + 跳过数（root）= 总节点数，无失败节点", () => {
    const failed = results.filter((r) => !r.success);
    expect(failed).toEqual([]);

    const skipped = results.filter((r) => r.skipped);
    expect(skipped).toHaveLength(1); // 只有 root
    expect(results.length).toBe(results.filter((r) => r.success).length);
  });
});
