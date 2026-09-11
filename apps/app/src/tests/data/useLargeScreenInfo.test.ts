import { beforeEach, describe, expect, it, vi } from "vitest";

import * as buildApi from "../../api/build";
import { defaultNavInfo, parseIfNeeded, useLargeScreenInfo } from "../../views/build/useLargeScreenInfo";
import mockData from "./componentData.mock.json";

// 模拟Vue的组件生命周期
const mockOnBeforeMount = vi.fn();
const mockOnMounted = vi.fn();
const mockOnUnmounted = vi.fn();
const mockInject = vi.fn();

vi.mock("vue", async () => ({
  ...((await vi.importActual("vue")) as any),
  onBeforeMount: (fn: Function) => mockOnBeforeMount(fn),
  onMounted: (fn: Function) => mockOnMounted(fn),
  onUnmounted: (fn: Function) => mockOnUnmounted(fn),
  inject: (key: any, defaultValue?: any) => mockInject(key, defaultValue)
}));

vi.mock("../../api/build", () => ({
  getLargeScreenInfo: vi.fn()
}));

describe("useLargeScreenInfo", () => {
  const mockGetLargeScreenInfo = vi.mocked(buildApi.getLargeScreenInfo);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLargeScreenInfo.mockResolvedValue(mockData as any);
    const { resetNavInfo } = useLargeScreenInfo();
    resetNavInfo();
  });

  describe("默认状态", () => {
    it("navInfo 初始值应等于 defaultNavInfo", () => {
      const { navInfo } = useLargeScreenInfo();
      expect(navInfo.value).toEqual(defaultNavInfo);
    });
  });

  describe("parseIfNeeded", () => {
    it("传入对象应返回同一引用", () => {
      const obj = { a: 1 };
      const res = parseIfNeeded(obj, obj);
      expect(res).toBe(obj);
    });

    it("传入 JSON 字符串应正确解析", () => {
      const json = "[1,2,3]";
      const res = parseIfNeeded<number[]>(json, []);
      expect(res).toEqual([1, 2, 3]);
    });

    it("非法 JSON 或 undefined 应返回 fallback", () => {
      const fallback = { x: 1 };
      const res1 = parseIfNeeded("not-json", fallback);
      const res2 = parseIfNeeded(undefined as any, fallback);
      expect(res1).toBe(fallback);
      expect(res2).toBe(fallback);
    });

    it('字符串 "null" 解析结果为 null（而非 fallback）', () => {
      const res = parseIfNeeded("null", {});
      expect(res).toBeNull();
    });
  });

  describe("setNavInfo", () => {
    it("应解析字符串字段并设置到 navInfo（使用 mock 方法返回的数据）", async () => {
      const { setNavInfo, navInfo } = useLargeScreenInfo();

      // 通过 mock 的 API 获取数据
      const apiResult = await buildApi.getLargeScreenInfo(23587);
      setNavInfo((apiResult as any).result);

      // 基础字段
      expect(navInfo.value.id).toBe(23587);
      expect(navInfo.value.name).toBe("组件测试大屏");
      expect(navInfo.value.versionCode).toBe("1");

      // layers 仍被 omit，不应出现在 navInfo 中
      expect((navInfo.value as any).layers).toBeUndefined();
      // detail 下沉到 @screenwright/core 后与 navInfo 共享同一份状态（尺寸/适配等），已解析为对象保留在 navInfo 上
      expect(typeof navInfo.value.detail).toBe("object");
      expect(navInfo.value.detail).not.toBeNull();
      expect(navInfo.value.detail.width).toBeDefined();

      // config: 字符串 -> 数组
      expect(Array.isArray(navInfo.value.config)).toBe(true);
      expect((navInfo.value.config as any[]).length).toBe(5);

      // dataFilterArr: 字符串 -> 对象
      expect(typeof navInfo.value.dataFilterArr).toBe("object");
      expect(navInfo.value.dataFilterArr).toEqual({});

      // aniFrameSet: 字符串 -> 对象（mock 为 "{}"）
      expect(typeof navInfo.value.aniFrameSet).toBe("object");

      // statusAnimation: 字符串 -> 对象
      expect(typeof navInfo.value.statusAnimation).toBe("object");

      // encodedControl: null -> fallback []
      expect(Array.isArray(navInfo.value.encodedControl)).toBe(true);
      expect(navInfo.value.encodedControl).toEqual([]);
    });
  });

  describe("setVersionCode", () => {
    it("只更新 versionCode，不影响其他字段", async () => {
      const { setNavInfo, setVersionCode, navInfo } = useLargeScreenInfo();
      const apiResult = await buildApi.getLargeScreenInfo(23587);
      setNavInfo((apiResult as any).result);

      const prevId = navInfo.value.id;
      setVersionCode("2");

      expect(navInfo.value.versionCode).toBe("2");
      expect(navInfo.value.id).toBe(prevId);
    });
  });

  describe("resetNavInfo", () => {
    it("重置后引用及值与 defaultNavInfo 一致", async () => {
      const { setNavInfo, resetNavInfo, navInfo } = useLargeScreenInfo();
      const apiResult = await buildApi.getLargeScreenInfo(23587);
      setNavInfo((apiResult as any).result);
      expect(navInfo.value).not.toEqual(defaultNavInfo);

      resetNavInfo();
      expect(navInfo.value).toEqual(defaultNavInfo);
    });
  });
});
