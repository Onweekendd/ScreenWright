import { computed, nextTick } from "vue";

import { ElMessage, ElMessageBox } from "element-plus";

import { emitEvent } from "@/utils/onmitt";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { configOptions } from "../interactiveConfig/options";
import type {
  AnimationDirection,
  AnimationItem,
  AnimationType,
  ComponentSettingItem,
  TimingFunctionType
} from "./type";
import { useCustomAnimation } from "./useCustomAnimation";
import { animation2Direction, delayEnable, directionEnable, durationEnable, timingFunctionEnable } from "./util";

// 配置选项类型定义
interface ConfigOption {
  label: string;
  value: AnimationDirection;
}

/**
 * 动画编辑器业务逻辑hooks
 */
export const useAnimationEditor = () => {
  // 使用相关hooks
  const {
    getCurrentAnimationList,
    selectId,
    isPlay,
    maxTime,
    progressTime,
    onAnimationPropertyChange,
    onUpdateMultipleProperty,
    onComponentDelete
  } = useCustomAnimation();

  const { allComponentMap } = useGlobalComponentData();

  // 缓存动画方向选项，避免每次渲染都重新计算
  const directionOptionsCache = new Map<string, ConfigOption[]>();

  const animationPlaying = computed(() => isPlay.value);

  const animationList = ({ panelId, activeStatusId }: { panelId?: number; activeStatusId?: string }) => {
    return getCurrentAnimationList({
      panelId: panelId,
      statusId: activeStatusId
    });
  };

  const selectAnimation = ({
    panelId,
    activeStatusId
  }: {
    panelId?: number;
    activeStatusId?: string;
  }): AnimationItem | undefined => {
    return animationList({ panelId, activeStatusId }).find((v) => v.id === selectId.value);
  };

  const getNoneAnimationType = computed(() => {
    return configOptions("animationType").find((z) => z.value === "none");
  });

  const getLoadAnimationType = computed(() => {
    return configOptions("animationType")
      .filter((z) => z.value !== "none")
      .map((animationType) => ({
        ...animationType,
        type: "load"
      }));
  });

  const getUnloadAnimationType = computed(() => {
    return configOptions("animationOutType")
      .filter((z) => z.value !== "none")
      .map((animationType) => ({
        ...animationType,
        type: "unload"
      }));
  });

  // 事件处理方法
  const onAnimationDelete = async (e: MouseEvent, itemId: number) => {
    e.preventDefault();
    const componentName = getComponentName(itemId);
    if (!componentName) {
      return;
    }

    try {
      await ElMessageBox.confirm(`是否删除组件：${componentName}?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        customClass: "sw-message-box"
      });

      onDeleteComponentFromAnimation(itemId);
    } catch {
      // 用户取消删除，不需要处理
    }
  };

  /**
   * 获取组件名称
   */
  const getComponentName = (componentId: number): string | null => {
    const component = allComponentMap.value.get(componentId.toString());
    if (!component) {
      return null;
    }
    return component.name;
  };

  /**
   * 动画类型变更处理
   */
  const onAnimationTypeChange = async (animationType: AnimationType, componentSettingItem: ComponentSettingItem) => {
    // 防止递归更新：如果值没有变化则不执行更新
    if (componentSettingItem.animationType === animationType) {
      return;
    }

    if (animationType === "none") {
      const direction = "none" as AnimationDirection;
      const timingFunction = "none" as TimingFunctionType;
      const duration = 0;
      const delay = progressTime.value;

      await onUpdateMultipleProperty({
        changeProperty: {
          animationType: animationType,
          direction,
          timingFunction,
          duration,
          delay,
          type: "none"
        },
        componentSettingItem
      });
    } else {
      const direction: AnimationDirection = directionEnable(animationType)
        ? (animation2DirectionOption(animationType)[0].value as AnimationDirection)
        : "";

      const timingFunction =
        componentSettingItem.timingFunction !== "none"
          ? componentSettingItem.timingFunction
          : (configOptions("timingFunction")[1]?.value as TimingFunctionType) || ("none" as TimingFunctionType);

      let type: "load" | "unload" = "load";
      const loadAnimations = configOptions("animationType").filter((z) => z.value !== "none");
      if (loadAnimations.findIndex((v) => v.value === animationType) === -1) {
        type = "unload";
      }

      await onUpdateMultipleProperty({
        changeProperty: {
          animationType: animationType,
          direction,
          timingFunction,
          type
        },
        componentSettingItem
      });
    }
  };

  /**
   * 时间函数变更处理
   */
  const onTimingFunctionChange = (timingFunction: string, componentSettingItem: ComponentSettingItem) => {
    // 防止递归更新：如果值没有变化则不执行更新
    if (componentSettingItem.timingFunction === timingFunction) {
      return;
    }

    onAnimationPropertyChange({
      property: "timingFunction",
      value: timingFunction as TimingFunctionType,
      componentSettingItem
    });
  };

  /**
   * 动画方向变更处理
   */
  const onAnimationDirectionChange = (animationDirection: string, componentSettingItem: ComponentSettingItem) => {
    // 防止递归更新：如果值没有变化则不执行更新
    if (componentSettingItem.direction === animationDirection) {
      return;
    }

    onAnimationPropertyChange({
      property: "direction",
      value: animationDirection as AnimationDirection,
      componentSettingItem
    });
  };

  /**
   * 动画开始时间变更处理
   */
  const onAnimationBeginTimeChange = (beginTime: number | undefined, componentSettingItem: ComponentSettingItem) => {
    if (beginTime === undefined || beginTime === null || isNaN(beginTime)) {
      ElMessage.error("时间不能为空");
      return;
    }

    if (beginTime < 0) {
      ElMessage.error("时间不能小于0");
      return;
    }

    const newDelayValue = beginTime * 1000;
    // 防止递归更新：如果值没有变化则不执行更新
    if (componentSettingItem.delay === newDelayValue) {
      return;
    }

    onAnimationPropertyChange({
      property: "delay",
      value: newDelayValue,
      componentSettingItem
    });
  };

  /**
   * 动画持续时间变更处理
   */
  const onAnimationDurationChange = (duration: number | undefined, componentSettingItem: ComponentSettingItem) => {
    if (duration === undefined || duration === null || isNaN(duration)) {
      ElMessage.error("持续时间不能为空");
      return;
    }

    if (duration < 0) {
      ElMessage.error("持续时间不能小于0");
      return;
    }

    const newDurationValue = duration * 1000;
    // 防止递归更新：如果值没有变化则不执行更新
    if (componentSettingItem.duration === newDurationValue) {
      return;
    }

    onAnimationPropertyChange({
      property: "duration",
      value: newDurationValue,
      componentSettingItem
    });
  };

  /**
   * 数字输入框失焦处理
   */
  const onNumberInputBlur = (e: Event, componentSettingItem: ComponentSettingItem, type: "delay" | "duration") => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const value = input.value;
    if (value === "" || value === null || value === undefined) {
      const previousValue = (type === "delay" ? componentSettingItem.delay : componentSettingItem.duration) / 1000;

      nextTick(() => {
        input.value = previousValue.toFixed(2);
      });
    }
  };

  /**
   * 数字输入框键盘事件处理 - 阻止空格键清空内容
   */
  const onNumberInputKeydown = (
    e: KeyboardEvent,
    componentSettingItem: ComponentSettingItem,
    type: "delay" | "duration"
  ) => {
    // 当按下空格键时，阻止默认行为并填入默认值
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      const input = e.target;
      if (!(input instanceof HTMLInputElement)) {
        return;
      }

      // 检查是否全选了内容
      const isAllSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      if (isAllSelected) {
        // 清空内容并填入 0.00
        input.value = "0.00";
        // 选中所有内容，方便用户直接输入新值
        input.select();
      }
    }
  };

  /**
   * 从动画中删除组件
   */
  const onDeleteComponentFromAnimation = (componentId: number) => {
    onComponentDelete({ componentId });
    emitEvent(`onStopAnimation-${componentId}`);
  };

  /**
   * 获取动画方向选项
   * 使用缓存避免重复计算
   */
  const animation2DirectionOption = (animationType: AnimationType): ConfigOption[] => {
    // 使用缓存避免重复计算
    // if (directionOptionsCache.has(animationType)) {
    //   return directionOptionsCache.get(animationType)!
    // }

    const directionList = animation2Direction(animationType);

    let options: ConfigOption[];
    if (directionList.length === 0) {
      options = [{ label: "动画无方向", value: "none" }];
    } else {
      const loadAnimations = configOptions("animationType").filter((z) => z.value !== "none");
      if (loadAnimations.findIndex((v) => v.value === animationType) !== -1) {
        options = configOptions("animationPosition").filter((v) => directionList.includes(v.value));
      } else {
        options = configOptions("animationOutPosition").filter((v) => directionList.includes(v.value));
      }
    }

    directionOptionsCache.set(animationType, options);
    return options;
  };

  /**
   * 清除缓存
   */
  const clearCache = () => {
    directionOptionsCache.clear();
  };

  return {
    // 状态
    maxTime,

    // 计算属性工厂
    animationPlaying,
    selectAnimation,
    getNoneAnimationType,
    getLoadAnimationType,
    getUnloadAnimationType,

    // 方法
    onAnimationDelete,
    getComponentName,
    onAnimationTypeChange,
    onTimingFunctionChange,
    onAnimationDirectionChange,
    onAnimationBeginTimeChange,
    onAnimationDurationChange,
    onNumberInputBlur,
    onNumberInputKeydown,
    onDeleteComponentFromAnimation,
    animation2DirectionOption,
    clearCache,

    // 工具函数
    directionEnable,
    timingFunctionEnable,
    durationEnable,
    delayEnable,
    configOptions
  };
};

export type UseAnimationEditorReturn = ReturnType<typeof useAnimationEditor>;
