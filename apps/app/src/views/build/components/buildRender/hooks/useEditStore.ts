// 处理 画布选中的元素
import { computed, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { useEditStore as useEditStoreCore } from "@screenwright/composables";
import type { LargeScreeInfo, LargeScreenDetailInfo } from "@screenwright/types";
import { isUndefined } from "lodash-es";

import { updateLargeScreen } from "@/api/library";
import { parseIfNeeded, useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import type { EditCanvasType } from "../type";

/**
 * 编辑器状态（适配层）。
 * 选区模型（componentList / targetChart / 选中派生 / 选中归一化 / 递归查找 / 路由谓词）已下沉到
 * @screenwright/composables 的 useEditStore（包装 @screenwright/core 的 SelectionManager）。
 * editConfig 现在是 navInfo.value.detail 的可写视图，与 @screenwright/composables（终端通信等）共享同一份
 * core 状态，不再是本地独立副本（app 侧字段形状与 @screenwright/types 存在历史遗留的类型分裂，这里做一次
 * 显式断言桥接，避免把这个既有的、与本次改造无关的类型问题扩散到 useEditStore 的全部调用方）。
 * 画布（editCanvas，含 DOM 节点）、鼠标位置/右键菜单等 UI 交互态、scrollIntoView（DOM）仍是 app
 * 专属能力，留在这里。返回签名与改造前完全一致。
 */
export const useEditStore = createGlobalState(() => {
  const core = useEditStoreCore();
  const { navInfo, resetDetail } = useLargeScreenInfo();

  const mousePosition = ref({ startX: 0, startY: 0, x: 0, y: 0 });

  const editCanvas = ref<EditCanvasType>({
    // 编辑区域 Dom
    editLayoutDom: null,
    editContentDom: null,
    // 偏移量
    offset: 20,
    // 用户控制的缩放
    userScale: 1,
    // 锁定缩放
    lockScale: false,
    // 初始化
    isCreate: false,
    // 拖拽中
    isDrag: false,
    // 框选中
    isSelect: false,
    // 代码编辑中
    isCodeEdit: false
  });

  const editConfig = computed<LargeScreenDetailInfo>({
    get: () => navInfo.value.detail as unknown as LargeScreenDetailInfo,
    set: (value) => {
      navInfo.value.detail = value as unknown as typeof navInfo.value.detail;
    }
  });

  const updateEditConfig = async () => {
    await updateLargeScreen({
      detail: JSON.stringify(editConfig.value),
      id: navInfo.value.id
    });
  };

  const rightMenuShow = ref(false);

  const actionComponentId = ref<string>("");

  const setDetail2Config = (res: LargeScreeInfo) => {
    const largeScreenDetailInfo = parseIfNeeded<LargeScreenDetailInfo>(res.detail, {} as LargeScreenDetailInfo);
    if (!largeScreenDetailInfo.minioIds) {
      largeScreenDetailInfo.minioIds = [];
    }

    type LargeScreenDetailInfoWithoutScale = Omit<LargeScreenDetailInfo, "scale">;

    const { scale: _scale, ...rest } = largeScreenDetailInfo;

    // scale 不设置
    Object.keys(rest).forEach((key) => {
      setEditConfig(
        key as keyof LargeScreenDetailInfoWithoutScale,
        rest[key as keyof LargeScreenDetailInfoWithoutScale]
      );
    });
  };

  /**
   * @description 设置编辑配置
   * @param key 配置项
   * @param value 配置值
   */
  const setEditConfig = <K extends keyof LargeScreenDetailInfo>(key: K, value: LargeScreenDetailInfo[K]) => {
    editConfig.value[key] = value;
  };

  // * 设置右键菜单
  const setRightMenuShow = (value: boolean) => {
    rightMenuShow.value = value;
  };

  const setMousePosition = (x?: number, y?: number, startX?: number, startY?: number) => {
    if (!isUndefined(x)) {
      mousePosition.value.x = x;
    }
    if (!isUndefined(y)) {
      mousePosition.value.y = y;
    }
    if (!isUndefined(startX)) {
      mousePosition.value.startX = startX;
    }
    if (!isUndefined(startY)) {
      mousePosition.value.startY = startY;
    }
  };

  // * 设置 editCanvas 数据项
  const setEditCanvas = <K extends keyof EditCanvasType>(key: K, value: EditCanvasType[K]) => {
    editCanvas.value[key] = value;
  };

  const resetEditStore = () => {
    setRightMenuShow(false);
    core.resetSelection();
    resetDetail();
  };

  const scrollIntoViewTree = (id: string) => {
    const targetDom = document.querySelector(`.drag_item[data-tree='${id}']`) as HTMLElement;
    if (targetDom) {
      targetDom.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return {
    targetChart: core.targetChart,
    editCanvas,
    componentList: core.componentList,
    currentCanvasPlacement: core.currentCanvasPlacement,
    mousePosition,
    rightMenuShow,
    selectTargetDataId: core.selectTargetDataId,
    selectTargetData: core.selectTargetData,
    editConfig,
    actionComponentId,
    selectTargetDataInitial: core.selectTargetDataInitial,
    syncGlobalComponentData: core.syncGlobalComponentData,
    setDetail2Config,
    setEditConfig,
    setEditCanvas,
    setRightMenuShow,
    setTargetHoverChart: core.setTargetHoverChart,
    setMousePosition,
    fetchTargetById: core.fetchTargetById,
    setTargetSelectChart: core.setTargetSelectChart,
    resetEditStore,
    updateEditConfig,
    isPanel: core.isPanel,
    isDynamicPanel: core.isDynamicPanel,
    isEncodePanel: core.isEncodePanel,
    isBuild: core.isBuild,
    scrollIntoViewTree
  };
});
