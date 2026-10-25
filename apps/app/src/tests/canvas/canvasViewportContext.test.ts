import { afterEach, describe, expect, it } from "vitest";

import {
  findVisibleWorldRect,
  registerCanvasViewport
} from "@/views/build/components/buildInfiniteCanvas/canvasViewportContext";
import { getAlignmentReferenceBounds } from "@/views/build/components/buildRender/hooks/alignmentReferenceBounds";

const visible = { x: -100, y: 50, width: 800, height: 600 };

const mountCanvas = () => {
  const container = document.createElement("div");
  const inner = document.createElement("div");
  const leaf = document.createElement("span");
  inner.appendChild(leaf);
  container.appendChild(inner);
  document.body.appendChild(container);
  return { container, leaf };
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("画布可视窗口登记", () => {
  it("事件目标在已登记的画布里，能取到这个画布的可视窗口", () => {
    const { container, leaf } = mountCanvas();
    registerCanvasViewport(container, () => visible);

    expect(findVisibleWorldRect(leaf)).toEqual(visible);
  });

  it("每次都取最新值，不是登记时的快照", () => {
    const { container, leaf } = mountCanvas();
    let current = visible;
    registerCanvasViewport(container, () => current);

    current = { x: 0, y: 0, width: 10, height: 10 };

    expect(findVisibleWorldRect(leaf)).toEqual(current);
  });

  it("取消登记后取不到", () => {
    const { container, leaf } = mountCanvas();
    const unregister = registerCanvasViewport(container, () => visible);
    unregister();

    expect(findVisibleWorldRect(leaf)).toBeNull();
  });

  it("两个画布互不串：各自返回自己的窗口", () => {
    const a = mountCanvas();
    const b = mountCanvas();
    registerCanvasViewport(a.container, () => visible);
    registerCanvasViewport(b.container, () => ({ x: 1, y: 2, width: 3, height: 4 }));

    expect(findVisibleWorldRect(a.leaf)).toEqual(visible);
    expect(findVisibleWorldRect(b.leaf)).toEqual({ x: 1, y: 2, width: 3, height: 4 });
  });

  it("不在任何登记画布里 / 目标为空，返回 null", () => {
    const { leaf } = mountCanvas();

    expect(findVisibleWorldRect(leaf)).toBeNull();
    expect(findVisibleWorldRect(null)).toBeNull();
  });

  it("画布还没量出尺寸（取值函数返回 null）时返回 null", () => {
    const { container, leaf } = mountCanvas();
    registerCanvasViewport(container, () => null);

    expect(findVisibleWorldRect(leaf)).toBeNull();
  });
});

describe("对齐参考范围", () => {
  it("在无限画布里：用当前可视窗口，而不是整个画板", () => {
    const { container, leaf } = mountCanvas();
    registerCanvasViewport(container, () => visible);

    const bounds = getAlignmentReferenceBounds({ target: leaf } as unknown as Event, { width: 1920, height: 1080 });

    expect(bounds).toEqual([-100, 50, 700, 650]);
  });

  it("取不到可视窗口时回落到画板范围（和改造前一致）", () => {
    const bounds = getAlignmentReferenceBounds(undefined, { width: "1920", height: 1080 });

    expect(bounds).toEqual([0, 0, 1920, 1080]);
  });
});
