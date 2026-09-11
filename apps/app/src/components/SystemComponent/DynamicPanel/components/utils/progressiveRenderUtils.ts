import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";
import type { ComponentType } from "@/views/build/components/buildRender/type";

export interface RenderedStatusData extends PanelState {
  renderedComponent: ComponentType[];
  sortedComponent: ComponentType[];
}

export interface RenderQueueItem {
  statusIndex: number;
  componentIndex: number;
}

/**
 * 按照 zIndex 对组件进行排序
 * @param components 组件数组
 * @returns 排序后的组件数组
 */
export function sortComponentsByZIndex(components: ComponentType[]): ComponentType[] {
  if (!Array.isArray(components)) {
    return [];
  }

  return [...components]
    .sort((a: ComponentType, b: ComponentType) => {
      const aZIndex = typeof a.zIndex === "number" ? a.zIndex : 0;
      const bZIndex = typeof b.zIndex === "number" ? b.zIndex : 0;
      return bZIndex - aZIndex;
    })
    .reverse();
}

/**
 * 处理状态数据，对组件进行排序并初始化渲染状态
 * @param statusDataSource 原始状态数据
 * @returns 处理后的状态数据
 */
export function processStatusData(statusDataSource: PanelState[]): RenderedStatusData[] {
  if (!Array.isArray(statusDataSource) || statusDataSource.length === 0) {
    return [];
  }

  return statusDataSource.map((statusData: PanelState) => {
    if (!statusData || !Array.isArray(statusData.config)) {
      return {
        ...statusData,
        sortedComponent: [],
        renderedComponent: []
      };
    }

    return {
      ...statusData,
      sortedComponent: sortComponentsByZIndex(statusData.config),
      renderedComponent: []
    };
  });
}

/**
 * 计算渲染进度百分比
 * @param processedData 处理后的数据
 * @param renderedData 已渲染的数据
 * @returns 渲染进度百分比 (0-100)
 */
export function calculateRenderProgress(
  processedData: RenderedStatusData[],
  renderedData: RenderedStatusData[]
): number {
  if (!Array.isArray(processedData) || processedData.length === 0) {
    return 100;
  }

  const totalItems = processedData.reduce((total, status) => {
    return total + (Array.isArray(status.sortedComponent) ? status.sortedComponent.length : 0);
  }, 0);

  if (totalItems === 0) {
    return 100;
  }

  const renderedItems = renderedData.reduce((total, status) => {
    return total + (Array.isArray(status.renderedComponent) ? status.renderedComponent.length : 0);
  }, 0);

  return Math.round((renderedItems / totalItems) * 100);
}

/**
 * 创建初始渲染队列，排除优先渲染的索引
 * @param processedData 处理后的数据
 * @param priorityIndex 优先渲染的索引
 * @returns 渲染队列
 */
export function createInitialRenderQueue(
  processedData: RenderedStatusData[],
  priorityIndex: number
): RenderQueueItem[] {
  if (!Array.isArray(processedData)) {
    return [];
  }

  const safeIndex = Math.min(Math.max(priorityIndex, 0), processedData.length - 1);
  const queue: RenderQueueItem[] = [];

  processedData.forEach((status, index) => {
    if (index !== safeIndex && Array.isArray(status.sortedComponent) && status.sortedComponent.length > 0) {
      queue.push({
        statusIndex: index,
        componentIndex: 0
      });
    }
  });

  return queue;
}

/**
 * 安全地获取渲染状态数据
 * @param data 状态数据数组
 * @param index 索引
 * @returns 状态数据或 null
 */
export function safeGetRenderedStatus(data: RenderedStatusData[], index: number): RenderedStatusData | null {
  if (index < 0 || index >= data.length) {
    return null;
  }
  return data[index];
}

/**
 * 安全地获取处理后的状态数据
 * @param data 处理后的状态数据数组
 * @param index 索引
 * @returns 状态数据或 null
 */
export function safeGetProcessedStatus(data: RenderedStatusData[], index: number): RenderedStatusData | null {
  if (index < 0 || index >= data.length) {
    return null;
  }
  return data[index];
}

/**
 * 验证渲染队列项是否有效
 * @param item 渲染队列项
 * @param maxStatusIndex 最大状态索引
 * @returns 是否有效
 */
export function isValidRenderQueueItem(item: RenderQueueItem, maxStatusIndex: number): boolean {
  return (
    item &&
    typeof item.statusIndex === "number" &&
    typeof item.componentIndex === "number" &&
    item.statusIndex >= 0 &&
    item.statusIndex < maxStatusIndex &&
    item.componentIndex >= 0
  );
}

/**
 * 计算渲染批次大小
 * @param remainingComponents 剩余组件数量
 * @param batchSize 批次大小
 * @returns 实际批次大小
 */
export function calculateBatchSize(remainingComponents: ComponentType[], batchSize: number): number {
  if (!Array.isArray(remainingComponents) || remainingComponents.length === 0) {
    return 0;
  }
  return Math.min(batchSize, remainingComponents.length);
}

/**
 * 检查渲染是否完成
 * @param currentIndex 当前组件索引
 * @param totalComponents 总组件数量
 * @returns 是否完成
 */
export function isRenderComplete(currentIndex: number, totalComponents: number): boolean {
  return currentIndex >= totalComponents;
}

/**
 * 创建渲染状态数据的深拷贝
 * @param data 原始数据
 * @returns 深拷贝的数据
 */
export function createRenderedStatusDataCopy(data: RenderedStatusData[]): RenderedStatusData[] {
  return data.map((status) => ({
    ...status,
    sortedComponent: [...status.sortedComponent],
    renderedComponent: [...status.renderedComponent]
  }));
}

/**
 * 合并组件到渲染列表
 * @param target 目标渲染列表
 * @param components 要添加的组件
 * @returns 是否成功添加
 */
export function mergeComponentsToRenderList(target: ComponentType[], components: ComponentType[]): boolean {
  if (!Array.isArray(target) || !Array.isArray(components)) {
    return false;
  }

  try {
    target.push(...components);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 验证组件数据是否有效
 * @param component 组件数据
 * @returns 是否有效
 */
export function isValidComponent(component: ComponentType): boolean {
  return (
    component && typeof component === "object" && (typeof component.id === "string" || typeof component.id === "number")
  );
}

/**
 * 过滤有效组件
 * @param components 组件数组
 * @returns 有效组件数组
 */
export function filterValidComponents(components: ComponentType[]): ComponentType[] {
  if (!Array.isArray(components)) {
    return [];
  }
  return components.filter(isValidComponent);
}
