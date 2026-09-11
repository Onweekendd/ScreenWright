import { describe, expect, it } from "vitest";

import type { NormalizedNode } from "../../src/mastra/types/normalized-node-types";
import { atomicizeCodiaNormalizedTree } from "../../src/mastra/workflows/figma-to-bi/adapters/codia-to-normalized";
import { normalizeScreenRegions } from "../../src/mastra/workflows/figma-to-bi/semantic-layout/analyze-screen-regions-step";
import { assignNodesToRegions } from "../../src/mastra/workflows/figma-to-bi/semantic-layout/assign-nodes-to-regions-step";
import { rebuildSemanticTree } from "../../src/mastra/workflows/figma-to-bi/semantic-layout/rebuild-semantic-containers-step";
import type {
  RegionAnalysisTask,
  RegionGroupResult,
  ScreenRegion
} from "../../src/mastra/workflows/figma-to-bi/semantic-layout/semantic-layout-types";

const node = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  type: NormalizedNode["type"] = "RECTANGLE"
): NormalizedNode => ({
  id,
  name: type === "TEXT" ? id : `${id}-image`,
  type,
  layout: {
    mode: "none",
    absolutePosition: { x, y },
    dimensions: { width, height }
  }
});

const rootWith = (...children: NormalizedNode[]): NormalizedNode => ({
  id: "root",
  name: "root-exhibition",
  type: "FRAME",
  layout: {
    mode: "none",
    absolutePosition: { x: 0, y: 0 },
    dimensions: { width: 1000, height: 1000 }
  },
  children
});

const leftRegion: ScreenRegion = {
  id: "left",
  name: "左侧指标区",
  role: "metrics",
  bounds: { x: 0, y: 0, width: 500, height: 1000 },
  confidence: 0.95
};

describe("Codia semantic atomicization", () => {
  it("展开 Codia 容器，同时保留带图片的容器背景原子", () => {
    const title = node("title", 20, 20, 100, 30, "TEXT");
    const layer: NormalizedNode = {
      ...node("layer", 0, 0, 500, 200, "FRAME"),
      name: "Header-panel",
      imgLocalPath: "https://example.com/header.png",
      children: [title]
    };

    const atomic = atomicizeCodiaNormalizedTree(rootWith(layer));

    expect(atomic.children?.map((child) => child.id)).toEqual(["title", "layer:background"]);
    expect(atomic.children?.[1]).toMatchObject({
      type: "RECTANGLE",
      name: "Header-image",
      children: undefined
    });
  });
});

describe("semantic region assignment", () => {
  it("移除包含具体子区域的宽泛父区域，保持一级面板结构", () => {
    const regions = normalizeScreenRegions([
      {
        id: "broad",
        name: "整个内容区",
        role: "content",
        bounds: { x: 0, y: 0, width: 900, height: 1000 },
        confidence: 0.98
      },
      leftRegion
    ]);

    expect(regions.map((region) => region.id)).toEqual(["left"]);
  });

  it("一个原子节点最多分配到一个区域，并把全屏背景留在根节点", () => {
    const title = node("title", 20, 20, 120, 30, "TEXT");
    const metric = node("metric", 100, 200, 100, 80);
    const background = node("background", 0, 0, 1000, 1000);
    const rightRegion: ScreenRegion = {
      id: "right",
      name: "右侧区域",
      role: "chart",
      bounds: { x: 500, y: 0, width: 500, height: 1000 },
      confidence: 0.9
    };

    const assignments = assignNodesToRegions(rootWith(title, metric, background), [leftRegion, rightRegion]);

    expect(assignments).toHaveLength(1);
    expect(assignments[0].nodes.map((item) => item.id)).toEqual(["title", "metric"]);
    expect(assignments[0].candidates.map((item) => item.index)).toEqual([0, 1]);
  });
});

describe("semantic container rebuilding", () => {
  it("构建动态面板和一层 Group，未分配节点仍保留在根节点", () => {
    const background = node("background", 0, 0, 1000, 1000);
    const titleBg = node("title-bg", 20, 20, 180, 50);
    const titleText = node("title-text", 40, 30, 120, 30, "TEXT");
    const chart = node("chart", 20, 100, 400, 700);
    const root = rootWith(titleText, titleBg, chart, background);
    const task: RegionAnalysisTask = {
      regionIndex: 0,
      region: leftRegion,
      croppedImageDataUrl: "data:image/png;base64,AA==",
      nodes: [titleText, titleBg, chart],
      candidates: [
        {
          index: 0,
          nodeId: titleText.id,
          type: titleText.type,
          name: titleText.name,
          bounds: { x: 80, y: 30, width: 240, height: 30 },
          zOrder: 0
        },
        {
          index: 1,
          nodeId: titleBg.id,
          type: titleBg.type,
          name: titleBg.name,
          bounds: { x: 40, y: 20, width: 360, height: 50 },
          zOrder: 1
        },
        {
          index: 2,
          nodeId: chart.id,
          type: chart.type,
          name: chart.name,
          bounds: { x: 40, y: 100, width: 800, height: 700 },
          zOrder: 2
        }
      ]
    };
    const result: RegionGroupResult = {
      regionIndex: 0,
      regionId: leftRegion.id,
      success: true,
      groups: [
        {
          name: "区域标题",
          role: "title",
          memberIndexes: [0, 1],
          confidence: 0.95
        }
      ]
    };

    const rebuilt = rebuildSemanticTree(root, [task], [result]);
    const panel = rebuilt.children?.find((item) => item.name.endsWith("-panel"));
    const group = panel?.children?.find((item) => item.name.endsWith("-group"));

    expect(rebuilt.children?.some((item) => item.id === "background")).toBe(true);
    expect(panel?.type).toBe("FRAME");
    expect(group?.type).toBe("GROUP");
    expect(group?.children?.map((item) => item.id)).toEqual(["title-text", "title-bg"]);
    expect(group?.children?.some((item) => item.type === "GROUP")).toBe(false);
    expect(panel?.children?.some((item) => item.id === "chart")).toBe(true);
  });

  it("低置信度分组不创建，区域内部保持平铺", () => {
    const first = node("first", 10, 10, 20, 20);
    const second = node("second", 40, 10, 20, 20);
    const task: RegionAnalysisTask = {
      regionIndex: 0,
      region: leftRegion,
      croppedImageDataUrl: "data:image/png;base64,AA==",
      nodes: [first, second],
      candidates: []
    };

    const rebuilt = rebuildSemanticTree(
      rootWith(first, second),
      [task],
      [
        {
          regionIndex: 0,
          regionId: "left",
          success: true,
          groups: [
            {
              name: "不可靠分组",
              role: "custom",
              memberIndexes: [0, 1],
              confidence: 0.5
            }
          ]
        }
      ]
    );

    expect(rebuilt.children?.[0].children?.map((item) => item.id)).toEqual(["first", "second"]);
  });
});
