import { describe, expect, it } from "vitest";

import { parseCamera, serializeCamera } from "../cameraStorage";
import { expandRect, isRectVisible, rectsIntersect } from "../culling";

const visible = { x: 0, y: 0, width: 1000, height: 600 };

describe("rectsIntersect", () => {
  it("有重叠部分算相交", () => {
    expect(rectsIntersect({ x: 900, y: 500, width: 200, height: 200 }, visible)).toBe(true);
  });

  it("完全包含、被包含都算相交", () => {
    expect(rectsIntersect({ x: -10, y: -10, width: 5000, height: 5000 }, visible)).toBe(true);
    expect(rectsIntersect({ x: 10, y: 10, width: 5, height: 5 }, visible)).toBe(true);
  });

  it("只是边挨着不算相交", () => {
    expect(rectsIntersect({ x: 1000, y: 0, width: 50, height: 50 }, visible)).toBe(false);
    expect(rectsIntersect({ x: -50, y: 0, width: 50, height: 50 }, visible)).toBe(false);
    expect(rectsIntersect({ x: 0, y: 600, width: 50, height: 50 }, visible)).toBe(false);
  });

  it("四个方向上完全在外面", () => {
    expect(rectsIntersect({ x: 2000, y: 100, width: 50, height: 50 }, visible)).toBe(false);
    expect(rectsIntersect({ x: -500, y: 100, width: 50, height: 50 }, visible)).toBe(false);
    expect(rectsIntersect({ x: 100, y: -500, width: 50, height: 50 }, visible)).toBe(false);
    expect(rectsIntersect({ x: 100, y: 2000, width: 50, height: 50 }, visible)).toBe(false);
  });
});

describe("isRectVisible", () => {
  const outsideRight = { x: 1040, y: 100, width: 100, height: 100 };

  it("刚滑出窗口的组件，留了边距就仍算可见", () => {
    expect(isRectVisible(outsideRight, visible)).toBe(false);
    expect(isRectVisible(outsideRight, visible, 50)).toBe(true);
  });

  it("边距不够就隐藏", () => {
    expect(isRectVisible(outsideRight, visible, 30)).toBe(false);
  });

  it("宽高为 0 的组件在窗口内部也算可见（点状元素不能被误隐藏）", () => {
    expect(isRectVisible({ x: 100, y: 100, width: 0, height: 0 }, visible)).toBe(true);
    expect(isRectVisible({ x: 5000, y: 100, width: 0, height: 0 }, visible)).toBe(false);
  });
});

describe("expandRect", () => {
  it("四周各扩 pad", () => {
    expect(expandRect({ x: 10, y: 20, width: 100, height: 50 }, 5)).toEqual({ x: 5, y: 15, width: 110, height: 60 });
  });

  it("负数当 0，不会把矩形缩没", () => {
    expect(expandRect({ x: 10, y: 20, width: 100, height: 50 }, -5)).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });
});

describe("相机持久化编解码", () => {
  it("写出去再读回来是同一个相机", () => {
    const camera = { x: -320.5, y: 88.25, zoom: 0.4321 };
    expect(parseCamera(serializeCamera(camera))).toEqual(camera);
  });

  it("序列化取整到 0.01px / 缩放 4 位小数", () => {
    expect(parseCamera(serializeCamera({ x: 1.23456, y: 2.98765, zoom: 0.123456789 }))).toEqual({
      x: 1.23,
      y: 2.99,
      zoom: 0.1235
    });
  });

  it("空值、坏 JSON、非对象一律返回 null", () => {
    expect(parseCamera(null)).toBeNull();
    expect(parseCamera(undefined)).toBeNull();
    expect(parseCamera("")).toBeNull();
    expect(parseCamera("{not json")).toBeNull();
    expect(parseCamera("123")).toBeNull();
    expect(parseCamera("null")).toBeNull();
    expect(parseCamera('"text"')).toBeNull();
  });

  it("缺字段、类型不对、非有限数、缩放不为正都返回 null", () => {
    expect(parseCamera('{"x":1,"y":2}')).toBeNull();
    expect(parseCamera('{"x":"1","y":2,"zoom":1}')).toBeNull();
    expect(parseCamera('{"x":1,"y":2,"zoom":0}')).toBeNull();
    expect(parseCamera('{"x":1,"y":2,"zoom":-1}')).toBeNull();
    expect(parseCamera('{"x":null,"y":2,"zoom":1}')).toBeNull();
  });
});
