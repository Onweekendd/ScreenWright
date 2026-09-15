<template>
  <div class="ft-data-container" :style="styleSizeName">
    <div
      v-if="isBuild.value"
      ref="dataContainer"
      :class="{
        'default-dataContainer': true,
        ...componentClasses
      }"
      :style="styleFont"
    >
      {{ option.text || "数据容器，预览时不显示" }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, watch } from "vue";

import { isArray } from "lodash-es";

// 走子路径导入：@screenwright/types 根 dist 存在扁平 templates.js，会遮蔽 templates/index.d.ts 的类型再导出，
// 从根 import templateEvents 会报 TS2305；子路径 exports 直接映射到 dist/templates/index.d.ts，解析干净。
import { templateEvents } from "@screenwright/types/templates";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import { useDataContainer } from "./useDataContainer";

const props = defineProps<{
  element: ComponentType;
}>();

const { isBuild, componentClasses, styleFont, option, dataChart, styleSizeName, handleEventAndCallbackEvent } =
  useDataContainer(props.element);

const customEvent = computed(() => {
  if (props.element.events.length > 0) {
    return props.element.events;
  }

  return [templateEvents({})];
});

watch(
  () => dataChart.value,
  (newVal) => {
    if (newVal) {
      const info = isArray(newVal) ? newVal[0] : newVal;
      handleEventAndCallbackEvent({
        id: props.element.id,
        triggerType: EventTypeEnum.DataChange,
        events: customEvent.value,
        isExecuteOnlyConditionSatisfied: true,
        throwValue: info,
        isExecuteOnlyInViewMod: false
      });
    }
  },
  {
    immediate: true
  }
);
</script>
<style lang="scss" scoped>
.ft-data-container {
  pointer-events: none !important;

  .default-dataContainer {
    height: 100%;
    text-align: center;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
