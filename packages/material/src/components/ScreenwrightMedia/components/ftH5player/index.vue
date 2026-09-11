<template>
  <div :class="containerClasses" ref="h5playerRef">
    <div class="video-box" :id="playerId" v-loading="videoLoading" element-loading-background="rgba(0, 0, 0, 0.1)" />
  </div>
</template>

<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";

import { useFtH5player } from "./useFtH5player";

const props = defineProps<{
  element: ComponentType;
}>();

defineOptions({
  name: "ftH5player"
});

// 使用自定义hook
const { h5playerRef, videoLoading, playerId, containerClasses } = useFtH5player(props.element);
</script>

<style lang="scss" scoped>
.ft-h5player {
  width: 100% !important;
  height: 100% !important;

  .video-box {
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
