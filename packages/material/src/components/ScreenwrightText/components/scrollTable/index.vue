<template>
  <div
    :class="{
      'parts-table': true,
      'component-bind-events': true,
      'has-bind': attrs.events && attrs.events.length && isBuild.value,
      'has-encode': attrs.encodes && attrs.encodes.length && isBuild.value
    }"
    :id="`parts-table-${id}`"
  >
    <TableHeader :option="option" />

    <ScrollContainer
      :option="option"
      :height="height"
      :isAnimateScroll="isAnimateScroll"
      :listData="listData"
    >
      <template #default="{ item, index }">
        <TableRow :element="element" :item="item" :listIndex="index" />
      </template>
    </ScrollContainer>
  </div>
</template>

<script setup lang="ts">
import { EventTypeEnum, textEnum, type ComponentType } from "@screenwright/types";
import { onMounted, useAttrs, watch } from "vue";

import { useActionEvent, useBaseData, useBaseFilter } from "@screenwright/composables";

import type { Attrs } from "../types";
import ScrollContainer from "./ScrollContainer.vue";
import TableHeader from "./TableHeader.vue";
import TableRow from "./TableRow.vue";
import { useScrollTable } from "./useScrollTable";

defineOptions({
  name: "ftScroll"
});
const props = defineProps<{ element: ComponentType }>();

const { height, option, isBuild, id, handleEventAndCallbackEvent } = useBaseData(props.element);
const { inputData } = useBaseFilter(props.element);
const { addEvent } = useActionEvent();

const attrs: Attrs = useAttrs();

const { isAnimateScroll, listData, initRowList } = useScrollTable(props.element, inputData, option);

watch(inputData, () => {
  if (inputData.value && inputData.value.length) {
    initRowList();
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.DataChange,
      events: props.element.events,

      throwValue: props.element
    });
  }
});

// 点击处理函数（供外部调用）
const handleClick = (info: any) => {
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,

    throwValue: info || {}
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
    [`${textEnum.SwScroll}-${props.element.id}`]: {
      handleClick
    }
  });
});
</script>

<style lang="scss" scoped>
.parts-table {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  * {
    box-sizing: border-box !important;
  }
}
</style>
