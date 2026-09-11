<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";

import BaseChart from "../Echart/index.vue";
import { useScreenwrightEcharts } from "./useScreenwrightEcharts";

interface Props {
  element: ComponentType;
}

const props = defineProps<Props>();
const { options, element } = useScreenwrightEcharts(props.element);
</script>

<template>
  <div class="echart-container">
    <BaseChart :options="options" :element="element" />
    <slot />
  </div>
</template>

<style scoped>
.echart-container {
  height: 100%;
  width: 100%;
}
</style>
