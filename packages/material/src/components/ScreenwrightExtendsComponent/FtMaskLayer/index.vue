<template>
  <div
    class="ft-mask-layer"
    :style="{
      ...maskLayerStyle,
      ...getFrostedStyle
    }"
  >
    <div class="content-box" :style="getMarkStyle" />
  </div>
</template>

<script setup lang="ts">
import { useFrostedStyle } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import { useMaskLayer } from "./useMaskLayer";

const props = defineProps<{
  element: ComponentType;
}>();
const { getFrostedStyle } = useFrostedStyle(props.element);
const { maskLayerStyle, getMarkStyle } = useMaskLayer(props.element);
</script>

<style lang="scss" scoped>
.ft-mask-layer {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  // z-index: 71;
  .content-box {
    width: 100%;
    height: 100%;
  }
}
</style>
