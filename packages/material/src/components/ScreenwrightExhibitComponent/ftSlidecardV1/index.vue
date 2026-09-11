<template>
  <div
    :class="{
      'image-stack-container': true,
      'component-bind-events': true
    }"
    @click="handleClick"
  >
    <stack-list
      :id="element.id + ''"
      :images="dataChart"
      :option="element.option"
      :width="element.component.width"
      :height="element.component.height"
      ref="stackListRef"
    />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";

import { useActionEvent } from "@screenwright/composables";
import { useBaseData } from "@screenwright/composables";
import { EventTypeEnum } from "@screenwright/types";
import { ExhibitEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import StackList from "./StackList.vue";

interface Props {
  element: ComponentType;
}
const stackListRef = ref();

const props = defineProps<Props>();
const { dataChart, handleEventAndCallbackEvent } = useBaseData(props.element);
const { addEvent } = useActionEvent();
const handleClick = () => {
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,

    throwValue: props.element
  });
};
onMounted(() => {
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,

    throwValue: props.element
  });

  // 注册组件事件到全局事件系统
  addEvent({
    [`${ExhibitEnum.FtSlidecardV1}-${props.element.id}`]: {
      handleClick,
      handlePrevClick: () => {
        stackListRef.value.handlePrevClick();
      },
      handleNextClick: () => {
        stackListRef.value.handleNextClick();
      }
    }
  });
});
</script>
<style scoped>
.image-stack-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
