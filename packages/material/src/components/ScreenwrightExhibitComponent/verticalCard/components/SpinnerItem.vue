<template>
  <div
    :style="itemStyle"
    :class="[`${uid}-spinner-item`, 'spinner-item', { activeSpinner: isActive }]"
    @click="handleClick"
    ref="spinnerItemRef"
    :id="`spinner-item-${index}`"
  >
    <div v-if="!item?.isNullVal" class="content-wrapper flex flex-center">
      <div class="mark" :style="{ opacity: item.markOpacity }" />
      <CanvasImg
        :src="setMinioUrl(cardItem.backgroundImg)"
        ref="canvasRef"
        :id="`${uid}-spinner-item-canvas`"
        class="spinnerItemCanvas"
        v-if="cardItem.backgroundImg && cardItem.backgroundImg.length > 0"
        @load="handleImageLoad"
      />
      <!-- <div
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
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";

import type { CardItem, DataItem, SpinnerItem } from "../../../../media";
import { setMinioUrl } from "@screenwright/composables";
import { sleep } from "@screenwright/core";

import CanvasImg from "./CanvasImg.vue";

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
  (e: "loaded", element: HTMLElement | null): void;
}>();
const spinnerItemRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const handleClick = (event: Event) => {
  emits("click", event, props.item, props.index);
};
const handleImageLoad = async () => {
  await nextTick();
  console.log("imgageLoad", spinnerItemRef.value);
  emits("loaded", spinnerItemRef.value);
  await sleep(1100);
  if (spinnerItemRef.value) {
    spinnerItemRef.value.style.opacity = "1";
  }
};
</script>

<style lang="scss" scoped>
.spinner-item {
  position: absolute;
  top: 50%;
  left: 50%;
  outline: 1px solid transparent;
  transition-duration: v-bind("transitionTime");
  transform-origin: center center;
  // clip-path: inset(0 calc((100% - 400px) / 2) 0 calc((100% - 400px) / 2));
  transform: scale(1);
  will-change: clip-path, transform, top;
  opacity: 0;
  //   clip-path: inset(0 0 0 0);
  z-index: 1; /* 保证item在Canvas背景上层 */
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
  .spinnerItemCanvas {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
  }
}
.o1 {
  opacity: 1;
}
// .top-50 {
//   top: 50% !important;
// }
</style>
