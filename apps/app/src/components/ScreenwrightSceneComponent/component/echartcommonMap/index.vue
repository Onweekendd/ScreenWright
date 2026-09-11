<template>
  <div class="echart-commonMap component-bind-events">
    <div ref="mapTemplate" :style="styleSizeName" />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, shallowRef } from "vue";
import { computed } from "vue";
import { watch } from "vue";
import { nextTick } from "vue";

import { echartsCore as echarts } from "@screenwright/material/chart";
import { ElMessage } from "element-plus";

import { useBaseFilter } from "@/components/componentEntry/useBaseFilter";
import { useActionEvent } from "@/hooks/eventHandling/useActionEvent";
import { useBaseData } from "@/hooks/useBaseData";
import { uuid } from "@/utils/utils";
import { EventTypeEnum } from "@/views/build/components/buildConfig/constants/index";
import { FilterData } from "@/views/build/components/buildRender/core/BaseComponent/filterData/index";
import { sceneEnumType } from "@/views/build/components/buildRender/core/SceneComponent/type";
import type { ComponentType } from "@/views/build/components/buildRender/type";
import { useDataFilter } from "@/views/build/useDataFilter";

import { echartCommonMapOptions } from "./options";

const { dataFilter } = useDataFilter();
type EchartsInstance = echarts.ECharts;
interface Props {
  element: ComponentType;
}
const props = defineProps<Props>();
const mapTemplate = ref<HTMLElement | null>(null);
const charts = shallowRef<EchartsInstance>();
const filterData = new FilterData();
const childDataChart = ref<Record<any, any>>({});
const echartCommonInstance = new echartCommonMapOptions();
const { handleEventAndCallbackEvent, styleSizeName } = useBaseData(props.element);
const { inputData, initData } = useBaseFilter(props.element);
const { addEvent } = useActionEvent();
const childComponent = computed(() => {
  return [...(props.element.presetChild || [])].map((item) => {
    return {
      ...item,
      id: item.id || uuid()
    };
  });
});
const labelName = ref("");

const adcode = computed(() => {
  const len = inputData.value.length - 1;
  const last = inputData.value[len];
  console.log(last, "lastlastlastlast");
  if (last && last.adcode) {
    return last.adcode || "100000";
  }
  return "100000";
});
// const adcode = ref("100000");

const transformDataChartByFilter = async () => {
  for (let i = 0; i < childComponent.value.length; i++) {
    const item = childComponent.value[i];
    childDataChart.value[item.id] = await filterData.run({ filterConfig: dataFilter.value, target: item });
  }
};
const updateChart = async () => {
  if (!mapTemplate.value) {
    console.error("mapTemplate is not defined");
    return;
  }
  await nextTick();
  await transformDataChartByFilter();
  const options = await echartCommonInstance.start({
    adcode: adcode.value,
    option: props.element.option,
    childComponent: childComponent.value,
    childDataChart: childDataChart.value,
    name: labelName.value
  });
  const geoJson = echartCommonInstance.getGeoJson() as any;
  echarts.init(mapTemplate.value as HTMLElement).dispose();
  charts.value = echarts.init(mapTemplate.value as HTMLElement);
  echarts.registerMap("China", geoJson);
  charts.value.setOption(options, true);
  charts.value.resize();
  charts.value.on("click", onGeoComponentClick);
  charts.value.on("contextmenu", onGeoComponentContextmenu);
};
const onGeoComponentContextmenu = () => {
  if (inputData.value.length === 1 || !props.element.option.autoDrillDown) {
    return;
  }
  const data = props.element.data;
  data.pop();
  initData().then(() => {
    updateChart();
  });
};
const onGeoComponentClick = (params: any, isExecuteOnlyConditionSatisfied = false) => {
  console.log(isExecuteOnlyConditionSatisfied, "isExecuteOnlyConditionSatisfied");
  if (!props.element.option.maxDrillDownLevel || !props.element.option.autoDrillDown) {
    return;
  }
  if (inputData.value.length > props.element.option.maxDrillDownLevel) {
    ElMessage.error(`${params.name || ""}目前该区域尚未开放数据`);
    return;
  }
  labelName.value = params.name || "";
  if (props.element.option.autoDrillDown) {
    onDrillDown(params.name);
  }
  const adcode = props.element.data.find((item: any) => item.name === params.name)?.adcode;
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,
    isExecuteOnlyConditionSatisfied: true,
    throwValue: {
      data: props.element.data,
      adcode: adcode || "",
      name: params.name
    }
  });
};

// 点击处理函数（供外部调用）
const handleClick = (info: any, isExecuteOnlyConditionSatisfied = false) => {
  // 模拟地图点击事件
  onGeoComponentClick(info || { name: "" }, isExecuteOnlyConditionSatisfied);
};
const onDrillDown = async (regionName: string) => {
  const region = echartCommonInstance.getRegionByName(regionName);
  if (region) {
    const data = props.element.data;
    data.push(region);
    await initData();
    updateChart();
  }
};

watch(
  () => props.element.option,
  async () => {
    console.log("option changed", props.element.option);
    await initData();
    updateChart();
  },
  { deep: true }
);

watch(
  () => props.element.data,
  async () => {
    console.log("data changed", props.element.data);
    await initData();
    updateChart();
  }
);

watch(
  () => [props.element.component.width, props.element.component.height],
  async () => {
    if (charts.value) {
      updateChart();
    }
  }
);

watch(
  () => props.element.presetChild,
  async () => {
    console.log("presetChild changed", props.element.presetChild);
    await initData();
    updateChart();
  },
  { deep: true }
);

onMounted(async () => {
  await initData();
  updateChart();
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,
    isExecuteOnlyConditionSatisfied: true,
    throwValue: props.element.data
  });

  // 注册组件事件到全局事件系统
  addEvent({
    [`${sceneEnumType.EchartcommonMap}-${props.element.id}`]: {
      handleClick
    }
  });
});
</script>
<style lang="scss" scoped>
.echart-commonMap {
  width: 100%;
  height: 100%;
}
</style>
