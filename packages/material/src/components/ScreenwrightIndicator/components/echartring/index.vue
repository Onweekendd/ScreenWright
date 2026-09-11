<template>
  <BaseChart :element="element">
    <div class="labelBox flex flex-center">
      <div :style="labelStyle" v-if="option.seriesLabelShow || false">
        {{ dataChartItem.value }}{{ option.seriesLabelUtil }}
      </div>
    </div>
  </BaseChart>
</template>
<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, ref, watch } from "vue";

import { isArray } from "lodash-es";

import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import BaseChart from "../../../ScreenwrightEcharts/index.vue";

defineOptions({
  name: "echartring"
});
interface Props {
  element: ComponentType;
}
const props = defineProps<Props>();
const { option, dataChart } = useBaseData(props.element);
const dataChartItem = ref<any>({});
const labelStyle = computed<CSSProperties>(() => {
  return {
    transform: `translateX(${option.value.seriesLabelOffsetX}px) translateY(${option.value.seriesLabelOffsetY}px)`,
    fontFamily: option.value.seriesLabelFontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
    fontStyle: option.value.seriesLabelFontStyle || "normal",
    fontSize: option.value.seriesLabelFontSize + "px" || 0,
    color: option.value.seriesLabelColor || "#333",
    fontWeight: option.value.seriesLabelFontWeight || "normal"
  };
});
watch(
  () => dataChart.value,
  (nv: any) => {
    if (isArray(nv) && nv.length) {
      dataChartItem.value = nv[0];
    } else {
      dataChartItem.value = nv;
    }
  },
  { deep: true, immediate: true }
);
</script>
<style lang="scss" scoped>
.labelBox {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  pointer-events: none;
}
</style>
