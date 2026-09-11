<template>
  <div
    class="time-tag"
    :class="{ disabled: isPlay }"
    :style="{
      width: `${getTimeTagWidth(componentSetting)}px`,
      transform: `translateX(${getTimeTagTranslateX(componentSetting)}px)`
    }"
    @mousedown="!isPlay && onMousedown($event, 'timeLine')"
  >
    <div
      class="right-drag-point"
      :class="{ disabled: isPlay }"
      :style="{ cursor: isPlay ? 'not-allowed' : isDragging ? 'ew-resize' : 'pointer' }"
      @mousedown="!isPlay && onMousedown($event, 'right')"
    />
    <div
      class="left-drag-point"
      :class="{ disabled: isPlay }"
      :style="{ cursor: isPlay ? 'not-allowed' : isDragging ? 'ew-resize' : 'pointer' }"
      @mousedown="!isPlay && onMousedown($event, 'left')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import type { ComponentSettingItem } from "../type";
import { useCustomAnimation } from "../useCustomAnimation";

// Props定义
const props = defineProps<{
  item: ComponentSettingItem;
}>();

// 使用hooks
const { step, stepDistance, onAnimationPropertyChange, onUpdateMultipleProperty, isPlay } = useCustomAnimation();

// 本地状态
const isDragging = ref<boolean>(false);
const startX = ref<number>(0);
const currentX = ref<number>(0);
const startDelay = ref<number>(0);
const startDuration = ref<number>(0);
const currentDelay = ref<number>(0);
const currentDuration = ref<number>(0);
const controlPoint = ref<"left" | "right" | "timeLine">("timeLine");

// 计算属性
const componentSetting = computed((): ComponentSettingItem => {
  return props.item;
});

// 像素转毫秒
const pixelToMilliseconds = (pixel: number): number => {
  return (pixel / stepDistance.value) * step.value;
};

// 方法
/**
 * 拖拽点按下事件
 */
const onMousedown = (e: MouseEvent, target: "left" | "right" | "timeLine") => {
  // 如果动画正在播放，阻止拖拽操作
  if (isPlay.value) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  isDragging.value = true;
  startX.value = e.screenX;
  currentX.value = e.screenX;

  startDelay.value = componentSetting.value.delay;
  startDuration.value = componentSetting.value.duration;

  controlPoint.value = target;

  if (controlPoint.value === "left" || controlPoint.value === "right") {
    document.body.style.cursor = "ew-resize";
  }

  document.addEventListener("mousemove", onGlobalMouseMove);
  document.addEventListener("mouseup", onGlobalMouseup);
};

/**
 * 全局鼠标移动事件
 */
const onGlobalMouseMove = (e: MouseEvent) => {
  e.preventDefault();
  currentX.value = e.screenX;

  const changeTime = pixelToMilliseconds(currentX.value - startX.value);

  if (controlPoint.value === "left") {
    onLeftControlPointMouseMove(changeTime);
  } else if (controlPoint.value === "right") {
    onRightControlPointMouseMove(changeTime);
  } else if (controlPoint.value === "timeLine") {
    onTimeLineMouseMove(changeTime);
  }
};

/**
 * 右侧控制点移动事件
 */
const onRightControlPointMouseMove = (changeTime: number) => {
  const duration = Math.round((startDuration.value + changeTime) / 100) * 100;

  if (duration === currentDuration.value) return;

  if (duration / 1000 < 0) {
    onAnimationPropertyChange({
      componentSettingItem: componentSetting.value,
      property: "duration",
      value: 0
    });
    currentDuration.value = 0;
    return;
  }

  onAnimationPropertyChange({
    componentSettingItem: componentSetting.value,
    property: "duration",
    value: duration
  });

  currentDuration.value = duration;
};

/**
 * 左侧控制点移动事件
 */
const onLeftControlPointMouseMove = (changeTime: number) => {
  const delay = Math.round((startDelay.value + changeTime) / 100) * 100;
  const duration = Math.round((startDuration.value - changeTime) / 100) * 100;

  if (delay === currentDelay.value && duration === currentDuration.value) return;

  if (duration / 1000 < 0) {
    onAnimationPropertyChange({
      componentSettingItem: componentSetting.value,
      property: "duration",
      value: 0
    });
    currentDuration.value = 0;
    return;
  }

  if (delay / 1000 < 0) {
    onAnimationPropertyChange({
      componentSettingItem: componentSetting.value,
      property: "delay",
      value: 0
    });
    currentDelay.value = 0;
    return;
  }

  onUpdateMultipleProperty({
    changeProperty: { delay, duration },
    componentSettingItem: componentSetting.value
  });

  currentDelay.value = delay;
  currentDuration.value = duration;
};

/**
 * 时间轴移动事件
 */
const onTimeLineMouseMove = (changeTime: number) => {
  const delay = Math.round((startDelay.value + changeTime) / 100) * 100;

  if (delay === currentDelay.value) return;

  if (delay / 1000 < 0) {
    onAnimationPropertyChange({
      componentSettingItem: componentSetting.value,
      property: "delay",
      value: 0
    });
    currentDelay.value = 0;
    return;
  }

  onAnimationPropertyChange({
    componentSettingItem: componentSetting.value,
    property: "delay",
    value: delay
  });

  currentDelay.value = delay;
};

/**
 * 全局鼠标释放事件
 */
const onGlobalMouseup = (e: MouseEvent) => {
  e.preventDefault();

  isDragging.value = false;
  currentX.value = 0;
  startX.value = 0;

  document.body.style.cursor = "";

  document.removeEventListener("mousemove", onGlobalMouseMove);
  document.removeEventListener("mouseup", onGlobalMouseup);
};

/**
 * 计算时间刻度的偏移量
 */
const getTimeTagTranslateX = (item: ComponentSettingItem): number => {
  let translateX = stepDistance.value / 2;
  const { delay } = item;
  if (delay > 0) {
    const num = delay / step.value;
    translateX += num * stepDistance.value;
  }
  return translateX;
};

/**
 * 计算时间柱的宽度
 */
const getTimeTagWidth = (item: ComponentSettingItem): number => {
  let width = 0;
  const { duration } = item;
  if (duration > 0) {
    const num = duration / step.value;
    width = num * stepDistance.value;
  }
  return width;
};
</script>

<style lang="scss" scoped>
.time-tag {
  height: 30%;
  flex-shrink: 0;
  background-image: linear-gradient(180deg, #8b58e7, #642cff);
  position: relative;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
    background-image: linear-gradient(180deg, #666, #444);
  }
  .left-drag-point {
    position: absolute;
    z-index: 10;
    border-radius: 100%;
    background-color: #fff;
    left: 0;
    top: 50%;
    transform: translate(-50%, -50%);
    height: 100%;
    aspect-ratio: 1 / 1;

    &:hover:not(.disabled) {
      background-color: #d1d1d1;
    }

    &.disabled {
      background-color: #999;
      opacity: 0.6;
    }
  }
  .right-drag-point {
    position: absolute;
    border-radius: 100%;
    z-index: 100;
    background-color: #fff;
    right: 0;
    top: 50%;
    transform: translate(50%, -50%);
    height: 100%;
    aspect-ratio: 1 / 1;

    &:hover:not(.disabled) {
      background-color: #d1d1d1;
    }

    &.disabled {
      background-color: #999;
      opacity: 0.6;
    }
  }
}
</style>
