import { debounce } from "lodash-es";

/**
 * 调试工具函数，用于测试和监控LRU机制
 */
import { dbManager, STORE_NAME } from "@/db";

/**
 * 创建防抖批量更新器（使用 lodash debounce），支持基于组件ID的去重
 */
export const createDebouncedBatchUpdater = <T extends { id: string | number }>(
  saveBatchHistoryFn: (updates: T[]) => void,
  delay = 300
) => {
  const pendingUpdates = new Map<string, T>(); // 使用Map存储，键为组件ID，值为组件数据

  const flushUpdates = () => {
    if (pendingUpdates.size === 0) {
      return;
    }
    const updateArray = Array.from(pendingUpdates.values()); // 转换为数组
    saveBatchHistoryFn(updateArray);
    pendingUpdates.clear();
  };

  // 使用 lodash debounce
  const debouncedFlush = debounce(flushUpdates, delay);

  const addUpdate = (updateItem: T) => {
    const componentId = updateItem.id.toString();
    // 如果已存在该组件，则覆盖之前的内容（保留最后一次修改）
    pendingUpdates.set(componentId, updateItem);
    debouncedFlush();
  };

  const flush = () => {
    debouncedFlush.cancel();
    flushUpdates();
  };

  const clear = () => {
    pendingUpdates.clear();
    debouncedFlush.cancel();
  };

  const getPendingCount = () => pendingUpdates.size;

  return { addUpdate, flush, clear, getPendingCount };
};

/**
 * 为删除操作创建专门的防抖批量更新器，支持基于组件ID的去重
 */
export const createDebouncedBatchDeleteUpdater = <T extends { component: { id: string | number }; moduleId: number }>(
  saveBatchHistoryFn: (updates: T[]) => void,
  delay = 300
) => {
  const pendingUpdates = new Map<string, T>(); // 使用Map存储，键为组件ID，值为删除操作数据

  const flushUpdates = () => {
    if (pendingUpdates.size === 0) {
      return;
    }
    const updateArray = Array.from(pendingUpdates.values()); // 转换为数组
    saveBatchHistoryFn(updateArray);
    pendingUpdates.clear();
  };

  // 使用 lodash debounce
  const debouncedFlush = debounce(flushUpdates, delay);

  const addDelete = (deleteItem: T) => {
    const componentId = deleteItem.component.id.toString();
    // 如果已存在该组件的删除操作，则覆盖之前的内容（保留最后一次删除）
    pendingUpdates.set(componentId, deleteItem);
    debouncedFlush();
  };

  const flush = () => {
    debouncedFlush.cancel();
    flushUpdates();
  };

  const clear = () => {
    pendingUpdates.clear();
    debouncedFlush.cancel();
  };

  const getPendingCount = () => pendingUpdates.size;

  return { addDelete, flush, clear, getPendingCount };
};

/**
 * 调试：获取LRU统计信息
 */
export const debugLRUStats = async () => {
  try {
    const stats = await dbManager.getLRUStats(STORE_NAME);
    return stats;
  } catch (error) {
    console.error("获取LRU统计信息失败:", error);
  }
};

/**
 * 调试：强制触发LRU清理
 */
export const debugForceLRUCleanup = async () => {
  try {
    // 可以通过添加一个新的缓存数据来触发清理
    const testData = {
      id: `test-${Date.now()}`,
      result: { test: true },
      cacheTime: Date.now()
    };

    await dbManager.add(STORE_NAME, testData);
  } catch (error) {
    console.error("强制触发LRU清理失败:", error);
  }
};

/**
 * 调试：检查当前存储的数据数量
 */
export const debugStorageCount = async () => {
  try {
    const count = await dbManager.count(STORE_NAME);
    return count;
  } catch (error) {
    console.error("获取存储数量失败:", error);
  }
};

/**
 * 调试：获取所有缓存数据
 */
export const debugGetAllCacheData = async () => {
  try {
    const allData = await dbManager.getAll(STORE_NAME);
    return allData;
  } catch (error) {
    console.error("获取所有缓存数据失败:", error);
  }
};
