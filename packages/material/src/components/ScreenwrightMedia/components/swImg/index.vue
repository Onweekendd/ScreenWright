<template>
  <div class="ft-img" :style="getFrostedStyle">
    <div class="imgBox" :style="mergedStyle" ref="imgBoxRef" @click.stop="handleClick">
      <img ref="imageRef" :src="setMinioUrl(dataChartItem.value)" :style="styleImgBoxName" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import { useSwImg } from "./useSwImg";

const props = defineProps<{ element: ComponentType }>();

const { dataChartItem, imgBoxRef, imageRef, getFrostedStyle, mergedStyle, styleImgBoxName, handleClick } = useSwImg(
  props.element
);
</script>

<style lang="scss" scoped>
.ft-img {
  width: 100%;
  height: 100%;

  .imgBox {
    width: 100% !important;
    height: 100% !important;
    overflow: hidden;
    position: relative;

    img {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
