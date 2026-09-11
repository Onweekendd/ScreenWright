<template>
  <div class="full-screen-switch" :style="contentStyle">
    <div class="content-box" @click.stop="handleClick">
      <img v-if="isFullScreen" style="width: 100%; height: 100%" :src="fullScreenImg" alt="" />
      <img v-else style="width: 100%; height: 100%" :src="unFullScreenImg" alt="" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";

import { useScreenSwitch } from "./useScreenSwitch";

const props = defineProps<{
  element: ComponentType;
}>();

const { contentStyle, unFullScreenImg, fullScreenImg, isFullScreen, handleClick } = useScreenSwitch(props.element);
</script>
<style lang="scss" scoped>
.full-screen-switch {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  .content-box {
    width: 100%;
    height: 100%;
  }
}
</style>
