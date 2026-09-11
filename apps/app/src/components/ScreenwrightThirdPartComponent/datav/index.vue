<template>
  <div class="datav" style="width: 100%; height: 100%" ref="datavRef">
    <component :is="option.is" v-bind="config" style="width: 100%; height: 100%" v-if="isLoad" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watchEffect } from "vue";
import { useParentElement, useResizeObserver } from "@vueuse/core";

import type { ComponentType } from "@/views/build/components/buildRender/type";

import { useDataV } from "./useDataV";

const props = defineProps<{
  element: ComponentType;
}>();
const datavRef = ref<HTMLElement | null>(null);
const parentEl = useParentElement();
let stop: any = null;
if (parentEl) {
  stop = useResizeObserver(parentEl, () => {
    updateChart();
  });
}
const { config, isLoad, option, updateChart } = useDataV(props.element);

// 初始化时更新图表
updateChart();

// 监听配置变化时更新图表
watchEffect(() => {
  if (option.value.echartFormatter) {
    updateChart();
  }
});
onBeforeUnmount(() => {
  stop && stop.stop();
});
</script>

<style scoped>
.datav {
  width: 100%;
  height: 100%;
}
</style>
