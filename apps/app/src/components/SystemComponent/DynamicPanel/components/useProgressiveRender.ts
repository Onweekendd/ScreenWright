import { computed, ref } from "vue";

import type { DynamicPanelProps } from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";
import type { ComponentType } from "@/views/build/components/buildRender/type";

import type { Logger, RenderedStatusData, RenderQueueItem, ScheduledTask, Scheduler } from "./utils";
import {
  calculateBatchSize,
  calculateRenderProgress,
  createInitialRenderQueue,
  DefaultLogger,
  DefaultScheduler,
  isRenderComplete,
  mergeComponentsToRenderList,
  processStatusData,
  safeGetProcessedStatus,
  safeGetRenderedStatus
} from "./utils";

/**
 * @description ProgressiveRenderOptions 配置项
 * - batchSize: 每批渲染的数量
 * - priorityIndex: 优先渲染的索引，默认为0
 * - renderInterval: 渲染间隔时间（毫秒），默认为16ms（约60fps）
 * - logger: 可注入的日志器
 * - scheduler: 可注入的调度器
 */
interface ProgressiveRenderOptions {
  batchSize?: number;
  priorityIndex?: number;
  renderInterval?: number;
  logger?: Logger;
  scheduler?: Scheduler;
}

/**
 * 渐进式渲染 Hook (改进版)
 * @param dynamicPanel 动态面板组件
 * @param options 选项配置
 * @returns 渲染后的状态数据和控制方法
 */
export function useProgressiveRender(dynamicPanel: DynamicPanelProps, options: ProgressiveRenderOptions = {}) {
  const {
    batchSize = 5,
    priorityIndex = 0,
    renderInterval = 20,
    logger = new DefaultLogger(),
    scheduler = new DefaultScheduler()
  } = options;

  const statusDataSource = computed(() => dynamicPanel?.panelData || []);

  // 渐进式渲染的状态管理
  const renderedStatusData = ref<RenderedStatusData[]>([]);
  const renderQueue = ref<RenderQueueItem[]>([]);
  const isRenderingRef = ref(false);

  let currentRenderTask: ScheduledTask | null = null;

  // 预处理statusData，对component进行排序
  const processedStatusData = computed<RenderedStatusData[]>(() => {
    return processStatusData(statusDataSource.value);
  });

  // 使用工具函数进行安全的状态访问
  const getRenderedStatus = (index: number) => safeGetRenderedStatus(renderedStatusData.value, index);
  const getProcessedStatus = (index: number) => safeGetProcessedStatus(processedStatusData.value, index);

  // 渐进式渲染的核心逻辑（拆分为更小的函数）
  const renderNextBatch = (): ComponentType[] | null => {
    if (renderQueue.value.length === 0) {
      return null; // 没有更多项目要渲染
    }

    const currentItem = renderQueue.value[0];
    const { statusIndex, componentIndex } = currentItem;

    const targetStatus = getRenderedStatus(statusIndex);
    const processedStatus = getProcessedStatus(statusIndex);

    if (!targetStatus || !processedStatus) {
      renderQueue.value.shift();
      return null; // 继续处理下一个
    }

    const remainingComponents = processedStatus.sortedComponent.slice(componentIndex);
    const batchComponents = remainingComponents.slice(0, calculateBatchSize(remainingComponents, batchSize));

    if (batchComponents.length > 0) {
      // 使用工具函数合并组件
      mergeComponentsToRenderList(targetStatus.renderedComponent, batchComponents);
      renderQueue.value[0].componentIndex += batchComponents.length;

      // 检查是否完成当前状态的渲染
      if (isRenderComplete(renderQueue.value[0].componentIndex, processedStatus.sortedComponent.length)) {
        renderQueue.value.shift();
      }

      // 检查是否全部完成
      if (renderProgress.value === 100) {
        logger.log(`动态面板 ${dynamicPanel?.name || "Unknown"} 预加载完成`);
      }
    } else {
      renderQueue.value.shift();
    }

    return batchComponents; // 继续处理
  };

  // 执行渲染任务的回调函数
  const executeRenderTask = (): ComponentType[] => {
    currentRenderTask = null;
    let renderedComponents: ComponentType[] = [];

    if (renderQueue.value.length <= 0) {
      return renderedComponents;
    }

    const batchComponents = renderNextBatch();
    if (batchComponents) {
      renderedComponents = batchComponents;

      if (renderQueue.value.length > 0) {
        scheduleNextRender();
      } else {
        isRenderingRef.value = false;
      }
    } else {
      isRenderingRef.value = false;
    }

    return renderedComponents;
  };

  // 渐进式渲染调度
  const scheduleNextRender = () => {
    if (currentRenderTask) {
      currentRenderTask.cancel();
    }

    currentRenderTask = scheduler.schedule(executeRenderTask, renderInterval);
  };

  // 检查是否需要初始化渲染
  const shouldInitializeRender = (): boolean => {
    return processedStatusData.value.length > 0;
  };

  // 重置渲染状态
  const resetRenderState = () => {
    renderedStatusData.value = [];
    renderQueue.value = [];
    isRenderingRef.value = false;
  };

  /**
   * 初始化渲染数据结构
   */
  const initializeRenderData = () => {
    renderQueue.value = [];
    renderedStatusData.value = processedStatusData.value.map((status) => ({
      ...status,
      renderedComponent: []
    }));
  };

  // 计算安全的优先级索引
  const calculateSafePriorityIndex = (): number => {
    return Math.min(Math.max(priorityIndex, 0), processedStatusData.value.length - 1);
  };

  // 立即渲染优先状态的组件
  const renderPriorityStatus = (safePriorityIndex: number) => {
    const priorityStatus = processedStatusData.value[safePriorityIndex];

    if (priorityStatus && Array.isArray(priorityStatus.sortedComponent)) {
      renderedStatusData.value[safePriorityIndex].renderedComponent = [...priorityStatus.sortedComponent];
    }

    return priorityStatus;
  };

  // 计算渲染延迟时间
  const calculateRenderDelay = (priorityStatus: any): number => {
    return priorityStatus && Array.isArray(priorityStatus.config)
      ? priorityStatus.config.length * renderInterval
      : renderInterval;
  };

  const setRenderQueue = (queue: RenderQueueItem[]) => {
    renderQueue.value = queue;
  };

  // 启动渐进式渲染
  const startProgressiveRender = (delay: number) => {
    isRenderingRef.value = true;
    currentRenderTask = scheduler.schedule(() => {
      currentRenderTask = null;
      scheduleNextRender();
    }, delay);
  };

  const initializeRender = () => {
    try {
      // 检查是否需要初始化
      if (!shouldInitializeRender()) {
        resetRenderState();
        return;
      }

      // 停止当前的渲染任务
      stopRender();

      // 初始化渲染数据结构
      initializeRenderData();

      // 计算安全的优先级索引
      const safePriorityIndex = calculateSafePriorityIndex();

      // 立即渲染优先状态的组件
      const priorityStatus = renderPriorityStatus(safePriorityIndex);

      setRenderQueue(createInitialRenderQueue(processedStatusData.value, safePriorityIndex));

      // 开始渐进式渲染
      if (renderQueue.value.length > 0) {
        const delay = calculateRenderDelay(priorityStatus);
        startProgressiveRender(delay);
      }
    } catch (error) {
      logger.log(`渲染初始化失败: ${error}`);
      isRenderingRef.value = false;
    }
  };

  // 停止渲染
  const stopRender = () => {
    if (currentRenderTask) {
      currentRenderTask.cancel();
      currentRenderTask = null;
    }
    isRenderingRef.value = false;
  };

  // 强制重新渲染
  const forceRender = () => {
    initializeRender();
  };

  // 手动添加项目到渲染队列
  const addToRenderQueue = (statusIndex: number, fromComponentIndex = 0) => {
    if (statusIndex < 0 || statusIndex >= processedStatusData.value.length) {
      return;
    }

    const existingIndex = renderQueue.value.findIndex((item) => item.statusIndex === statusIndex);

    if (existingIndex === -1) {
      renderQueue.value.push({
        statusIndex,
        componentIndex: Math.max(fromComponentIndex, 0)
      });

      if (!isRenderingRef.value && renderQueue.value.length > 0) {
        isRenderingRef.value = true;
        scheduleNextRender();
      }
    }
  };

  // 暂停渲染
  const pauseRender = () => {
    stopRender();
  };

  // 恢复渲染
  const resumeRender = () => {
    if (renderQueue.value.length > 0 && !isRenderingRef.value) {
      isRenderingRef.value = true;
      scheduleNextRender();
    }
  };

  // 获取渲染进度
  const renderProgress = computed(() => {
    return calculateRenderProgress(processedStatusData.value, renderedStatusData.value);
  });

  const isFullRender = computed(() => {
    return renderProgress.value === 100;
  });

  // 是否正在渲染
  const isRendering = computed(() => isRenderingRef.value);

  const dispose = () => {
    stopRender();
    scheduler.cancelAll();
  };

  // 清理

  return {
    // 渲染后的数据
    renderedStatusData,
    renderProgress,
    isRendering,
    processedStatusData,
    isFullRender,
    renderQueue,

    // 控制方法
    initializeRenderData,
    calculateSafePriorityIndex,
    renderPriorityStatus,
    createInitialRenderQueue,
    setRenderQueue,
    startProgressiveRender,
    renderNextBatch,
    initializeRender,
    dispose,
    forceRender,
    addToRenderQueue,
    pauseRender,
    resumeRender,

    // 测试辅助方法
    getCurrentRenderQueue: () => [...renderQueue.value],
    getScheduler: () => scheduler,
    getLogger: () => logger
  };
}
