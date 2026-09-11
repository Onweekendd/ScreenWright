<template>
  <div class="simple-star" :style="contentStyle">
    <div class="content-box">
      <div
        v-for="(dotStyleItem, dotStyleIndex) in dotStyleList"
        class="dot-item"
        :key="dotStyleIndex"
        :style="{
          '--animateDelay': `${(dotStyleIndex + 1) * 0.1}s`,
          ...dotStyle,
          ...dotStyleItem
        }"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";

import { useSimpleStar } from "./useSimpleStar";

const props = defineProps<{
  element: ComponentType;
}>();
const { contentStyle, dotStyleList, dotStyle } = useSimpleStar(props.element);
</script>

<style lang="scss" scoped>
@keyframes myAnimation {
  0% {
    opacity: 1;
  }
  70% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.simple-star {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
  pointer-events: none !important;
  .content-box {
    width: 100%;
    height: 100%;
    position: relative;
    .dot-item {
      animation-delay: var(--animateDelay); /* 定义动画开始前的延迟时间 */
      animation-name: myAnimation; /* 定义动画名称 */
      animation-duration: 5s; /* 设置动画执行时间为2秒 */
      animation-iteration-count: infinite; /* 设置动画循环次数为无限 */
    }
  }
}
</style>
