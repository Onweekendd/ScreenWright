<template>
  <div class="sw-box" :style="boxStyle" />
</template>

<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";

import { useSwBox } from "./useSwBox";

const props = defineProps<{ element: ComponentType }>();
const { boxStyle } = useSwBox(props.element);
</script>

<style lang="scss" scoped>
.sw-box {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}
</style>
