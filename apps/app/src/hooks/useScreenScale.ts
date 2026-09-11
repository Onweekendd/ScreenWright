import type { CSSProperties, Ref } from "vue";
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";

import type { LargeScreenDetailInfo } from "@screenwright/types";

import { AdaptationType } from "@/views/build/components/buildConfig/graphConfig/options";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";

/**
 * 缩放比例计算结果
 */
export interface ScaleRatio {
  /** 窗口内容区域 X 坐标偏移 */
  x: number;
  /** 窗口内容区域 Y 坐标偏移 */
  y: number;
  /** 等比缩放比例 */
  rate: number;
  /** 缩放后的宽度 */
  scaledWidth: number;
  /** 缩放后的高度 */
  scaledHeight: number;
  /** 原始画布宽度 */
  canvasWidth: string;
  /** 原始画布高度 */
  canvasHeight: string;
  /** X 轴缩放比例 */
  scaleX: number;
  /** Y 轴缩放比例 */
  scaleY: number;
}

/**
 * 样式对象类型
 */
export interface WrapperStyle extends CSSProperties {
  width: string;
  height: string;
  transform: string;
  transformOrigin: string;
  left: string;
  top?: string;
}

/**
 * 管理窗口尺寸状态
 * @returns 窗口尺寸响应式对象和更新方法
 */
function useWindowSize() {
  const windowSize = ref({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight
  });

  /**
   * 更新窗口尺寸
   */
  const updateWindowSize = async () => {
    await nextTick();
    windowSize.value = {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight
    };
  };

  /**
   * 注册窗口事件监听
   */
  const registerWindowListeners = () => {
    window.addEventListener("resize", updateWindowSize);
  };

  /**
   * 移除窗口事件监听
   */
  const unregisterWindowListeners = () => {
    window.removeEventListener("resize", updateWindowSize);
  };

  return {
    windowSize,
    updateWindowSize,
    registerWindowListeners,
    unregisterWindowListeners
  };
}

/**
 * 计算缩放比例和尺寸
 * @param containerWidth - 容器宽度
 * @param containerHeight - 容器高度
 * @param canvasWidth - 画布宽度
 * @param canvasHeight - 画布高度
 * @returns 缩放比例信息
 */
export function calculateScaleRatio(
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number
): ScaleRatio {
  // 判断是以宽度还是高度为基准进行缩放
  const isWidthBased = canvasWidth * containerHeight < canvasHeight * containerWidth;

  // 计算等比缩放比例
  const rate = Number(isWidthBased ? containerHeight / canvasHeight : containerWidth / canvasWidth);

  // 计算缩放后的尺寸
  const scaledWidth = isWidthBased ? canvasWidth * rate : containerWidth;
  const scaledHeight = isWidthBased ? containerHeight : canvasHeight * rate;

  // 计算居中偏移量
  const x = isWidthBased ? (containerWidth - scaledWidth) / 2 : 0;
  const y = isWidthBased ? 0 : (containerHeight - scaledHeight) / 2;

  // 计算 X/Y 轴独立缩放比例
  const scaleX = containerWidth / canvasWidth;
  const scaleY = containerHeight / canvasHeight;

  return {
    x,
    y,
    rate,
    scaledWidth,
    scaledHeight,
    canvasWidth: `${canvasWidth}px`,
    canvasHeight: `${canvasHeight}px`,
    scaleX,
    scaleY
  };
}

/**
 * 获取基础样式
 * @param canvasWidth - 画布宽度
 * @param canvasHeight - 画布高度
 * @returns 基础样式对象
 */
export function getBaseStyle(canvasWidth: string, canvasHeight: string) {
  return {
    width: canvasWidth,
    height: canvasHeight
  };
}

/**
 * 获取屏幕比例适配模式的样式
 * @param scaleRatio - 缩放比例信息
 * @param isPanel - 是否为面板
 * @returns 样式对象
 */
export function getScaleAdaptationStyle(scaleRatio: ScaleRatio, isPanel: boolean): WrapperStyle {
  const { rate, canvasWidth: width, canvasHeight: height } = scaleRatio;
  const canvasHeight = parseFloat(height);

  // 计算垂直偏移
  const top = isPanel ? 0 : `${(window.innerHeight - canvasHeight * rate) / 2}px`;

  return {
    ...getBaseStyle(width, height),
    transform: `scale(${rate}) translateX(-50%)`,
    transformOrigin: "left top",
    left: "50%",
    top: `${top}px`
  };
}

/**
 * 获取铺满屏幕模式的样式
 * @description 通过 X/Y 轴不等比缩放填满整个屏幕
 * @param scaleRatio - 缩放比例信息
 * @param scaleX - X 轴缩放比例
 * @param scaleY - Y 轴缩放比例
 * @returns 样式对象
 */
export function getFillStyle(scaleRatio: ScaleRatio, scaleX: number, scaleY: number): WrapperStyle {
  const { canvasWidth, canvasHeight } = scaleRatio;

  return {
    ...getBaseStyle(canvasWidth, canvasHeight),
    transform: `scale(${scaleX}, ${scaleY})`,
    transformOrigin: "left top",
    left: "0",
    top: "0"
  };
}

/**
 * 获取约束布局自适应样式
 */
export function getConstraintStyleConfig(): WrapperStyle {
  return {
    width: "100%",
    height: "100%",
    transform: `scale(${1})`,
    transformOrigin: "left top",
    left: "0",
    top: "0"
  };
}

/**
 * 获取溢出滚动模式的样式
 * @description 不进行缩放，使用原始尺寸，通过 overflow:scroll 滚动查看
 * @param scaleRatio - 缩放比例信息
 * @returns 样式对象
 */
export function getOverflowStyleConfig(scaleRatio: ScaleRatio): WrapperStyle {
  const { canvasWidth, canvasHeight } = scaleRatio;
  const scale = window.innerWidth / parseInt(canvasWidth);
  return {
    width: canvasWidth,
    height: canvasHeight,
    transform: `scale(${scale})`,
    transformOrigin: "left top",
    left: "0",
    top: "0"
  };
}

/**
 * 获取默认模式的样式
 * @param scaleRatio - 缩放比例信息
 * @returns 样式对象
 */
export function getDefaultStyle(scaleRatio: ScaleRatio): WrapperStyle {
  const { rate, canvasWidth, canvasHeight } = scaleRatio;

  return {
    ...getBaseStyle(canvasWidth, canvasHeight),
    transformOrigin: "left top",
    transform: `scale(${rate})`,
    left: "50%"
  };
}

/**
 * 屏幕缩放适配 Hook
 * @description 根据不同的适配模式计算并返回包装器样式
 * @param editConfig - 大屏配置信息
 * @returns 缩放比例和包装器样式
 */
export function useScreenScale(editConfig: Ref<LargeScreenDetailInfo>) {
  const { isPanel } = useEditStore();
  const { windowSize, registerWindowListeners, unregisterWindowListeners } = useWindowSize();

  /**
   * 计算缩放比例信息
   */
  const outerRect = computed(() => {
    const { innerWidth, innerHeight } = windowSize.value;
    const canvasWidth = Number(editConfig.value.width);
    const canvasHeight = Number(editConfig.value.height);

    return calculateScaleRatio(innerWidth, innerHeight, canvasWidth, canvasHeight);
  });

  /**
   * 计算包装器样式
   * @description 根据适配类型和全屏状态生成对应的样式
   */
  const wrapperStyle = computed(() => {
    const scaleRatio = outerRect.value;
    const adaptationType = editConfig.value.adaptationType;

    // 根据适配类型返回不同的样式策略
    switch (adaptationType) {
      case AdaptationType.scale:
        return getScaleAdaptationStyle(scaleRatio, isPanel());

      case AdaptationType.constraint:
        return getConstraintStyleConfig();

      case AdaptationType.fill:
        return getFillStyle(scaleRatio, scaleRatio.scaleX, scaleRatio.scaleY);

      case AdaptationType.overflow: {
        console.log(scaleRatio, "scaleRatio");
        // const width = editConfig.value.width;
        // const height = editConfig.value.height;
        // const scale = window.innerWidth / Number(width);
        return getOverflowStyleConfig(scaleRatio);
      }
      // let scaleRatio =

      default:
        return getDefaultStyle(scaleRatio);
    }
  });
  // 注册生命周期钩子
  onMounted(() => {
    registerWindowListeners();
  });

  onUnmounted(() => {
    unregisterWindowListeners();
  });

  return {
    outerRect,
    wrapperStyle
  };
}
