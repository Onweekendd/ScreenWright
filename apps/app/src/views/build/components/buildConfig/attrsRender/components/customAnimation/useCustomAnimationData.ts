import { computed, reactive, ref, watch } from "vue";
import { createGlobalState } from "@vueuse/core";

import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import type { ActiveAnimationList, AnimationItem, ComponentSettingItem } from "./type";
import { useImmer } from "./useImmer";
import { isAnimationAvailable } from "./util";

export const LARGE_SCREEN_ANIMATION_FLAG = "largeScreenAnimation";

// 创建空的动画配置对象
const createEmptyAnimationConfig = () => ({
  load: [] as ComponentSettingItem[],
  unload: [] as ComponentSettingItem[]
});

// 更新或创建动画映射
const updateAnimationMap = (
  map: Map<string, { load: ComponentSettingItem[]; unload: ComponentSettingItem[] }>,
  key: string,
  type: "load" | "unload",
  componentSetting: ComponentSettingItem[]
) => {
  if (map.has(key)) {
    map.get(key)![type] =
      type === "load" ? componentSetting : componentSetting.filter((item) => isAnimationAvailable(item));
  } else {
    const config = createEmptyAnimationConfig();
    config[type] = type === "load" ? componentSetting : componentSetting.filter((item) => isAnimationAvailable(item));
    map.set(key, config);
  }
};

export type PanelIdAndStatusIdToAnimationMap = Map<
  string,
  {
    load: ComponentSettingItem[];
    unload: ComponentSettingItem[];
  }
>;

/**
 * 自定义动画数据层 hooks
 * 包含所有状态定义、计算属性、工具函数和基础状态变更方法
 * 预览模式只需要依赖此文件即可获取动画数据
 */
export const useCustomAnimationData = createGlobalState(() => {
  const { navInfo } = useLargeScreenInfo();

  // ==================== 状态定义 ====================

  /** 动画列表 */
  const [animationList, updateAnimationListState] = useImmer<AnimationItem[]>([]);

  /**  因为animation 使用了 immer 所以需要监听动画列表的变化来同步到navInfo */
  watch(
    () => animationList.value,
    (newVal) => {
      navInfo.value.aniFrameSet.animationList = [...newVal];
    }
  );

  const activeAnimationList = computed({
    get: () => navInfo.value.aniFrameSet.activeAnimationList || [],
    set: (newVal) => {
      if (!newVal) {
        return;
      }

      navInfo.value.aniFrameSet.activeAnimationList = [...newVal];
    }
  });

  /** 动态面板id-状态id 和 动画的映射 */
  const panelIdAndStatusIdToAnimationMap = computed(() => {
    const map: PanelIdAndStatusIdToAnimationMap = new Map();

    // 处理每个活动动画
    activeAnimationList.value.forEach((activeAnimation) => {
      const animation = animationList.value.find((animation) => animation.id === activeAnimation.animationId);
      if (!animation) {
        return;
      }

      const key =
        activeAnimation.panelId && activeAnimation.statusId
          ? `${activeAnimation.panelId}-${activeAnimation.statusId}`
          : LARGE_SCREEN_ANIMATION_FLAG;

      updateAnimationMap(map, key, activeAnimation.type, animation.componentSetting);
    });
    return map;
  });

  /** 当前选中的动画ID */
  const selectId = ref<string>("");

  /** 是否显示自定义动画编辑器 */
  const showCustomAnimation = ref<boolean>(false);

  /** 是否正在播放 */
  const isPlay = ref<boolean>(false);

  /** 当前进度时间 */
  const progressTime = ref<number>(0);

  /** 时间轴滚动距离 */
  const timeLineScrollLeft = ref<number>(0);

  /** 最大时间 */
  const maxTime = ref<number>(100000);

  /** 时间轴步长 */
  const step = ref<number>(500);

  /** 时间轴步长对应的像素 */
  const stepDistance = ref<number>(50);

  /** 可见宽度 */
  const visibleWidth = ref<number>(0);

  /** 编辑器高度 */
  const editorHeight = ref<number>(288);

  /** 进度动画控制 */
  const isProgressRunning = ref<boolean>(false);
  const maxProgressTime = ref<number>(0);

  // ==================== 历史记录状态 ====================

  /** 历史记录 */
  const history = reactive({
    undoList: [] as Array<{ animationList: AnimationItem[]; activeAnimationList: ActiveAnimationList }>,
    redoList: [] as Array<{ animationList: AnimationItem[]; activeAnimationList: ActiveAnimationList }>,
    maxHistory: 20
  });

  // ==================== 计算属性 ====================

  /** 是否可以撤销 */
  const canUndo = computed(() => history.undoList.length > 0);

  /** 是否可以重做 */
  const canRedo = computed(() => history.redoList.length > 0);

  // ==================== 计算属性 ====================

  /** 获取时间轴总宽度 */
  const getTotalTimeLineWidth = computed(() => {
    return (maxTime.value / step.value + 1) * stepDistance.value;
  });

  // ==================== 工具函数 ====================

  /**
   * 获取当前动画列表
   */
  const getCurrentAnimationList = (params: { panelId?: number; statusId?: string }) => {
    const { panelId, statusId } = params;
    if (panelId && statusId) {
      return animationList.value.filter((item) => item.panelId === panelId && item.statusId === statusId);
    }
    return animationList.value.filter((item) => !item.panelId && !item.statusId);
  };

  /**
   * 获取当前激活动画列表
   */
  const getCurrentActiveAnimationList = (params: { panelId?: number; statusId?: string }) => {
    const { panelId, statusId } = params;
    if (panelId && statusId) {
      return activeAnimationList.value.filter((item) => item.panelId === panelId && item.statusId === statusId);
    }
    return activeAnimationList.value.filter((item) => !item.panelId && !item.statusId);
  };

  /**
   * 根据类型获取动画
   */
  const getAnimationByType = (params: { type: "load" | "unload"; panelId?: number; statusId?: string }) => {
    const { type, panelId, statusId } = params;
    let unLoadAnimation: AnimationItem | null = null;

    // 整合查找 unLoadAnimationInfo 和 unLoadAnimation
    for (const item of activeAnimationList.value) {
      if (item.panelId === panelId && item.statusId === statusId && item.type === type) {
        unLoadAnimation = animationList.value.find((anim) => anim.id === item.animationId) || null;
        if (unLoadAnimation) {
          break; // 找到后退出循环
        }
      }
    }

    return unLoadAnimation;
  };

  /**
   * 像素转毫秒
   */
  const pixelToMilliseconds = (pixel: number): number => {
    return (pixel / stepDistance.value) * step.value;
  };

  /**
   * 获取选中的动画
   */
  const getSelectedAnimation = (params: { panelId?: number; statusId?: string }) => {
    const { panelId, statusId } = params;
    let targetAnimationList: AnimationItem[] = [];

    if (panelId && statusId) {
      targetAnimationList = animationList.value.filter(
        (item) => item.panelId === panelId && item.statusId === statusId
      );
    } else {
      targetAnimationList = animationList.value.filter((item) => !item.panelId && !item.statusId);
    }

    return targetAnimationList.find((item) => item.id === selectId.value);
  };

  // ==================== 基础状态变更方法 ====================

  /** 设置编辑器高度 */
  const setEditorHeight = (height: number) => {
    editorHeight.value = height;
  };

  /** 设置步长距离 */
  const setStepDistance = (distance: number) => {
    stepDistance.value = distance;
  };

  /** 设置可见宽度 */
  const setVisibleWidth = (width: number) => {
    visibleWidth.value = width;
  };

  /** 设置步长 */
  const setStep = (newStep: number) => {
    step.value = newStep;
  };

  /** 时间轴滚动 */
  const onTimeLineScroll = (scrollLeft: number) => {
    timeLineScrollLeft.value = scrollLeft;
  };

  /** 改变播放状态 */
  const changePlay = (play: boolean) => {
    isPlay.value = play;
  };

  /** 更新动画列表 */
  const onAnimationListUpdate = (payload: { animationList: AnimationItem[] }) => {
    updateAnimationListState(() => payload.animationList);
  };

  /** 更新激活动画列表 */
  const onActiveAnimationListUpdate = (payload: { activeAnimationList: ActiveAnimationList }) => {
    activeAnimationList.value = payload.activeAnimationList;
  };

  /** 更新动画 */
  const updateAnimation = (payload: { id: string; animation: AnimationItem }) => {
    const { id, animation } = payload;
    updateAnimationListState((draft) => {
      const index = draft.findIndex((v) => v.id === id);
      if (index !== -1) {
        draft[index] = animation;
      }
    });
  };

  /** 改变进度时间 */
  const changeProgressTime = (time: number) => {
    progressTime.value = time;
  };

  /** 设置显示自定义动画编辑器状态 */
  const setShowCustomAnimation = (show: boolean) => {
    showCustomAnimation.value = show;
  };

  /** 设置选中ID */
  const setSelectId = (id: string) => {
    selectId.value = id;
  };

  /** 设置进度动画运行状态 */
  const setProgressRunning = (running: boolean) => {
    isProgressRunning.value = running;
  };

  /** 设置最大进度时间 */
  const setMaxProgressTime = (time: number) => {
    maxProgressTime.value = time;
  };

  /** 重置时间轴滚动位置 */
  const resetTimeLineScrollLeft = () => {
    timeLineScrollLeft.value = 0;
  };

  /** 重置编辑器高度 */
  const resetEditorHeight = () => {
    editorHeight.value = 260;
  };

  const resetCustomAnimationOnPanelChange = () => {
    showCustomAnimation.value = false;
    isPlay.value = false;
    history.undoList = [];
    history.redoList = [];
  };

  const resetCustomAnimation = () => {
    animationList.value = [];
    activeAnimationList.value = [];
    selectId.value = "";
    showCustomAnimation.value = false;
    isPlay.value = false;
    progressTime.value = 0;
    timeLineScrollLeft.value = 0;
    maxTime.value = 100000;
    step.value = 500;
    stepDistance.value = 50;
    visibleWidth.value = 0;
    editorHeight.value = 288;
    isProgressRunning.value = false;
    maxProgressTime.value = 0;
  };

  // ==================== 返回所有方法和状态 ====================

  return {
    // 状态
    animationList,
    selectId,
    showCustomAnimation,
    isPlay,
    progressTime,
    activeAnimationList,
    timeLineScrollLeft,
    maxTime,
    step,
    stepDistance,
    visibleWidth,
    editorHeight,
    isProgressRunning,
    maxProgressTime,
    history,
    canUndo,
    canRedo,

    // 计算属性
    getTotalTimeLineWidth,

    panelIdAndStatusIdToAnimationMap,

    // 工具函数
    getCurrentAnimationList,
    getCurrentActiveAnimationList,
    getAnimationByType,
    pixelToMilliseconds,
    getSelectedAnimation,

    // 基础状态变更方法
    setEditorHeight,
    setStepDistance,
    setVisibleWidth,
    setStep,
    onTimeLineScroll,
    changePlay,
    onAnimationListUpdate,
    onActiveAnimationListUpdate,
    updateAnimation,
    changeProgressTime,
    setShowCustomAnimation,
    setSelectId,
    setProgressRunning,
    setMaxProgressTime,
    resetTimeLineScrollLeft,
    resetEditorHeight,
    resetCustomAnimation,
    resetCustomAnimationOnPanelChange,
    // 内部状态更新方法（供操作层使用）
    updateAnimationListState
  };
});

/**
 * 自定义动画数据层 hooks 类型定义
 */
export type UseCustomAnimationDataReturn = ReturnType<typeof useCustomAnimationData>;
