<template>
  <el-scrollbar
    :always="true"
    class="table-body"
    ref="bodyRef"
    :style="{ height: `${height - option.headerlineHeight}px`, pointerEvents: isAnimateScroll ? 'none' : 'visible' }"
  >
    <ul
      ref="ulBox"
      :style="ulStyle"
      @mouseenter="isHoverScroll = true"
      @mouseleave="isHoverScroll = false"
      :class="{ slideAni: isAnimating }"
    >
      <slot v-for="(item, index) in currentList" :key="item.id" :item="item" :index="index" />
    </ul>
  </el-scrollbar>
</template>

<script setup lang="ts">
import type { ScrollbarInstance } from "element-plus";
import type { CSSProperties } from "vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

interface ScrollYBarStyle {
  trackWidth: string;
  trackBackground: string;
  trackBorderRadius: string;
  thumbWidth: string;
  thumbBackground: string;
  thumbBorderRadius: string;
}

interface Props {
  option: any;
  height: number;
  isAnimateScroll: boolean;
  currentList: Array<{ id: string | number; [key: string]: any }>;
  listData: Array<{ id: string | number; [key: string]: any }>;
  scrollYBarStyle: ScrollYBarStyle;
}

const props = withDefaults(defineProps<Props>(), {
  option: () => ({
    count: 0,
    headerlineHeight: 0,
    scrollTimeType: false,
    scrollSingleTime: 0,
    scrollTime: 0,
    isBuild: false
  }),
  height: 0,
  isAnimateScroll: false,
  currentList: () => [],
  listData: () => [],
  scrollYBarStyle: () => ({
    trackWidth: "6px",
    trackBackground: "#000",
    trackBorderRadius: "3px",
    thumbWidth: "6px",
    thumbBackground: "#409eff",
    thumbBorderRadius: "3px"
  })
});

const bodyRef = ref<ScrollbarInstance>();
const ulBox = ref<HTMLElement>();
const isHoverScroll = ref(false);
const scrollTimer = ref<NodeJS.Timer | null>();
const isAnimating = ref(false);
const heightValue = ref("0");

// 使用计算属性计算需要绑定到样式的变量
const thumbHeight = computed(() => `${(props.option.count / props.currentList.length) * 100}%`);

const animationDuration = computed(() => {
  return `${
    props.option.scrollTimeType ? props.option.scrollSingleTime * props.listData.length : props.option.scrollTime
  }s`;
});

const ulStyle = computed<CSSProperties>(() => ({
  animationDuration: animationDuration.value,
  pointerEvents: props.option.isBuild ? "none" : "visible"
}));
watch(
  () => props.isAnimateScroll,
  () => {
    setInit();
  }
);

const setInit = async () => {
  await nextTick();
  bodyRef.value?.scrollTo(0, 0);
  if (!ulBox.value) return;
  isAnimating.value = props.isAnimateScroll;
  const currentHeight = ulBox.value.offsetHeight;
  if (currentHeight) {
    heightValue.value = `-${currentHeight / 2}px`;
  }
};

onMounted(() => {
  setInit();
});

onBeforeUnmount(() => {
  if (scrollTimer.value) {
    clearInterval(scrollTimer.value);
  }
});

defineExpose({
  setInit,
  $refs: {
    ulBox
  }
});
</script>

<style lang="scss" scoped>
.table-body {
  width: fit-content !important;
  box-sizing: border-box;

  * {
    box-sizing: border-box !important;
  }

  ul {
    padding: 0;
    margin: 0;
  }

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  :deep(.el-scrollbar__bar) {
    width: v-bind("scrollYBarStyle.trackWidth");
    background: v-bind("scrollYBarStyle.trackBackground");
    border-radius: v-bind("scrollYBarStyle.trackBorderRadius");
    right: 0;
    top: 0;

    &.is-horizontal {
      display: none;
    }

    &.is-vertical {
      .el-scrollbar__thumb {
        width: v-bind("scrollYBarStyle.thumbWidth");
        height: v-bind("thumbHeight") !important;
        background-color: v-bind("scrollYBarStyle.thumbBackground");
        border-radius: v-bind("scrollYBarStyle.thumbBorderRadius");
      }
    }
  }
  &:hover {
    .slideAni {
      animation-play-state: paused;
    }
  }
  &:not(:hover) {
    .slideAni {
      animation-play-state: running;
    }
  }
}

.slideAni {
  animation-name: slideAni;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes slideAni {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, v-bind("heightValue"), 0);
  }
}
</style>
