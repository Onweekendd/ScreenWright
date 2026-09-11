/**
 * 全局 WASM 对齐模块管理
 *
 * 提供单例模式的 BIAlignmentInstance 实例管理
 * 确保 WASM 模块只初始化一次，提高性能
 */
import { computed, ref, shallowRef } from "vue";
import { createGlobalState } from "@vueuse/core";

import init, { BIAlignmentInstance, BINode } from "@screenwright/alignment-wasm";

import type { ComponentMap } from "@/views/build/useGlobalComponentData";
import { buildComponentMap } from "@/views/build/useGlobalComponentData";

import { PanelType } from "../core/SystemComponent/type";
import type { ComponentType } from "../type";
import { useEditStore } from "./useEditStore";

/**
 * 全局 WASM 对齐 Hook
 */
export const useAlignmentWasm = createGlobalState(() => {
  const tolerance = ref(5);
  const wasmInitialized = ref(false);
  const biAlignmentInstance = shallowRef<BIAlignmentInstance | null>(null);
  const initializationPromise = ref<Promise<void> | null>(null);
  const { componentList } = useEditStore();

  /**
   * 当前渲染的组件 分组子组件打平
   */
  const renderComponentFlattenChild = computed(() => {
    const componentMap: ComponentMap = new Map();
    buildComponentMap({
      componentList: componentList.value,
      componentMap,
      parentDynamicPanelId: [],
      assignParentDynamicPanelId: false,
      processPanel: false,
      processPresetChild: false
    });

    return Array.from(componentMap.values());
  });

  const verticalLines = ref<
    Array<{
      x: number;
      y: number[];
    }>
  >([]);

  const horizontalLines = ref<
    Array<{
      x: number[];
      y: number;
    }>
  >([]);

  /**
   * 初始化 WASM 模块
   * 使用 Promise 缓存确保只初始化一次，即使多次并发调用
   */
  const initializeWasm = async () => {
    // 如果已经初始化，直接返回
    if (wasmInitialized.value && biAlignmentInstance.value) {
      return;
    }

    // 如果正在初始化，等待之前的初始化完成
    if (initializationPromise.value) {
      return initializationPromise.value;
    }

    // 开始新的初始化
    initializationPromise.value = (async () => {
      try {
        // 初始化 WASM 模块
        await init();

        // 创建全局实例
        biAlignmentInstance.value = new BIAlignmentInstance(tolerance.value);

        wasmInitialized.value = true;

        console.log("[WASM] BIAlignmentInstance 初始化成功");
      } catch (error) {
        console.error("[WASM] 初始化失败:", error);
        throw error;
      } finally {
        // 清理 Promise 缓存
        initializationPromise.value = null;
      }
    })();

    return initializationPromise.value;
  };

  /**
   * 获取 WASM 对齐实例
   * 如果未初始化，会自动初始化
   */
  const getAlignmentInstance = async (): Promise<BIAlignmentInstance> => {
    if (!wasmInitialized.value || !biAlignmentInstance.value) {
      await initializeWasm();
    }

    return biAlignmentInstance.value!;
  };

  /**
   * 重置 WASM 实例（用于测试或特殊场景）
   */
  const resetAlignmentInstance = (): void => {
    if (biAlignmentInstance.value) {
      biAlignmentInstance.value.free();
      biAlignmentInstance.value = null;
    }
    wasmInitialized.value = false;
    initializationPromise.value = null;

    resetAlignmentLines();
  };

  const resetAlignmentLines = () => {
    verticalLines.value = [];
    horizontalLines.value = [];
    biAlignmentInstance.value?.clear_alignment();
  };

  /**
   * 构建对齐节点数据
   * @description 计算并构建所有的对齐节点数据，包括根节点和所有子组件节点
   * @returns 由根节点和子组件节点组成的BINode数组
   * @remarks
   * - 会创建一个ID为0的根节点，尺寸为画布的宽高
   * - 将所有扁平化的子组件转换为BINode数据结构
   */
  const buildAlignmentNodes = ({
    renderWidth,
    renderHeight
  }: {
    renderWidth: number;
    renderHeight: number;
  }): BINode[] => {
    const renderNode = new BINode(0, 0, 0, renderWidth, renderHeight);

    return [
      renderNode,
      ...renderComponentFlattenChild.value.map((component) => {
        const id = Number(component.id);
        const left = component.left;
        const top = component.top;

        let width = component.component.width;
        let height = component.component.height;

        if (component.unitPavenType === "percent") {
          width = (width / 100) * renderWidth;
          height = (height / 100) * renderHeight;
        }

        if (component.component.prop === PanelType.encodePanel) {
          width = 350;
          height = 200;
        }
        return new BINode(id, left, top, width, height);
      })
    ];
  };

  /**
   * 同步组件数据到WASM对齐实例
   * @description 将计算得到的对齐节点数据初始化到WASM对齐实例中
   * @remarks
   * - 如果WASM实例未初始化，则直接返回
   * - 调用 buildAlignmentNodes 计算节点数据，然后初始化到WASM实例
   */
  const syncComponentData = ({ renderWidth, renderHeight }: { renderWidth: number; renderHeight: number }): void => {
    if (!biAlignmentInstance.value) {
      return;
    }

    const nodes = buildAlignmentNodes({ renderWidth, renderHeight });
    biAlignmentInstance.value.initialize(nodes);
  };

  const searchPointComponentIds = (x: number, y: number): string[] => {
    if (!biAlignmentInstance.value) {
      return [];
    }

    return Array.from(biAlignmentInstance.value.search_point(x, y), (id) => `${id}`);
  };

  /**
   * 更新对齐线数据
   * @description 从WASM实例中获取最新的垂直和水平对齐线，并更新到响应式状态中
   * @remarks
   * - 垂直线包含x坐标和多个y坐标点
   * - 水平线包含y坐标和多个x坐标点
   * - WASM返回的是Float64Array，需要转换为普通数组以便在Vue中使用
   */
  const updateAlignmentLine = () => {
    const newVerticalLines = biAlignmentInstance.value?.get_vertical_lines();
    const newHorizontalLines = biAlignmentInstance.value?.get_horizontal_lines();

    if (newVerticalLines) {
      verticalLines.value = newVerticalLines.map((line) => {
        return {
          x: line.x,
          // WASM 返回的是 Float64Array，需要转换为普通数组
          y: Array.from(line.ys)
        };
      });
    }

    if (newHorizontalLines) {
      horizontalLines.value = newHorizontalLines.map((line) => {
        return {
          y: line.y,
          // WASM 返回的是 Float64Array，需要转换为普通数组
          x: Array.from(line.xs)
        };
      });
    }
  };

  /**
   * 更新节点信息
   * @description 在WASM对齐实例中更新现有节点的位置和尺寸信息
   * @param oldComponent 旧的组件数据
   * @param newComponent 新的组件数据
   * @returns WASM实例返回的更新结果，如果实例未初始化则返回undefined
   * @remarks
   * - 通过旧组件和新组件的对比，在WASM中更新节点
   * - 用于组件移动、缩放等操作后同步到对齐系统
   */
  const updateNode = (oldComponent: ComponentType, newComponent: ComponentType) => {
    if (!biAlignmentInstance.value) {
      return;
    }

    const result = biAlignmentInstance.value.update_node(
      new BINode(
        Number(oldComponent.id),
        oldComponent.left,
        oldComponent.top,
        oldComponent.component.width,
        oldComponent.component.height
      ),
      new BINode(
        Number(newComponent.id),
        newComponent.left,
        newComponent.top,
        newComponent.component.width,
        newComponent.component.height
      )
    );

    return result;
  };

  /**
   * 添加新节点到对齐系统
   * @description 将新组件添加到WASM对齐实例中，使其参与对齐计算
   * @param component 要添加的组件数据
   * @returns WASM实例返回的添加结果，如果实例未初始化则返回undefined
   * @remarks
   * - 用于新建组件后将其加入对齐系统
   * - 节点包含组件的ID、位置（left, top）和尺寸（width, height）
   */
  const addNode = (component: ComponentType) => {
    if (!biAlignmentInstance.value) {
      return;
    }

    const result = biAlignmentInstance.value.add_node(
      new BINode(
        Number(component.id),
        component.left,
        component.top,
        component.component.width,
        component.component.height
      )
    );

    return result;
  };

  /**
   * 从对齐系统中移除节点
   * @description 从WASM对齐实例中删除指定组件节点，使其不再参与对齐计算
   * @param component 要移除的组件数据
   * @returns WASM实例返回的删除结果，如果实例未初始化则返回undefined
   * @remarks
   * - 用于删除组件后从对齐系统中移除对应节点
   * - 需要提供完整的组件信息（ID、位置、尺寸）以确保正确删除
   */
  const removeNode = (component: ComponentType) => {
    if (!biAlignmentInstance.value) {
      return;
    }

    const result = biAlignmentInstance.value.delete_node(
      new BINode(
        Number(component.id),
        component.left,
        component.top,
        component.component.width,
        component.component.height
      )
    );

    return result;
  };

  /**
   * 移动结束时的清理操作
   * @description 当组件移动结束后，清除WASM对齐实例中的对齐状态和对齐线显示
   * @remarks
   * - 如果WASM实例未初始化，则直接返回
   * - 清除WASM实例中的对齐计算状态
   * - 清空垂直和水平对齐线数组，隐藏对齐线显示
   */
  const onMoveEnd = () => {
    if (!biAlignmentInstance.value) {
      return;
    }
    biAlignmentInstance.value.clear_alignment();
    verticalLines.value = [];
    horizontalLines.value = [];
  };

  return {
    // 状态
    wasmInitialized,
    biAlignmentInstance,
    verticalLines,
    horizontalLines,
    tolerance,

    // 方法
    initializeWasm,
    resetAlignmentLines,
    updateAlignmentLine,
    updateNode,
    addNode,
    removeNode,
    onMoveEnd,
    getAlignmentInstance,
    resetAlignmentInstance,
    buildAlignmentNodes,
    syncComponentData,
    searchPointComponentIds
  };
});
