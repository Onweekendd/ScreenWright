/**
 * useStatusCache Hook 单元测试
 * 测试 LRU 缓存逻辑和相邻状态预加载功能
 */
import { beforeEach, describe, expect, it } from "vitest";

import type { Ref } from "vue";
import { ref } from "vue";

import { useStatusCache } from "@/components/SystemComponent/DynamicPanel/hooks/useStatusCache";
import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";

/**
 * 创建模拟的面板状态数据
 */
function createMockPanelData(count: number): PanelState[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `状态${i + 1}`,
    title: `状态 ${i + 1}`,
    name: `状态 ${i + 1}`,
    config: [],
    backgroundColor: "#ffffff",
    showBackgroundImage: false,
    backgroundImage: "",
    showScreenAdaptation: false,
    adaptationNorm: "",
    adaptationType: 0
  }));
}

describe("useStatusCache - LRU 缓存逻辑", () => {
  let panelData: Ref<PanelState[]>;
  let activeStatusId: Ref<string | null>;

  beforeEach(() => {
    // 创建 10 个状态
    panelData = ref(createMockPanelData(10));
    activeStatusId = ref(null);
  });

  describe("基础缓存功能", () => {
    it("应该缓存当前状态", () => {
      activeStatusId.value = "状态3";

      const { cachedStatusIds } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize: 5,
        preloadAdjacent: false // 暂时禁用预加载，只测试当前状态
      });

      expect(cachedStatusIds.value).toContain("状态3");
    });

    it("应该在缓存中包含相邻状态（启用预加载时）", () => {
      activeStatusId.value = "状态5";

      const { cachedStatusIds } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize: 5,
        preloadAdjacent: true
      });

      // 应该包含：状态5（当前）+ 状态4（前）+ 状态6（后）
      expect(cachedStatusIds.value).toContain("状态4");
      expect(cachedStatusIds.value).toContain("状态5");
      expect(cachedStatusIds.value).toContain("状态6");
    });

    it("应该尊重 maxCacheSize 限制", () => {
      activeStatusId.value = "状态1";
      const maxCacheSize = 3;

      const { cachedStatusIds } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize,
        preloadAdjacent: true
      });

      // 最多缓存 3 个状态
      expect(cachedStatusIds.value.length).toBeLessThanOrEqual(maxCacheSize);
    });
  });

  describe("LRU 缓存清理逻辑", () => {
    it("应该按访问顺序管理缓存（LRU）", () => {
      const maxCacheSize = 3;
      const { cachedStatusIds, accessStatus } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize,
        preloadAdjacent: false
      });

      // 访问顺序：状态1 → 状态2 → 状态3 → 状态4
      accessStatus("状态1");
      expect(cachedStatusIds.value).toEqual(["状态1"]);

      accessStatus("状态2");
      expect(cachedStatusIds.value).toEqual(["状态1", "状态2"]);

      accessStatus("状态3");
      expect(cachedStatusIds.value).toEqual(["状态1", "状态2", "状态3"]);

      // 第4个状态应该移除最旧的（状态1）
      accessStatus("状态4");
      expect(cachedStatusIds.value).toEqual(["状态2", "状态3", "状态4"]);
      expect(cachedStatusIds.value).not.toContain("状态1");
    });

    it("应该将重新访问的状态移到队列末尾", () => {
      const maxCacheSize = 3;
      const { cachedStatusIds, accessStatus } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize,
        preloadAdjacent: false
      });

      // 访问顺序：状态1 → 状态2 → 状态3
      accessStatus("状态1");
      accessStatus("状态2");
      accessStatus("状态3");
      expect(cachedStatusIds.value).toEqual(["状态1", "状态2", "状态3"]);

      // 重新访问状态1（应该移到队列末尾）
      accessStatus("状态1");
      expect(cachedStatusIds.value).toEqual(["状态2", "状态3", "状态1"]);

      // 添加新状态，应该移除状态2（现在是最旧的）
      accessStatus("状态4");
      expect(cachedStatusIds.value).toEqual(["状态3", "状态1", "状态4"]);
    });
  });

  describe("相邻状态预加载", () => {
    it("应该预加载前一个状态（当前不是第一个）", () => {
      activeStatusId.value = "状态5";

      const { renderedStatusIds } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize: 5,
        preloadAdjacent: true
      });

      expect(renderedStatusIds.value).toContain("状态4"); // 前一个
      expect(renderedStatusIds.value).toContain("状态5"); // 当前
    });

    it("应该预加载后一个状态（当前不是最后一个）", () => {
      activeStatusId.value = "状态5";

      const { renderedStatusIds } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize: 5,
        preloadAdjacent: true
      });

      expect(renderedStatusIds.value).toContain("状态5"); // 当前
      expect(renderedStatusIds.value).toContain("状态6"); // 后一个
    });

    it("第一个状态不应该预加载前一个状态", () => {
      activeStatusId.value = "状态1";

      const { renderedStatusIds } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize: 5,
        preloadAdjacent: true
      });

      // 应该只有当前和后一个
      expect(renderedStatusIds.value).toEqual(["状态1", "状态2"]);
    });

    it("最后一个状态不应该预加载后一个状态", () => {
      activeStatusId.value = "状态10";

      const { renderedStatusIds } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize: 5,
        preloadAdjacent: true
      });

      // 应该只有前一个和当前
      expect(renderedStatusIds.value).toEqual(["状态10", "状态9"]);
    });

    it("禁用预加载时只应返回当前状态", () => {
      activeStatusId.value = "状态5";

      const { renderedStatusIds } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize: 5,
        preloadAdjacent: false
      });

      expect(renderedStatusIds.value).toEqual(["状态5"]);
    });
  });

  describe("边界情况测试", () => {
    it("maxCacheSize = 0 时应该缓存所有状态", () => {
      activeStatusId.value = "状态5";

      const { cachedStatusIds } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize: 0,
        preloadAdjacent: true
      });

      // 应该包含所有 10 个状态
      expect(cachedStatusIds.value.length).toBe(10);
    });

    it("activeStatusId 为 null 时应该返回空数组", () => {
      activeStatusId.value = null;

      const { renderedStatusIds } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize: 5,
        preloadAdjacent: true
      });

      expect(renderedStatusIds.value).toEqual([]);
    });

    it("只有一个状态时应该正常工作", () => {
      panelData.value = createMockPanelData(1);
      activeStatusId.value = "状态1";

      const { cachedStatusIds, renderedStatusIds } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize: 5,
        preloadAdjacent: true
      });

      expect(cachedStatusIds.value).toEqual(["状态1"]);
      expect(renderedStatusIds.value).toEqual(["状态1"]);
    });
  });

  describe("复杂场景测试", () => {
    it("连续切换相邻状态时的缓存行为", () => {
      const { cachedStatusIds } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize: 5,
        preloadAdjacent: true
      });

      // 访问状态序列：1 → 2 → 3 → 4 → 5
      activeStatusId.value = "状态1";
      expect(cachedStatusIds.value).toContain("状态1");
      expect(cachedStatusIds.value).toContain("状态2"); // 预加载

      activeStatusId.value = "状态2";
      expect(cachedStatusIds.value).toContain("状态1"); // 前一个
      expect(cachedStatusIds.value).toContain("状态2"); // 当前
      expect(cachedStatusIds.value).toContain("状态3"); // 后一个

      activeStatusId.value = "状态3";
      expect(cachedStatusIds.value).toContain("状态2");
      expect(cachedStatusIds.value).toContain("状态3");
      expect(cachedStatusIds.value).toContain("状态4");
    });

    it("跳跃访问状态时的LRU清理", () => {
      const { cachedStatusIds } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize: 5,
        preloadAdjacent: true
      });

      // 访问状态1（缓存：1, 2）
      activeStatusId.value = "状态1";
      const cache1 = [...cachedStatusIds.value];
      expect(cache1).toContain("状态1");
      expect(cache1).toContain("状态2");

      // 跳转到状态6（缓存应该变化）
      activeStatusId.value = "状态6";
      const cache2 = [...cachedStatusIds.value];

      // 应该包含状态5、6、7
      expect(cache2).toContain("状态5");
      expect(cache2).toContain("状态6");
      expect(cache2).toContain("状态7");

      // 由于 maxCacheSize=5，旧状态可能被清理
      expect(cachedStatusIds.value.length).toBeLessThanOrEqual(5);
    });
  });

  describe("resetCache 功能", () => {
    it("应该能够重置缓存", () => {
      const { cachedStatusIds, resetCache, accessStatus } = useStatusCache(panelData, activeStatusId, {
        maxCacheSize: 5,
        preloadAdjacent: false
      });

      // 添加一些状态到缓存
      accessStatus("状态1");
      accessStatus("状态2");
      accessStatus("状态3");
      expect(cachedStatusIds.value.length).toBeGreaterThan(0);

      // 重置缓存
      resetCache();

      // 缓存应该被清空
      // 注意：由于 activeStatusId 可能触发 computed 重新计算，
      // 这里测试的是 resetCache 的直接效果
      expect(cachedStatusIds.value.length).toBe(0);
    });
  });
});
