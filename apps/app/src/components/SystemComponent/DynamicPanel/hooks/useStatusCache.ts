import type { ComputedRef, Ref } from "vue";
import { computed, ref } from "vue";

import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";

/**
 * LRU 缓存项接口
 */
interface CacheItem {
  statusId: string;
  lastAccessTime: number;
}

/**
 * 状态缓存配置接口
 */
interface StatusCacheOptions {
  /** 最大缓存数量，0表示不限制 */
  maxCacheSize: number;
  /** 是否预加载相邻状态 */
  preloadAdjacent: boolean;
  /** 预加载的相邻状态数量，默认为 1 */
  adjacentCount?: number;
}

/**
 * 状态缓存返回值接口
 */
interface StatusCacheResult {
  /** 应该被缓存的状态ID列表 (用于 KeepAlive include) */
  cachedStatusIds: ComputedRef<string[]>;
  /** 应该被渲染的状态ID列表 (当前 + 相邻) */
  renderedStatusIds: ComputedRef<string[]>;
  /** 访问指定状态，更新 LRU 缓存 */
  accessStatus: (statusId: string) => void;
  /** 重置缓存 */
  resetCache: () => void;
}

/**
 * 状态缓存管理 Hook
 * 使用 LRU 策略管理状态缓存，支持相邻状态预加载
 *
 * @param panelData - 面板状态数据
 * @param activeStatusId - 当前激活的状态ID
 * @param options - 缓存配置选项
 * @returns 缓存管理相关功能
 */
export function useStatusCache(
  panelData: Ref<PanelState[]>,
  activeStatusId: Ref<string | null>,
  options: StatusCacheOptions
): StatusCacheResult {
  const { maxCacheSize = 5, preloadAdjacent = true, adjacentCount = 1 } = options;

  // LRU 缓存队列 - 按访问时间排序
  const cacheQueue = ref<CacheItem[]>([]);

  /**
   * 访问状态，更新 LRU 缓存
   * @param statusId - 状态ID
   */
  const accessStatus = (statusId: string): void => {
    const now = Date.now();

    // 查找是否已存在
    const existingIndex = cacheQueue.value.findIndex((item) => item.statusId === statusId);

    if (existingIndex !== -1) {
      // 已存在，更新访问时间并移到队尾
      cacheQueue.value[existingIndex].lastAccessTime = now;
      const item = cacheQueue.value.splice(existingIndex, 1)[0];
      cacheQueue.value.push(item);
    } else {
      // 不存在，添加到队尾
      cacheQueue.value.push({
        statusId,
        lastAccessTime: now
      });

      // 如果超出最大缓存数量，移除最旧的
      if (maxCacheSize > 0 && cacheQueue.value.length > maxCacheSize) {
        cacheQueue.value.shift();
      }
    }
  };

  /**
   * 获取相邻状态ID（前N个和后N个）
   * @param statusId - 当前状态ID
   * @returns 相邻状态ID数组
   */
  const getAdjacentStatusIds = (statusId: string | null): string[] => {
    if (!statusId || !preloadAdjacent || panelData.value.length === 0 || adjacentCount <= 0) {
      return [];
    }

    const currentIndex = panelData.value.findIndex((state) => state.id === statusId);
    if (currentIndex === -1) {
      return [];
    }

    const adjacentIds: string[] = [];

    // 前N个状态
    for (let i = 1; i <= adjacentCount; i++) {
      if (currentIndex - i >= 0) {
        adjacentIds.push(panelData.value[currentIndex - i].id);
      }
    }

    // 后N个状态
    for (let i = 1; i <= adjacentCount; i++) {
      if (currentIndex + i < panelData.value.length) {
        adjacentIds.push(panelData.value[currentIndex + i].id);
      }
    }

    return adjacentIds;
  };

  /**
   * 应该被缓存的状态ID列表
   * 基于 LRU 策略，返回需要缓存的状态
   */
  const cachedStatusIds = computed<string[]>(() => {
    if (maxCacheSize === 0) {
      // 不限制缓存，返回所有状态
      return panelData.value.map((state) => state.id);
    }

    // 确保当前激活状态在缓存中
    if (activeStatusId.value) {
      accessStatus(activeStatusId.value);
    }

    // 确保相邻状态在缓存中
    const adjacentIds = getAdjacentStatusIds(activeStatusId.value);
    adjacentIds.forEach((id) => {
      const exists = cacheQueue.value.some((item) => item.statusId === id);
      if (!exists) {
        accessStatus(id);
      }
    });

    return cacheQueue.value.map((item) => item.statusId);
  });

  /**
   * 应该被渲染的状态ID列表
   * 包括当前状态和相邻状态（如果启用预加载）
   */
  const renderedStatusIds = computed<string[]>(() => {
    if (!activeStatusId.value) {
      return [];
    }

    const rendered = [activeStatusId.value];

    if (preloadAdjacent) {
      const adjacentIds = getAdjacentStatusIds(activeStatusId.value);
      rendered.push(...adjacentIds);
    }

    return rendered;
  });

  /**
   * 重置缓存
   */
  const resetCache = (): void => {
    cacheQueue.value = [];
  };

  return {
    cachedStatusIds,
    renderedStatusIds,
    accessStatus,
    resetCache
  };
}
