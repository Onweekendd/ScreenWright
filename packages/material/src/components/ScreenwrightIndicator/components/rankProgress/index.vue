<template>
  <div
    class="custom_bar_list"
    :style="[barListStyle, styleSizeName]"
    ref="rankProgressRef"
    @mouseover="handleStopScroll"
    @mouseleave="scrollCollection"
  >
    <bar-progress
      v-for="(item, i) in inputData"
      :key="item"
      :index="i"
      :max="maxVal"
      :name="item.name"
      :value="item.value"
      :option="option"
      :data-length="inputData.length"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import barProgress from "./barProgress.vue";

const props = defineProps<{
  element: ComponentType;
}>();

const { option, styleSizeName, dataChart: inputData } = useBaseData(props.element);
const rankProgressRef = ref<HTMLElement | null>(null);
const speedCount = ref(0);
const requestAnimation = ref<number | null>(null);

const barListStyle = computed(() => {
  const baseStyle = {
    height: "100%",
    width: "100%",
    position: "relative" as const
  };

  // 根据滚动类型设置不同的overflow
  if (option.value?.bar?.isScroll) {
    if (option.value.bar.scrollType === "bar") {
      return {
        ...baseStyle,
        overflow: "auto" as const
      };
    } else if (option.value.bar.scrollType === "auto") {
      return {
        ...baseStyle,
        overflow: "hidden" as const
      };
    }
  }

  return {
    ...baseStyle,
    overflow: "hidden" as const
  };
});

const maxVal = computed(() => {
  const max = Math.max(...inputData.value.map((item: any) => item.value));
  return max + max * 0.1;
});

const handleStopScroll = () => {
  if (option.value?.bar?.isScroll && option.value?.bar?.scrollType === "auto") {
    if (requestAnimation.value) {
      cancelAnimationFrame(requestAnimation.value);
      requestAnimation.value = null;
    }
  }
};

const scrollCollection = () => {
  if (!option.value?.bar?.isScroll) return;
  // 只有auto模式才执行自动滚动
  if (option.value?.bar?.scrollType !== "auto") return;

  const rankProgress = rankProgressRef.value;
  if (!rankProgress) {
    return;
  }

  // 检查容器是否有足够的内容来滚动
  if (rankProgress.scrollHeight <= rankProgress.clientHeight) {
    return;
  }

  // 清除之前的动画
  if (requestAnimation.value) {
    cancelAnimationFrame(requestAnimation.value);
  }

  let startTime: number | null = null;
  const interval = 0.6;

  function loop(timestamp: number) {
    if (!startTime) {
      startTime = timestamp;
    }
    if (rankProgress !== null) {
      rankProgress.scrollTop = speedCount.value += interval;
      speedCount.value = speedCount.value >= rankProgress.scrollHeight / 2 ? -20 : speedCount.value;
      startTime = timestamp;
      requestAnimation.value = requestAnimationFrame(loop);
    }
  }

  requestAnimation.value = requestAnimationFrame(loop);
};

watch(
  () => inputData.value,
  () => {
    if (requestAnimation.value) {
      cancelAnimationFrame(requestAnimation.value);
      requestAnimation.value = null;
    }
    nextTick(() => {
      scrollCollection();
    });
  },
  { deep: true }
);

watch(
  () => option.value,
  () => {
    if (requestAnimation.value) {
      cancelAnimationFrame(requestAnimation.value);
      requestAnimation.value = null;
    }
    nextTick(() => {
      scrollCollection();
    });
  },
  {
    deep: true
  }
);

onMounted(() => {
  setTimeout(() => {
    scrollCollection();
  }, 1000);
});

onBeforeUnmount(() => {
  if (requestAnimation.value) {
    cancelAnimationFrame(requestAnimation.value);
  }
});
</script>

<style lang="scss" scoped>
.custom_bar_list {
  position: absolute;
  z-index: 999;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;

  // 隐藏滚动条
  // &::-webkit-scrollbar {
  //   width: 0;
  //   height: 0;
  // }

  // 确保子元素能够正确显示
  > * {
    box-sizing: border-box;
  }
}
</style>
