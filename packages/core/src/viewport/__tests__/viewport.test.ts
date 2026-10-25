import { beforeEach, describe, expect, it, vi } from "vitest";

import { Viewport } from "../Viewport";

describe("Viewport（无限画布相机，框架无关）", () => {
  let viewport: Viewport;

  beforeEach(() => {
    viewport = new Viewport();
    viewport.setSize(1000, 600);
  });

  describe("坐标换算", () => {
    it("屏幕与世界坐标互为逆运算", () => {
      viewport.setCamera({ x: 120, y: -40, zoom: 0.5 });
      const world = viewport.screenToWorld({ x: 320, y: 60 });
      expect(world).toEqual({ x: 400, y: 200 });
      expect(viewport.worldToScreen(world)).toEqual({ x: 320, y: 60 });
    });

    it("世界坐标可以为负（无边界）", () => {
      viewport.setCamera({ x: 0, y: 0, zoom: 1 });
      expect(viewport.screenToWorld({ x: -300, y: -200 })).toEqual({ x: -300, y: -200 });
    });
  });

  describe("平移", () => {
    it("panBy 以屏幕像素移动内容", () => {
      viewport.panBy(30, -10);
      expect(viewport.getCamera()).toMatchObject({ x: 30, y: -10, zoom: 1 });
    });
  });

  describe("缩放", () => {
    it("zoomAt 保持锚点下的世界坐标不动", () => {
      viewport.setCamera({ x: 50, y: 80, zoom: 1 });
      const anchor = { x: 400, y: 300 };
      const before = viewport.screenToWorld(anchor);

      viewport.zoomAt(anchor, 2.5);

      const after = viewport.screenToWorld(anchor);
      expect(after.x).toBeCloseTo(before.x, 6);
      expect(after.y).toBeCloseTo(before.y, 6);
      expect(viewport.getCamera().zoom).toBe(2.5);
    });

    it("缩放被限制在 [minZoom, maxZoom]", () => {
      viewport.zoomAt({ x: 0, y: 0 }, 1000);
      expect(viewport.getCamera().zoom).toBe(viewport.maxZoom);
      viewport.zoomAt({ x: 0, y: 0 }, 0.00001);
      expect(viewport.getCamera().zoom).toBe(viewport.minZoom);
    });

    it("zoomBy 按倍率缩放", () => {
      viewport.zoomBy({ x: 0, y: 0 }, 2);
      expect(viewport.getCamera().zoom).toBe(2);
    });

    it("非法缩放值（NaN）被忽略", () => {
      viewport.zoomAt({ x: 0, y: 0 }, Number.NaN);
      expect(viewport.getCamera().zoom).toBe(1);
    });

    it("已到上限再放大不触发通知，相机不变", () => {
      viewport.setCamera({ zoom: viewport.maxZoom });
      const listener = vi.fn();
      viewport.subscribe(listener);
      viewport.zoomBy({ x: 10, y: 10 }, 2);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("适配与居中", () => {
    it("fitRect 把矩形居中并按 fill 比例缩放", () => {
      viewport.fitRect({ x: 0, y: 0, width: 1920, height: 1080 }, { fill: 0.8 });

      const { zoom } = viewport.getCamera();
      // 视口 1000x600：宽度比 1000/1920 小于高度比 600/1080，受宽度约束
      expect(zoom).toBeCloseTo((1000 / 1920) * 0.8, 6);
      // 矩形中心落在视口中心
      const center = viewport.worldToScreen({ x: 960, y: 540 });
      expect(center.x).toBeCloseTo(500, 6);
      expect(center.y).toBeCloseTo(300, 6);
    });

    it("fitRect 不会把小矩形放大超过 maxZoom 选项", () => {
      viewport.fitRect({ x: 0, y: 0, width: 10, height: 10 }, { maxZoom: 1 });
      expect(viewport.getCamera().zoom).toBe(1);
    });

    it("视口尺寸未知（0）时 fitRect 不动相机", () => {
      const blank = new Viewport();
      blank.fitRect({ x: 0, y: 0, width: 100, height: 100 });
      expect(blank.getCamera()).toEqual({ x: 0, y: 0, zoom: 1 });
    });

    it("centerOn 把世界点放到视口中心", () => {
      viewport.centerOn({ x: -500, y: 2000 });
      const screen = viewport.worldToScreen({ x: -500, y: 2000 });
      expect(screen).toEqual({ x: 500, y: 300 });
    });
  });

  describe("可视区", () => {
    it("visibleWorldRect 随相机变化", () => {
      viewport.setCamera({ x: -200, y: -100, zoom: 2 });
      expect(viewport.visibleWorldRect()).toEqual({ x: 100, y: 50, width: 500, height: 300 });
    });
  });

  describe("订阅", () => {
    it("相机变化时通知，取消订阅后不再通知", () => {
      const listener = vi.fn();
      const off = viewport.subscribe(listener);

      viewport.panBy(5, 5);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith({ x: 5, y: 5, zoom: 1 });

      off();
      viewport.panBy(5, 5);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("getCamera 返回副本，外部修改不影响内部状态", () => {
      const camera = viewport.getCamera();
      camera.x = 999;
      expect(viewport.getCamera().x).toBe(0);
    });
  });
});
