<template>
  <div class="ft-nine-patch" :style="getStyle" />
</template>

<script lang="ts" setup>
import { computed, reactive } from "vue";

import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

interface Props {
  element: ComponentType;
}
const props = defineProps<Props>();

const PARAMS = reactive({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 200,
  height: 200
});

const getStyle = computed(() => {
  const { top, right, bottom, left, src } = props.element.option;
  Object.assign(PARAMS, {
    top,
    right,
    bottom,
    left,
    width: props.element.component.width,
    height: props.element.component.height
  });
  return {
    width: `${props.element.component.width}px`,
    height: `${props.element.component.height}px`,
    "border-image-source": `url(${setMinioUrl(src)})`,
    "border-image-slice": `${top}% ${right}% ${bottom}% ${left}% fill`
    // "border-width": `${Math.max(top, right, bottom, left)}px`
  };
});
</script>

<style scoped>
.ft-nine-patch {
  border-image-repeat: stretch;
  border-image-width: auto;
  border-image-outset: 1px;
  box-sizing: border-box;
  position: relative;
  box-shadow: inset 0 0 1px rgba(0, 0, 0, 0.1);
  background: transparent;
}
</style>
