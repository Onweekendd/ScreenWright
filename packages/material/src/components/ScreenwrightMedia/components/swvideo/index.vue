<template>
  <div
    v-if="visibility"
    ref="mainRef"
    class="ft-video"
    :style="{
      ...containerStyle,
      ...getFrostedStyle
    }"
    @click="handleClick"
  >
    <div class="video-box" :style="bgStyle">
      <img v-if="showPreview && !isAutoPlay" class="previewImg" :src="imgUrl" :style="videoStyle" alt="" />
      <video
        v-else
        ref="videoRef"
        :id="`video_${element.id}`"
        :controls="option.controler"
        :autoplay="isAutoPlay"
        :loop="option.loopPlay"
        :muted="option.muted"
        controlslist="nodownload nofullscreen noplaybackrate"
        :style="videoStyle"
        :poster="posterUrl"
        :src="videoUrl"
        @ended="handleEnded"
      >
        <source :src="videoUrl" type="video/mp4" />
        <source :src="videoUrl" type="video/webm" />
      </video>
      <div class="video-tips" ref="tipsRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { isNil } from "lodash-es";

import { useFrostedStyle } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import { useFtVideo } from "./useFtVideo";

const props = defineProps<{ element: ComponentType }>();
const { getFrostedStyle } = useFrostedStyle(props.element);
const {
  // refs
  mainRef,
  videoRef,
  tipsRef,
  // state
  showPreview,
  visibility,
  containerStyle,
  imgUrl,
  posterUrl,
  videoUrl,
  bgStyle,
  videoStyle,
  isAutoPlay,
  // methods
  handleClick,
  handleEnded,
  // option
  option
} = useFtVideo(props.element);

const opacity = computed(() => {
  return isNil(option.value.opacity) ? 1 : option.value.opacity;
});
</script>

<style lang="scss" scoped>
.ft-video {
  width: 100% !important;
  height: 100% !important;
  opacity: v-bind(opacity) !important;

  &.hidenAnimate {
    animation: hidenAnimate 1s ease-in 1;
  }

  .video-box {
    width: 100% !important;
    height: 100% !important;
  }

  video {
    width: 100%;
    height: 100%;
    zoom: var(--unscale);

    &::-webkit-media-controls-fullscreen-button,
    &::-webkit-media-controls-download-button,
    &::-webkit-media-controls-mute-button {
      display: none;
    }
  }

  .previewImg {
    width: 100%;
    height: 100%;
    overflow: hidden;
    object-fit: fill;
  }
  .video-tips {
    position: absolute;
    top: 45%;
    text-align: center;
    width: 100%;
  }
}
</style>
