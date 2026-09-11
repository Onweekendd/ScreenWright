<template>
  <div class="custom-scrollbar-container" ref="scrollbar">
    <div
      class="custom-scrollbar"
      :style="{ width: `${scrollbarWidth}px`, transform: `translateX(${timeScrollLeft / ratio}px)` }"
      @mousedown="onMouseDown"
      v-show="scrollbarInitWidth < totalWidth"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { useCustomAnimation } from "../useCustomAnimation";

// 使用hooks
const { getTotalTimeLineWidth, visibleWidth, timeLineScrollLeft, onTimeLineScroll } = useCustomAnimation();

// 模板引用
const scrollbar = ref<HTMLElement>();

// 本地状态
const startX = ref<number>(0);
const currentX = ref<number>(0);
const startTranslateX = ref<number>(0);
const scrollbarInitWidth = ref<number>(0);
const scrollbarWidth = ref<number>(0);

// 计算属性
const totalWidth = computed((): number => {
  return getTotalTimeLineWidth.value;
});

const timeScrollLeft = computed((): number => {
  return timeLineScrollLeft.value;
});

/**
 * 最大滚动距离
 */
const maxScrollDistance = computed((): number => {
  return scrollbarInitWidth.value - Math.round(Math.pow(visibleWidth.value, 2) / totalWidth.value);
});

/**
 * 滚动比例 滚动条 1px -> 控制元素 1px * ratio
 */
const ratio = computed((): number => {
  if (maxScrollDistance.value <= 0) return 1;
  return (totalWidth.value - visibleWidth.value) / maxScrollDistance.value;
});

// 生命周期
onMounted(() => {
  const scrollbarEl = scrollbar.value;
  if (!scrollbarEl) return;

  const style = window.getComputedStyle(scrollbarEl);
  const paddingWidth = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);

  scrollbarInitWidth.value = scrollbarEl.clientWidth - paddingWidth;
  scrollbarWidth.value = Number(((scrollbarInitWidth.value * visibleWidth.value) / totalWidth.value).toFixed(2));
});

// 监听器
watch(totalWidth, (newVal) => {
  scrollbarWidth.value = Number(((scrollbarInitWidth.value * visibleWidth.value) / newVal).toFixed(2));
});

// 方法
/**
 * 鼠标按下事件
 */
const onMouseDown = (e: MouseEvent) => {
  e.stopPropagation();
  e.preventDefault();

  startX.value = e.clientX;
  currentX.value = e.clientX;
  startTranslateX.value = timeScrollLeft.value / ratio.value;

  document.addEventListener("mousemove", onGlobalMouseMove);
  document.addEventListener("mouseup", onGlobalMouseUp);
};

/**
 * 全局鼠标移动事件
 */
const onGlobalMouseMove = (e: MouseEvent) => {
  e.stopPropagation();
  e.preventDefault();

  currentX.value = e.clientX;
  const distance = currentX.value - startX.value;
  let translateX = startTranslateX.value + distance;

  if (typeof translateX !== "number" || isNaN(translateX)) {
    translateX = 0;
  }

  translateX = Math.max(0, translateX);
  translateX = Math.min(translateX, scrollbarInitWidth.value - scrollbarWidth.value);

  onTimeLineScroll(translateX * ratio.value);
};

/**
 * 全局鼠标释放事件
 */
const onGlobalMouseUp = (e: MouseEvent) => {
  e.stopPropagation();
  e.preventDefault();

  document.removeEventListener("mousemove", onGlobalMouseMove);
  document.removeEventListener("mouseup", onGlobalMouseUp);
};
</script>

<style lang="scss" scoped>
.custom-scrollbar-container {
  width: 30%;
  height: 10px;
  position: fixed;
  bottom: 3px;
  box-sizing: border-box;

  padding: 0 10px;

  display: flex;
  align-items: center;

  z-index: 9999;
  .custom-scrollbar {
    height: 100%;
    background-color: rgb(80, 82, 94);
    border-radius: 8px;
  }
}
</style>
