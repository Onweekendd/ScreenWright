import type { ComponentType } from "@screenwright/types";
import { createGlobalState } from "@vueuse/core";
import { computed, type Ref, toRef } from "vue";

import { useScreenEditor } from "./core-adapter/useScreenEditor";

/** 画布选中目标类型（与 @screenwright/core SelectionManager 的 TargetChart 结构一致） */
export interface TargetChartType {
  hoverId?: number;
  selectId: string[];
}

/**
 * 编辑器选区状态 composable（适配层）。
 * 选区模型（componentList / targetChart / 选中派生 / 选中归一化 / 递归查找）由 @screenwright/core 的
 * SelectionManager 托管；这里只把它接成 Vue 响应式，并附带纯 window.location 路由判断
 * （isBuild/isPanel/... 与业务状态无关，零耦合，直接下沉）。
 *
 * editCanvas（DOM）、editConfig（app 默认值 + HTTP 保存）、mousePosition/rightMenuShow 等
 * UI 交互态、scrollIntoView（DOM）属 app 专属能力，不在这里，由 app 侧的 useEditStore 组合。
 */
export const useEditStore = createGlobalState(() => {
  const editor = useScreenEditor();
  const selection = editor.selection;

  const isBuild = () => {
    const pathname = window.location.pathname;
    return !!pathname && pathname.includes("build");
  };

  /** @description 是否处于 动态面板/终端交互 编辑状态 */
  const isPanel = () => {
    const pathname = window.location.pathname;
    if (!pathname) {
      return false;
    }
    const panelPathNames = ["panel", "encode", "special"];
    return panelPathNames.some((name) => pathname.includes(name));
  };

  const isDynamicPanel = () => {
    const pathname = window.location.pathname;
    return !!pathname && pathname.includes("panel");
  };

  /** @description 是否处于 终端交互 编辑状态 */
  const isEncodePanel = () => {
    const pathname = window.location.pathname;
    return !!pathname && pathname.includes("encode");
  };

  // 编辑组件列表：可写 ref，直连 core 状态；push/splice/整体赋值都会回写 core
  const componentList = toRef(editor.state.getState(), "componentList") as unknown as Ref<ComponentType[]>;

  // 目标图表：可写 ref，直连 core 选区状态
  const targetChart = toRef(editor.state.getState(), "targetChart") as unknown as Ref<TargetChartType>;

  // 选中的元素（由 core 选区模型派生）
  const selectTargetData = computed<ComponentType[]>(() => selection.selectTargetData() as unknown as ComponentType[]);

  // 选中的元素初始数据
  const selectTargetDataInitial = computed(
    () => selection.selectTargetDataInitial() as unknown as (ComponentType | null)[]
  );

  // 选中元素的id和子元素id
  const selectTargetDataId = computed(() => selection.selectTargetDataId());

  /** @description 同步全局组件数据 */
  const syncGlobalComponentData = () => {
    selection.syncFromLayers();
  };

  // * 设置目标数据 hover
  const setTargetHoverChart = (hoverId?: TargetChartType["hoverId"]) => {
    selection.setTargetHoverChart(hoverId);
  };

  // * 设置目标数据 select
  const setTargetSelectChart = (selectId?: string | string[], push = false) => {
    selection.setTargetSelectChart(selectId, push);
  };

  const fetchTargetById = (id: string) => {
    return selection.fetchTargetById(id) as unknown as ComponentType | null;
  };

  /** @description 重置选区状态（不含 app 侧的右键菜单/编辑配置） */
  const resetSelection = () => {
    setTargetSelectChart(undefined);
    componentList.value = [];
  };

  /**
   * 当前画布对应的 placement：大屏根级为 undefined，面板编辑态为该面板的当前状态。
   *
   * componentList 始终是 layers 里的一个活数组（根级就是 layers 本身，面板态是某个状态的 config），
   * 所以直接按引用反查它挂在树的哪儿，而不是按路由猜——动态面板 / 编码面板 / 特殊面板
   * 三种编辑器一视同仁。往「当前画布」新增组件时用它换算出 placement，交给 core 落位。
   */
  const currentCanvasPlacement = () => editor.component.placementOfList(componentList.value) ?? undefined;

  return {
    targetChart,
    componentList,
    currentCanvasPlacement,
    selectTargetDataId,
    selectTargetData,
    selectTargetDataInitial,
    syncGlobalComponentData,
    setTargetHoverChart,
    setTargetSelectChart,
    fetchTargetById,
    resetSelection,
    isPanel,
    isDynamicPanel,
    isEncodePanel,
    isBuild
  };
});
