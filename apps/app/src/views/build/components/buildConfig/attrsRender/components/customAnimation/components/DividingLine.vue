<template>
  <div class="dividing-line-container" v-if="currentAnimation">
    <div class="dividing-line" v-for="item in currentAnimation.componentSetting" :key="item.id" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { AnimationItem } from "../type";
import { useCustomAnimation } from "../useCustomAnimation";

// Props定义
const props = defineProps<{
  panelId?: number;
  activeStatusId?: string;
}>();

// 使用hooks
const { selectId, getCurrentAnimationList } = useCustomAnimation();

// 计算属性
const animationList = computed((): AnimationItem[] => {
  return getCurrentAnimationList({
    panelId: props.panelId,
    statusId: props.activeStatusId
  });
});

const currentAnimation = computed((): AnimationItem | undefined => {
  return animationList.value.find((v) => v.id === selectId.value);
});
</script>

<style lang="scss" scoped>
.dividing-line-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;

  display: flex;
  flex-direction: column;

  pointer-events: none;

  .dividing-line {
    flex-shrink: 0;
    width: 100%;
    height: 36px;
    box-sizing: border-box;
    border-bottom: 1px solid rgba(13, 7, 7, 0.6);
  }
}
</style>
