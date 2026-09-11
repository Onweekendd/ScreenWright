<!-- 滚动选择器 -->
<template>
  <div class="scrollPicker" :style="containerStyle">
    <div :class="contentBoxClass" :style="contentBoxStyle" @wheel="testWheel">
      <div
        v-for="(dataItem, dataIndex) in showListData"
        class="dataItem"
        :key="dataIndex"
        :style="getComputedItemStyle(dataItem, dataIndex)"
        @click="handleClick(dataItem)"
      >
        <div
          class="text"
          v-html="dataItem.label || dataItem.content"
          :data-translate="dataItem.label || dataItem.content"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { useActionEvent } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import { useScrollPicker } from "./useScrollPicker";

defineOptions({
  name: "scrollPicker"
});
const { addEvent } = useActionEvent();

const props = defineProps<{
  element: ComponentType;
}>();

// 使用scrollPicker hook
const {
  showListData,
  containerStyle,
  contentBoxClass,
  contentBoxStyle,
  getComputedItemStyle,
  handleActionClick,
  // refreshShowListData,
  handleClick,
  testWheel
} = useScrollPicker(props.element);
onMounted(() => {
  addEvent({
    [`${interactiveEnum.ScrollPicker}-${props.element.id}`]: {
      handleClick: (actionSelect: { label: string; value: string; s: string }) => handleActionClick(actionSelect)
    }
  });
});
</script>

<style lang="scss" scoped>
.scrollPicker {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
  .contentBox {
    width: 100%;
    height: 100%;
    position: relative;
    overflow-y: auto;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    &::-webkit-scrollbar {
      width: 0px;
      height: 0px;
    }
    .dataItem {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      flex: 1;
      .text {
        width: 100%;
      }
    }
  }
}
</style>
