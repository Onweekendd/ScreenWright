import { describe, expect, it } from "vitest";

import type { Data } from "@/mastra/types/codia";
import type { NormalizedNode } from "@/mastra/types/normalized-node-types";
import { convertCodiaToNormalizedNode } from "@/mastra/workflows/figma-to-bi/adapters/codia-to-normalized";

import mockResponse from "./data.mock.json";

// 真实 Codia image_to_design 响应样本（信封 { code, message, data }）：一个几乎全用
// positionMode="Absolute" 表达的整页设计（背景图 + 若干叠加图片/按钮/文字），用于验证
// 适配器对 absoluteAttrs.coord 的解算，而不是 buildSample() 那种手搭的 Flex 场景。

const findChild = (node: NormalizedNode, id: string): NormalizedNode | undefined =>
  node.children?.find((c) => c.id === id);

describe("convertCodiaToNormalizedNode（真实样本：绝对定位整页）", () => {
  const data = (mockResponse as unknown as { data: Data }).data;

  it("根节点：取 heightSpec.value 作为画布真实高度，而非子节点流式撑高之和", async () => {
    const root = await convertCodiaToNormalizedNode(data);

    expect(root.layout?.dimensions?.width).toBe(5632);
    expect(root.layout?.dimensions?.height).toBe(1792); // 非所有子节点纵向堆叠后的总和
  });

  it("Absolute 子节点：坐标取 absoluteAttrs.coord（相对父节点），而非常规流堆叠位置", async () => {
    const root = await convertCodiaToNormalizedNode(data);
    const overlay = findChild(root, "ImageView_4650_747_2")!;

    // JSON 中 coord === orginCoord === [4650, 747]（顶层子节点，父节点即画布原点）
    expect(overlay.layout?.absolutePosition).toEqual({ x: 4650, y: 747 });
    expect(overlay.layout?.dimensions).toEqual({ width: 812, height: 632 });
  });

  it("嵌套 Absolute 子节点：absolutePosition 是画布绝对坐标，与 JSON 的 orginCoord 一致", async () => {
    const root = await convertCodiaToNormalizedNode(data);
    const button = findChild(root, "Button_3072_375_38")!;
    const text = findChild(button, "TextView_3097_401_40")!;

    // Button 自身：coord === orginCoord === [3072,375]（顶层子节点）
    expect(button.layout?.absolutePosition).toEqual({ x: 3072, y: 375 });
    // text 的 coord=[32,26] 是相对 Button 的局部偏移，但 layout.absolutePosition 约定为画布绝对
    // 坐标（下游 bfsTraversal/classification/NodeConverter 都按此约定，见 codia-to-normalized.ts
    // 顶部注释），因此应等于 JSON 里的 orginCoord=[3104,401]=父 orginCoord(3072,375)+自身 coord(32,26)
    expect(text.layout?.absolutePosition).toEqual({ x: 3104, y: 401 });
    expect(text.layout?.dimensions).toEqual({ width: 375, height: 50 });
  });

  it("Image 节点 imageSource 为空（Codia 识别到背景但未提取出图片资源）时整个节点被丢弃", async () => {
    const root = await convertCodiaToNormalizedNode(data);
    const button = findChild(root, "Button_3072_375_38")!;

    expect(findChild(button, "bg_Button_3072_375_39")).toBeUndefined();
    // Button 原本有 2 个子节点（bg 图片 + 文字），丢弃空图片后只剩文字
    expect(button.children).toHaveLength(1);
    expect(button.children?.[0].id).toBe("TextView_3097_401_40");
  });

  it("Layer → -panel，Image → -image，Text 不加后缀（命名后缀补全在真实样本上依然生效）", async () => {
    const root = await convertCodiaToNormalizedNode(data);
    const button = findChild(root, "Button_3072_375_38")!;
    const overlay = findChild(root, "ImageView_4650_747_2")!;
    const text = findChild(button, "TextView_3097_401_40")!;

    expect(button.type).toBe("FRAME");
    expect(button.name.endsWith("-panel")).toBe(true);
    expect(overlay.type).toBe("RECTANGLE");
    expect(overlay.name.endsWith("-image")).toBe(true);
    expect(text.type).toBe("TEXT");
    expect(text.text).toBe("Overseas Business");
  });
});
