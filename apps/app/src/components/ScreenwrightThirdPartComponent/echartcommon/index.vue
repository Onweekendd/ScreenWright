<template>
  <div class="echartcommon" :style="styleSizeName">
    <BaseChart :options="echartsOptions as EChartsCoreOption" :element="element" />
  </div>
</template>
<script setup lang="ts">
import { onMounted, watch } from "vue";

import { BaseChart } from "@screenwright/material/chart";
import type { EChartsCoreOption } from "echarts";

import type { ComponentType } from "@/views/build/components/buildRender/type";

import { useEchartsCommon } from "./useEchartsCommon";

const props = defineProps<{
  element: ComponentType;
}>();

const { option, echartsOptions, getEchartsOptions, styleSizeName } = useEchartsCommon(props.element);

watch(
  () => option.value.echartFormatter,
  (nv) => {
    if (nv) {
      getEchartsOptions();
    }
  }
);
onMounted(() => {
  getEchartsOptions();
});
</script>
<style lang="scss" scoped>
.echartcommon {
  font-size: 30px;
  color: #fff;
}
</style>
