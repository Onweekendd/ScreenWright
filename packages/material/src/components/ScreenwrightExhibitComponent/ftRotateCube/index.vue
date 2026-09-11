<template>
  <div class="cube-main">
    <div
      class="cube-container"
      :style="perspectiveStyle"
      @mousedown.capture="startDrag"
      @touchstart.capture="startDrag"
    >
      <div class="cube" ref="cubeRef" :style="cubeStyle">
        <div
          v-for="(item, index) in faceImages"
          :key="item.title"
          class="cube-face-image"
          :style="{
            ...faceStyle(index + 1),
            ...cubeFaceBorderLight
          }"
        >
          <img :src="setMinioUrl(item.src)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import { useRotateCube } from "./useRotateCube";

interface Props {
  element: ComponentType;
}
const props = defineProps<Props>();
const {
  option,
  width,
  height,
  cubeWidth,
  cubeHeight,
  cubeStyle,
  faceImages,
  animationId,
  perspectiveStyle,
  cubeFaceBorderLight,
  initRotate,
  faceStyle,
  startDrag,
  onDrag,
  stopDrag
} = useRotateCube(props.element);

const cubeRef = ref<HTMLDivElement | null>(null);
const resizeObserver = ref<ResizeObserver | null>(null);

const updateCubeDimensions = () => {
  if (cubeRef.value) {
    cubeWidth.value = cubeRef.value.offsetWidth;
    cubeHeight.value = cubeRef.value.offsetHeight;
  }
};

const destroyAll = () => {
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchmove", onDrag);
  document.removeEventListener("touchend", stopDrag);

  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
    resizeObserver.value = null;
  }

  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
  }
};
const initAll = () => {
  initRotate();
  nextTick(() => {
    updateCubeDimensions();
    resizeObserver.value = new ResizeObserver(updateCubeDimensions);
    if (cubeRef.value) {
      resizeObserver.value.observe(cubeRef.value as HTMLDivElement);
    }
  });
};

// 生命周期钩子
onMounted(() => {
  initAll();
});

onBeforeUnmount(() => {
  destroyAll();
});

watch(
  () => option.value,
  () => {
    destroyAll();
    initAll();
  },
  { deep: true }
);

watch(
  () => width.value,
  () => {
    destroyAll();
    initAll();
  },
  { deep: true }
);
watch(
  () => height.value,
  () => {
    destroyAll();
    initAll();
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
// 变量定义
$border-color: #e70;

.cube-main {
  width: 100%;
  height: 100%;
  position: relative;

  .cube-cover {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
    background-color: transparent;

    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }

  // 立方体容器
  .cube-container {
    position: relative;
    width: 100%;
    height: 100%;

    // 立方体
    .cube {
      position: absolute;
      width: 100%;
      height: 100%;
      transform-style: preserve-3d;
      perspective-origin: center center; /* 默认值 */
      transition: transform 0.1s cubic-bezier(0.32, 0.05, 0.35, 1.6);
    }

    // 立方体面的图片
    .cube-face-image {
      display: block;
      position: absolute;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }
}
</style>
