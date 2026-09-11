import { beforeAll, describe, expect, it } from "vitest";

import type { Data, VisualElement } from "../../src/mastra/types/codia";
import type { NormalizedNode } from "../../src/mastra/types/normalized-node-types";
import { convertCodiaToNormalizedNode } from "../../src/mastra/workflows/figma-to-bi/adapters/codia-to-normalized";

// Codia VisualElement Schema → NormalizedNode 适配器测试。
// fixture 复刻一个典型移动端页面：Body → Header(Layer) → Title(Text) + Avatar(Image)，
// 覆盖 yoga 布局解算（space-between / alignItems center / padding）与各样式映射点。

/** 构造一个 Discover 页样本；scale 用于验证 scalingFactor 全局缩放 */
function buildSample(scalingFactor = 1): Data {
  const title: VisualElement = {
    elementId: "title-1",
    elementName: "Title",
    elementType: "Text",
    layoutConfig: { positionMode: "Flex" },
    styleConfig: {
      widthSpec: { sizing: "FIT_CONTENT" },
      heightSpec: { sizing: "FIT_CONTENT" },
      textColor: { hexCode: "#111111" },
      textConfig: {
        fontFamily: "Inter",
        fontSize: 20,
        fontStyle: "bold",
        lineHeight: 24,
        letterSpacing: 0.5,
        textAlign: ["left"]
      }
    },
    processingMeta: {},
    contentData: { textValue: "Discover" }
  };

  const avatar: VisualElement = {
    elementId: "avatar-1",
    elementName: "Avatar",
    elementType: "Image",
    layoutConfig: { positionMode: "Flex" },
    styleConfig: {
      widthSpec: { sizing: "FIXED", value: 40 },
      heightSpec: { sizing: "FIXED", value: 40 },
      borderConfig: { borderRadius: [20, 20, 20, 20] }
    },
    processingMeta: {},
    contentData: { imageSource: "https://cdn.codia.ai/avatar.png" }
  };

  const header: VisualElement = {
    elementId: "header-1",
    elementName: "Header",
    elementType: "Layer",
    layoutConfig: {
      positionMode: "Flex",
      flexAttributes: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }
    },
    styleConfig: {
      widthSpec: { sizing: "FILL" },
      heightSpec: { sizing: "FIXED", value: 60 },
      paddingValues: [10, 16, 10, 16],
      borderConfig: { borderRadius: [0, 0, 16, 16] },
      opacityLevel: 255,
      backgroundConfig: { type: "COLOR", backgroundColor: { hexCode: "#F5F5F5" } }
    },
    processingMeta: {},
    childElements: [title, avatar]
  };

  const body: VisualElement = {
    elementId: "body-1",
    elementName: "Body",
    elementType: "Body",
    layoutConfig: { positionMode: "Flex", flexAttributes: { flexDirection: "column" } },
    styleConfig: {
      widthSpec: { sizing: "FIXED", value: 375 },
      heightSpec: { sizing: "FIT_CONTENT" },
      backgroundConfig: { type: "COLOR", backgroundColor: { hexCode: "#FFFFFF" } }
    },
    processingMeta: {},
    childElements: [header]
  };

  return {
    configuration: { baseWidth: 375, measurementUnit: "px", scalingFactor },
    visualElement: body
  };
}

/** 构造嵌套分组样本：Body → GroupA(有 padding) → GroupB(有 padding) → Leaf(Image) */
function buildNestedGroupSample(): Data {
  const leaf: VisualElement = {
    elementId: "leaf-1",
    elementName: "Leaf",
    elementType: "Image",
    layoutConfig: { positionMode: "Flex" },
    styleConfig: {
      widthSpec: { sizing: "FIXED", value: 50 },
      heightSpec: { sizing: "FIXED", value: 50 }
    },
    processingMeta: {},
    contentData: { imageSource: "https://cdn.codia.ai/leaf.png" }
  };

  const groupB: VisualElement = {
    elementId: "groupB",
    elementName: "GroupB",
    elementType: "Group",
    layoutConfig: { positionMode: "Flex", flexAttributes: { flexDirection: "column" } },
    styleConfig: {
      widthSpec: { sizing: "FIXED", value: 200 },
      heightSpec: { sizing: "FIXED", value: 100 },
      paddingValues: [10, 0, 0, 20] // 上10 右0 下0 左20 → leaf 相对 B 为 (20,10)
    },
    processingMeta: {},
    childElements: [leaf]
  };

  const groupA: VisualElement = {
    elementId: "groupA",
    elementName: "GroupA",
    elementType: "Group",
    layoutConfig: { positionMode: "Flex", flexAttributes: { flexDirection: "column" } },
    styleConfig: {
      widthSpec: { sizing: "FIXED", value: 300 },
      heightSpec: { sizing: "FIT_CONTENT" },
      paddingValues: [5, 0, 0, 5] // 上5 左5 → B 相对 A 为 (5,5)
    },
    processingMeta: {},
    childElements: [groupB]
  };

  const body: VisualElement = {
    elementId: "body-1",
    elementName: "Body",
    elementType: "Body",
    layoutConfig: { positionMode: "Flex", flexAttributes: { flexDirection: "column" } },
    styleConfig: { widthSpec: { sizing: "FIXED", value: 375 }, heightSpec: { sizing: "FIT_CONTENT" } },
    processingMeta: {},
    childElements: [groupA]
  };

  return { configuration: { baseWidth: 375, measurementUnit: "px", scalingFactor: 1 }, visualElement: body };
}

const findChild = (node: NormalizedNode, id: string): NormalizedNode | undefined =>
  node.children?.find((c) => c.id === id);

describe("convertCodiaToNormalizedNode", () => {
  let root: NormalizedNode;

  beforeAll(async () => {
    root = await convertCodiaToNormalizedNode(buildSample());
  });

  it("根节点：Body → FRAME，尺寸取画布基准宽度", () => {
    expect(root.id).toBe("body-1");
    expect(root.type).toBe("FRAME");
    expect(root.layout?.mode).toBe("none");
    expect(root.layout?.dimensions?.width).toBe(375);
    expect(root.fills).toEqual(["#FFFFFF"]);
  });

  it("elementType 映射：Layer→FRAME / Text→TEXT / Image→RECTANGLE", () => {
    const header = findChild(root, "header-1")!;
    expect(header.type).toBe("FRAME");
    expect(findChild(header, "title-1")!.type).toBe("TEXT");
    expect(findChild(header, "avatar-1")!.type).toBe("RECTANGLE");
  });

  it("header：FILL 宽度撑满父容器，坐标从画布原点开始", () => {
    const header = findChild(root, "header-1")!;
    expect(header.layout?.dimensions?.width).toBe(375);
    expect(header.layout?.dimensions?.height).toBe(60);
    expect(header.layout?.absolutePosition).toEqual({ x: 0, y: 0 });
  });

  it("opacityLevel(0~255) 归一化为 0~1", () => {
    const header = findChild(root, "header-1")!;
    expect(header.opacity).toBe(1);
  });

  it("borderRadius 四角数组 → CSS 字符串（等值折叠 / 异值展开）", () => {
    const header = findChild(root, "header-1")!;
    const avatar = findChild(header, "avatar-1")!;
    expect(header.borderRadius).toBe("0px 0px 16px 16px");
    expect(avatar.borderRadius).toBe("20px");
  });

  it("Text：文本内容 + 字重/对齐映射，文字色走 fills", () => {
    const title = findChild(findChild(root, "header-1")!, "title-1")!;
    expect(title.text).toBe("Discover");
    expect(title.textStyle?.fontWeight).toBe(700); // bold
    expect(title.textStyle?.fontSize).toBe(20);
    expect(title.textStyle?.lineHeight).toBe("24px");
    expect(title.textStyle?.letterSpacing).toBe("0.50px");
    expect(title.textStyle?.textAlignHorizontal).toBe("LEFT");
    expect(title.fills).toEqual(["#111111"]);
  });

  it("Image：CDN 直链透传到 imgLocalPath", () => {
    const avatar = findChild(findChild(root, "header-1")!, "avatar-1")!;
    expect(avatar.imgLocalPath).toBe("https://cdn.codia.ai/avatar.png");
  });

  it("yoga 解算：space-between + padding，avatar 贴右、垂直居中", () => {
    const avatar = findChild(findChild(root, "header-1")!, "avatar-1")!;
    // 相对 header：x = 375 - paddingRight(16) - 宽(40) = 319
    expect(avatar.layout?.absolutePosition?.x).toBeCloseTo(319, 0);
    // header 内容高 = 60 - 上10 - 下10 = 40，avatar 高 40 → 居中后 y = paddingTop(10)
    expect(avatar.layout?.absolutePosition?.y).toBeCloseTo(10, 0);
    expect(avatar.layout?.dimensions).toEqual({ width: 40, height: 40 });
  });

  it("scalingFactor 全局缩放：所有几何值按系数放大", async () => {
    const scaled = await convertCodiaToNormalizedNode(buildSample(2));
    expect(scaled.layout?.dimensions?.width).toBe(750); // 375 * 2
    const header = findChild(scaled, "header-1")!;
    expect(header.layout?.dimensions?.height).toBe(120); // 60 * 2
    expect(header.borderRadius).toBe("0px 0px 32px 32px"); // 16 * 2
    const title = findChild(header, "title-1")!;
    expect(title.textStyle?.fontSize).toBe(40); // 20 * 2
  });
});

describe("BI 命名后缀补全", () => {
  let root: NormalizedNode;

  beforeAll(async () => {
    root = await convertCodiaToNormalizedNode(buildSample());
  });

  it("Body(根) → -exhibition，Layer → -panel，image → -image，text 不加后缀", () => {
    expect(root.name.endsWith("-exhibition")).toBe(true); // Body 根 = 大屏，转换时跳过
    const header = findChild(root, "header-1")!;
    expect(header.name.endsWith("-panel")).toBe(true); // Layer = 动态面板
    expect(findChild(header, "avatar-1")!.name.endsWith("-image")).toBe(true); // Image
    const title = findChild(header, "title-1")!;
    expect(title.name).toBe("Title"); // Text 原样，无后缀
  });
});

describe("嵌套分组打平", () => {
  let root: NormalizedNode;

  beforeAll(async () => {
    root = await convertCodiaToNormalizedNode(buildNestedGroupSample());
  });

  it("顶层 group 保留并标 -group", () => {
    const groupA = findChild(root, "groupA")!;
    expect(groupA.type).toBe("GROUP");
    expect(groupA.name.endsWith("-group")).toBe(true);
  });

  it("内部嵌套 group 被溶解（groupB 消失，leaf 直挂 groupA）", () => {
    const groupA = findChild(root, "groupA")!;
    expect(findChild(groupA, "groupB")).toBeUndefined();
    const leaf = findChild(groupA, "leaf-1");
    expect(leaf).toBeDefined();
    // 树中不再有第二个 group
    const groupCount = (function count(n: NormalizedNode): number {
      let c = n.name.endsWith("-group") ? 1 : 0;
      for (const ch of n.children ?? []) c += count(ch);
      return c;
    })(root);
    expect(groupCount).toBe(1);
  });

  it("溶解后 leaf 坐标累加了 groupB 的偏移，视觉位置不变", () => {
    const groupA = findChild(root, "groupA")!;
    const leaf = findChild(groupA, "leaf-1")!;
    // leaf 相对 B (20,10) + B 相对 A (5,5) = (25,15)
    expect(leaf.layout?.absolutePosition?.x).toBeCloseTo(25, 0);
    expect(leaf.layout?.absolutePosition?.y).toBeCloseTo(15, 0);
  });
});
