<template>
  <div class="video-box" :style="videoStyle">
    <video-hls
      v-if="videoData.url"
      class="video-view"
      :video-id="videoId"
      :video-data="videoData"
      :option="option"
      :object-fit="objectFit"
      :element="element"
      :is-build="isBuild"
      @video-end="sendVideoEnd"
    />
    <div v-else class="video-view flex flex-align-center flex-justify-center">暂无视频</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { ComponentType } from "@screenwright/types";

import type { VideoItem, VideoOption } from "../../types";
import VideoHls from "./VideoHls.vue";

const props = defineProps<{
  videoData: VideoItem;
  option: VideoOption;
  objectFit?: string;
  videoId: string;
  isBuild: boolean;
  element: ComponentType;
}>();

const emits = defineEmits<{
  (e: "video-end", info: any): void;
}>();

const videoStyle = computed(() => ({
  height: props.option.videoBoxHeight ? `${props.option.videoBoxHeight}%` : "100%",
  width: props.option.videoBoxWidth ? `${props.option.videoBoxWidth}%` : "100%",
  padding: props.option.padding ? props.option.padding.map((item: any) => `${item}px`).join(" ") : 0
}));

const sendVideoEnd = (info: any) => {
  emits("video-end", info);
};
</script>

<style lang="scss" scoped>
.video-box {
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
  box-sizing: border-box;

  .video-view {
    width: 100%;
    height: 100%;
    object-fit: cover;
    letter-spacing: 2px;
    font-size: 16px;
    position: relative;
  }
}
</style>
