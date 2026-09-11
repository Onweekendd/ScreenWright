<!-- 图标占比图 -->
<template>
  <div class="iconRatio" :style="containerStyle">
    <div :class="contentBoxClasses" :style="contentBoxStyle">
      <div class="flex flex-center" v-for="(iconItem, listIndex) in iconList" :key="listIndex">
        <div class="iconItemContent flex">
          <img :src="setMinioUrl(iconItem.iconImgSrc)" :style="getIconImgStyle(iconItem)" alt="" />
          <div class="iconItemText" :style="getIconTextStyle(iconItem)">{{ getIconItemDataValue(iconItem) }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";

import { useIconRatio } from "./useIconRatio";

defineOptions({
  name: "iconRatio"
});
const props = defineProps<{
  element: ComponentType;
}>();

const {
  iconList,
  containerStyle,
  contentBoxClasses,
  contentBoxStyle,
  getIconImgStyle,
  getIconTextStyle,
  getIconItemDataValue,
  setMinioUrl
} = useIconRatio(props);
</script>

<style lang="scss" scoped>
.iconRatio {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;

  .contentBox {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    position: relative;
    display: grid;
    place-items: center;

    .iconItemContent {
      flex-wrap: wrap;
      flex-direction: column;

      .iconItemText {
        text-align: center;
      }
    }
  }
}
</style>
