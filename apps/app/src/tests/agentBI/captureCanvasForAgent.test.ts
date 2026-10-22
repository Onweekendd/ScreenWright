import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/views/build/components/buildConfig/graphConfig/screenCapture", () => ({
  captureEditorScreenShot: vi.fn()
}));

import {
  CAPTURE_EXCLUDE,
  captureCanvasForAgent,
  clampRegion,
  findComponentElements,
  gridStep,
  gridTicks,
  measureRegion,
  MIN_GRID_PX,
  REGION_PADDING
} from "@/views/build/components/agentBI/hooks/captureCanvasForAgent";
import { captureEditorScreenShot } from "@/views/build/components/buildConfig/graphConfig/screenCapture";

/**
 * jsdom 不做布局：getBoundingClientRect / offsetWidth 全是 0，这里按「屏幕坐标」手动钉住。
 * 画布设计稿 1920×1080，相机把它平移到 (100, 50) 并缩放到 0.5——
 * 断言的是换算回来的设计稿坐标，与相机无关。
 */
const ZOOM = 0.5;
const CAMERA = { x: 100, y: 50 };

const rect = (x: number, y: number, w: number, h: number) =>
  ({ left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, x, y }) as DOMRect;

/** 按设计稿坐标摆一个组件，返回它在屏幕上的 rect */
const onScreen = (x: number, y: number, w: number, h: number) =>
  rect(CAMERA.x + x * ZOOM, CAMERA.y + y * ZOOM, w * ZOOM, h * ZOOM);

const buildCanvas = () => {
  const canvas = document.createElement("div");
  canvas.id = "go-chart-edit-content";
  Object.defineProperty(canvas, "offsetWidth", { value: 1920 });
  Object.defineProperty(canvas, "offsetHeight", { value: 1080 });
  canvas.getBoundingClientRect = () => rect(CAMERA.x, CAMERA.y, 1920 * ZOOM, 1080 * ZOOM);
  document.body.appendChild(canvas);
  return canvas;
};

const addComponent = (
  parent: HTMLElement,
  id: number,
  screenRect: DOMRect | null,
  className = "go-shape-box"
): HTMLElement => {
  const el = document.createElement("div");
  el.className = className;
  el.id = `${id}`;
  el.getBoundingClientRect = () => screenRect ?? rect(0, 0, 0, 0);
  // jsdom 里 getClientRects 恒为空；可见的组件给一个非空列表，隐藏的（v-show）保持空
  el.getClientRects = () => (screenRect ? [screenRect] : []) as unknown as DOMRectList;
  parent.appendChild(el);
  return el;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("findComponentElements", () => {
  it("按 id 找到画布内的组件外壳，嵌套在分组里的也能找到", () => {
    const canvas = buildCanvas();
    const group = addComponent(canvas, 1, onScreen(0, 0, 500, 500));
    addComponent(group, 2, onScreen(10, 10, 100, 100));

    const { elements, missingIds } = findComponentElements(canvas, [1, 2]);

    expect(elements.map((el) => el.id)).toEqual(["1", "2"]);
    expect(missingIds).toEqual([]);
  });

  it("找不到或当前不可见的组件归入 missingIds", () => {
    const canvas = buildCanvas();
    addComponent(canvas, 1, onScreen(0, 0, 100, 100));
    addComponent(canvas, 2, null);

    const { elements, missingIds } = findComponentElements(canvas, [1, 2, 3]);

    expect(elements).toHaveLength(1);
    expect(missingIds).toEqual([2, 3]);
  });

  it("物料内部撞了数字 id 的节点不会被误认成组件", () => {
    const canvas = buildCanvas();
    addComponent(canvas, 7, onScreen(0, 0, 100, 100), "echarts-inner");

    const { missingIds } = findComponentElements(canvas, [7]);

    expect(missingIds).toEqual([7]);
  });
});

/**
 * vue 片段把 `#preview-app-inner-xxx .cf{…}` 这样的 <style> 注入到自己容器里，snapdom 带上它之后整棵子树
 * 渲染成全透明（真实页面实测：含它的 wrapper 不透明像素 0，排除后 90.8%）。jsdom 渲染不了，
 * 这里只钉住「截图时确实把它排除了」，单组件与整屏两条路都要有。
 */
describe("截图排除内联 <style>", () => {
  const shot = { file: new File(["x"], "s.jpg", { type: "image/jpeg" }), dataUrl: "" };

  const lastExclude = () => {
    const calls = vi.mocked(captureEditorScreenShot).mock.calls;
    return calls[calls.length - 1]![0]!.exclude;
  };

  beforeEach(() => {
    vi.mocked(captureEditorScreenShot).mockResolvedValue(shot);
    vi.stubGlobal("createImageBitmap", async () => ({ width: 100, height: 50, close: () => undefined }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(captureEditorScreenShot).mockReset();
  });

  it("排除列表里包含 style，同时保留编辑器叠加层", () => {
    expect(CAPTURE_EXCLUDE).toContain("style");
    expect(CAPTURE_EXCLUDE).toContain(".sw-transform");
  });

  it("整屏截图传了排除列表", async () => {
    buildCanvas();

    await captureCanvasForAgent();

    expect(lastExclude()).toEqual(CAPTURE_EXCLUDE);
  });

  it("单组件截图传了排除列表", async () => {
    const canvas = buildCanvas();
    addComponent(canvas, 14, onScreen(89, 134, 465, 259));

    await captureCanvasForAgent({ componentIds: [14] });

    expect(lastExclude()).toEqual(CAPTURE_EXCLUDE);
  });
});

/**
 * 任意位置截图：agent 按设计稿坐标给一块矩形，不依赖某个组件。
 * 坐标要收进画布范围，完全在画布外时必须报错——否则会静默裁出一张空图，agent 还以为那里没东西。
 */
describe("clampRegion", () => {
  it("画布内的区域原样返回（小数取整向外扩，不丢边）", () => {
    const canvas = buildCanvas();

    expect(clampRegion(canvas, { x: 100.4, y: 50.6, width: 200.2, height: 100 })).toEqual({
      x: 100,
      y: 50,
      width: 201,
      height: 101
    });
  });

  it("越出画布的部分被裁掉，负坐标按 0 算", () => {
    const canvas = buildCanvas();

    expect(clampRegion(canvas, { x: -50, y: -20, width: 200, height: 100 })).toEqual({
      x: 0,
      y: 0,
      width: 150,
      height: 80
    });
    expect(clampRegion(canvas, { x: 1800, y: 1000, width: 500, height: 500 })).toEqual({
      x: 1800,
      y: 1000,
      width: 120,
      height: 80
    });
  });

  it("与画布没有交集时返回 null", () => {
    const canvas = buildCanvas();

    expect(clampRegion(canvas, { x: 2000, y: 0, width: 100, height: 100 })).toBeNull();
    expect(clampRegion(canvas, { x: -300, y: 0, width: 100, height: 100 })).toBeNull();
    expect(clampRegion(canvas, { x: 10, y: 10, width: 0, height: 50 })).toBeNull();
  });
});

describe("captureCanvasForAgent 按区域截图", () => {
  afterEach(() => {
    vi.mocked(captureEditorScreenShot).mockReset();
  });

  it("区域在画布之外时报错并说明画布尺寸，不去截图", async () => {
    buildCanvas();

    await expect(captureCanvasForAgent({ region: { x: 5000, y: 5000, width: 100, height: 100 } })).rejects.toThrow(
      /画布是 1920×1080/
    );
    expect(captureEditorScreenShot).not.toHaveBeenCalled();
  });

  it("固定 dpr 1、不为阴影外扩：图片像素与设计稿像素严格成 scale 倍，裁切才不会偏", async () => {
    buildCanvas();
    vi.mocked(captureEditorScreenShot).mockResolvedValue(null);

    await expect(captureCanvasForAgent({ region: { x: 100, y: 100, width: 400, height: 300 } })).rejects.toThrow(
      "截图失败"
    );
    // outerShadows 必须是 false：snapdom 2.0.1 里 true 才按阴影外扩（与它的类型注释相反）。画布曾带阴影时整屏多出 20×44；阴影已去掉，这里仍兜底，免得以后加回来又偏
    expect(captureEditorScreenShot).toHaveBeenCalledWith(expect.objectContaining({ dpr: 1, outerShadows: false }));
  });
});

describe("网格刻度", () => {
  const region = (width: number, height: number) => ({ x: 0, y: 0, width, height });

  it("不指定时长边大约 10 格，并取整到好读的数", () => {
    expect(gridStep(region(1920, 1080), 1)).toBe(200);
    expect(gridStep(region(476, 266), 2)).toBe(50);
  });

  it("小区域按图上的像素兜底：线距不小于 MIN_GRID_PX，标签才放得下", () => {
    // 90×40 放大 2 倍：长边 10 格是 9 画布像素，图上只有 18 像素，要放大到 ≥ 24 再取整
    const step = gridStep(region(90, 40), 2);
    expect(step * 2).toBeGreaterThanOrEqual(MIN_GRID_PX);
    expect(step).toBe(25);
  });

  it("指定的间距放得下就照用，即使不是整数档位", () => {
    expect(gridStep(region(1920, 1080), 1, 60)).toBe(60);
    expect(gridStep(region(200, 200), 2, 30)).toBe(30);
  });

  it("指定的间距在图上太密时调大到放得下的档位", () => {
    // 整屏 scale 1：要 10，图上只有 10 像素，调到 ≥ 48 的档位
    expect(gridStep(region(1920, 1080), 1, 10)).toBe(50);
  });

  it("刻度是画布绝对坐标，从区域内第一个整步长开始，含右边界", () => {
    expect(gridTicks(102, 476, 50)).toEqual([150, 200, 250, 300, 350, 400, 450, 500, 550]);
    expect(gridTicks(0, 400, 200)).toEqual([0, 200, 400]);
  });
});

describe("measureRegion", () => {
  it("把屏幕坐标换算回设计稿坐标，与相机平移、缩放无关", () => {
    const canvas = buildCanvas();
    const el = addComponent(canvas, 1, onScreen(200, 300, 400, 250));

    expect(measureRegion(canvas, [el])).toEqual({ x: 200, y: 300, width: 400, height: 250 });
  });

  it("多个组件取并集外框并留边距", () => {
    const canvas = buildCanvas();
    const a = addComponent(canvas, 1, onScreen(100, 100, 200, 200));
    const b = addComponent(canvas, 2, onScreen(500, 400, 100, 100));

    expect(measureRegion(canvas, [a, b], REGION_PADDING)).toEqual({
      x: 100 - REGION_PADDING,
      y: 100 - REGION_PADDING,
      width: 500 + REGION_PADDING * 2,
      height: 400 + REGION_PADDING * 2
    });
  });

  it("边距不会越出画布", () => {
    const canvas = buildCanvas();
    const el = addComponent(canvas, 1, onScreen(0, 1000, 1920, 80));

    expect(measureRegion(canvas, [el], REGION_PADDING)).toEqual({
      x: 0,
      y: 1000 - REGION_PADDING,
      width: 1920,
      height: 80 + REGION_PADDING
    });
  });
});
