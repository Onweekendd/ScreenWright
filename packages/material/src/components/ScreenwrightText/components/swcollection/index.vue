<!-- 卡片组件 -->
<template>
  <div class="ft-collection" :style="styleSizeName">
    <div
      class="collection-container"
      @mouseover="handleStopScroll"
      @mouseleave="startScroll"
      ref="collection"
      v-if="option.cardLen"
    >
      <CollectionItem
        v-for="(item, index) in cardData"
        :key="index"
        :item="item"
        :card-style="cardStyle"
        :card-item-style="cardItemStyle"
        :title-style="titleStyle"
        :option="option"
        @item-click="handleClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from "vue";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import { EventTypeEnum } from "@screenwright/types";

import { useBaseData, useBaseFilter } from "@screenwright/composables";

import CollectionItem from "./collection-item.vue";
import type { CollectionItem as CollectionItemType } from "./types";
import { useCollection } from "./useCollection";

defineOptions({
  name: "ftCollection"
});

const props = defineProps<{
  element: any;
}>();

const collection = ref<HTMLElement | null>(null);

const { option, width, height, handleEventAndCallbackEvent } = useBaseData(props.element);
const { inputData } = useBaseFilter(props.element);
// 使用提取的hook
const {
  cardData,
  styleSizeName,
  cardStyle,
  cardItemStyle,
  titleStyle,
  isScrolling,
  pauseScroll,
  initScroll,
  startScroll,
  handleStopScroll,
  updateScrollbarVisibility
} = useCollection(collection as Ref<HTMLElement | null>, option, width, height, inputData);

const handleClick = (item: CollectionItemType) => {
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,
    throwValue: item
  });
};

// 生命周期钩子
onMounted(() => {
  updateScrollbarVisibility();
  initScroll();
  if (option.value.scroll) {
    startScroll();
  }
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,

    throwValue: cardData.value
  });
});

onBeforeUnmount(() => {
  pauseScroll();
});

// 监听器
watch(
  () => option.value.scroll,
  (newVal) => {
    if (newVal) {
      initScroll();
      startScroll();
    } else {
      pauseScroll();
      if (collection.value) {
        collection.value.scrollLeft = 0;
      }
    }
  }
);

watch(
  () => option.value.speedPosition,
  () => {
    initScroll();
    if (option.value.scroll) {
      startScroll();
    }
  }
);

watch(
  () => option.value.speed,
  () => {
    if (isScrolling.value) {
      pauseScroll();
      startScroll();
    }
  }
);

watch(
  () => option.value.scrollBar,
  () => {
    updateScrollbarVisibility();
  }
);
</script>

<style lang="scss" scoped>
.ft-collection {
  overflow: hidden;
  box-sizing: border-box;
  background-size: 100% 100%;
  background-repeat: no-repeat;

  .collection-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    white-space: nowrap;
    --show-scrollbar: block;
    overflow-x: var(--show-scrollbar);
  }
}
</style>
