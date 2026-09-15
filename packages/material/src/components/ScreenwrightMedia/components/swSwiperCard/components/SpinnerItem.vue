<template>
  <div
    :style="itemStyle"
    :class="[`${uid}-spinner-item`, 'spinner-item', { activeSpinner: isActive }]"
    @click="handleClick"
  >
    <div v-if="!item?.isNullVal" class="content-wrapper flex flex-center">
      <div class="mark" :style="{ opacity: item.markOpacity }" />

      <div
        v-if="item.titleStyle.show"
        class="title"
        :style="item.titleStyle"
        :data-translate="dataItem?.title || cardItem.titleContent"
      >
        {{ dataItem?.title || cardItem.titleContent }}
      </div>

      <div
        v-if="item.textStyle.show"
        class="text"
        :style="item.textStyle"
        :data-translate="dataItem?.text || cardItem.textContent"
      >
        {{ dataItem?.text || cardItem.textContent }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CardItem, DataItem, SpinnerItem } from "../../types";

export interface SpinnerItemProps {
  uid: string;
  item: SpinnerItem;
  index: number;
  isActive: boolean;
  itemStyle: Record<string, any>;
  dataItem?: DataItem;
  cardItem: CardItem;
  transitionTime: string;
}
const props = defineProps<SpinnerItemProps>();
const emits = defineEmits<{
  (e: "click", event: Event, item: SpinnerItem, index: number): void;
}>();

const handleClick = (event: Event) => {
  emits("click", event, props.item, props.index);
};
</script>

<style lang="scss" scoped>
.spinner-item {
  position: absolute;
  top: 50%;
  left: 50%;
  outline: 1px solid transparent;
  transition-duration: v-bind("transitionTime");

  .content-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .mark {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background-color: rgb(0, 0, 0);
  }

  .title,
  .text {
    position: absolute;
    overflow: hidden;
  }
}
</style>
