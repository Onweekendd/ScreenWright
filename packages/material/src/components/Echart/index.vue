<template>
  <div style="width: 100%; height: 100%" ref="elEcharts" />
</template>
<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";

import { debounce } from "lodash-es";

import { pieEchartType } from "../ScreenwrightEcharts/core/type";
import type { ComponentType } from "@screenwright/types";

import { validData } from "../ScreenwrightText/components/utils";
import type { EChartsCoreOption } from "./type";
import { useEcharts } from "./useEcharts";
// 具名引用，确保 ./utils 的 echarts.use([...]) 副作用不被 sideEffects 摇树误删（见 utils.ts）
import { echartsRegistered } from "./utils";

if (!echartsRegistered.ok || !echartsRegistered.count) {
  console.error("[Echart] echarts 图表类型未注册，图表将无法渲染");
}

interface Props {
  options: EChartsCoreOption;
  element: ComponentType;
}
const props = defineProps<Props>();
const elEcharts = shallowRef();
const currentOptions = shallowRef(props.options);
const {
  isBuild,
  setOptions,
  initCharts,
  handleReStart,
  autoHover,
  clearDataLoopTimer,
} = useEcharts(elEcharts, currentOptions.value, props.element);
const autoReflashInterval = ref<NodeJS.Timeout | null>(null);
const debouncedUpdate = debounce(setOptions, 50);
const autoRefresh = (element: ComponentType) => {
  if (element.autoRefresh) {
    if (autoReflashInterval.value) {
      clearInterval(autoReflashInterval.value);
    }
    autoReflashInterval.value = setInterval(async () => {
      element.option.refreshKey = !element.option.refreshKey;
    }, element.time * 1000);
  }
};

watch(
  () => props.options,
  (nVal) => {
    let targetOptions: EChartsCoreOption = {};
    targetOptions = { ...nVal };
    debouncedUpdate(targetOptions);
  },
);

watch(
  () => props.element,
  async (nVal) => {
    await nextTick();
    autoRefresh(nVal);
    animationHandle(nVal);
  },
  { immediate: true, deep: isBuild.value ? true : false },
);

const tooltipTimer = ref<{ clearLoop: () => void } | null>(null);
const animationHandle = async (element: ComponentType) => {
  if (validData(element.option.dataLoop, false)) {
    handleReStart();
  } else {
    clearDataLoopTimer();
  }

  // 处理提示框轮播
  if (tooltipTimer.value) tooltipTimer.value.clearLoop();

  if (element.option.tooltipLoop) {
    tooltipTimer.value = null;
    if (element.component.prop === pieEchartType.echartloopRingPie) {
      tooltipTimer.value = await autoHover({
        option: element.option,
        num: element.data.length * 2,
        time: element.option.tooltipLoopInterval * 1000,
        countIncreaseNum: 2,
      });
    } else {
      tooltipTimer.value = await autoHover({
        option: element.option,
        num: element.data.length,
        time: element.option.tooltipLoopInterval * 1000,
      });
    }
  }
};

onMounted(async () => {
  await nextTick();
  initCharts();
});
onUnmounted(() => {
  if (tooltipTimer.value) {
    tooltipTimer.value.clearLoop();
  }
});
</script>
