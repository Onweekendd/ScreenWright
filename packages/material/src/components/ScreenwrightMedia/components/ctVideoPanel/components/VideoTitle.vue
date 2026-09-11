<template>
  <div class="video-banner flex flex-align-center" :style="styleConfig.videoTitle">
    <span class="camera-icon" v-if="option.showVideoIcon" :style="styleConfig.defaultIcon" />
    <span class="camera-text" :style="styleConfig.defaultFont" :data-translate="item.name">{{ item.name }}</span>
  </div>
</template>

<script setup lang="ts">
import type { StyleConfig, VideoItem, VideoOption } from "../../types";

defineProps<{
  item: VideoItem;
  option: VideoOption;
  styleConfig: StyleConfig;
}>();
</script>

<style lang="scss" scoped>
.video-banner {
  // height: 50px;
  line-height: 50px;
  .camera-icon {
    display: inline-block;
    margin-right: 5px;
    background-size: 100% 100%;
  }
  .camera-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
  }
}
</style>
