<template>
  <el-carousel
    :type="carousel.type"
    :interval="carousel.interval"
    :height="`${height}px`"
    :direction="carousel.direction"
    :arrow="carousel.arrow"
    :indicator-position="carousel.indicator"
  >
    <el-carousel-item v-for="(item, i) in dataList" :key="i" @click="emits('click', item, i)">
      <video-title v-if="option.showVideoIcon" :item="item" :option="option" :style-config="styleConfig" />

      <VideoBox
        :video-data="item"
        :option="option"
        :style-config="styleConfig"
        :video-id="`video-${id}-${i}`"
        :element="element"
        :objectFit="option.objectFit"
        :is-build="isBuild"
        :style="{
          height: `${option.showVideoIcon ? 'calc(100% - 50px)' : '100%'}`
        }"
      />
    </el-carousel-item>
  </el-carousel>
</template>

<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";

import type { CarouselOption, StyleConfig, VideoItem, VideoOption } from "../../types";
import VideoBox from "./VideoBox.vue";
import VideoTitle from "./VideoTitle.vue";

defineProps<{
  dataList: VideoItem[];
  option: VideoOption;
  carousel: CarouselOption;
  height: number;
  styleConfig: StyleConfig;
  id: number;
  element: ComponentType;
  isBuild: boolean;
}>();

const emits = defineEmits<{
  (e: "click", data: VideoItem, index: number): void;
}>();
</script>
