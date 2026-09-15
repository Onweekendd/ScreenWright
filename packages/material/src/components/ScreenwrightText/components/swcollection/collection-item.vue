<template>
  <div class="collection-item" :style="cardStyle" @click.stop="handleClick(item)">
    <template v-if="mediaType === '图片'">
      <img :style="cardItemStyle" :src="setMinioUrl(item.src)" alt="" />
    </template>
    <template v-else-if="mediaType === '视频'">
      <video
        :style="cardItemStyle"
        :src="setMinioUrl(item.src)"
        :loop="option.loopPlay"
        :autoplay="option.autoPlay"
        :muted="option.muted"
        :controls="option.controls"
      />
    </template>
    <div class="title" :style="titleStyle" v-if="item.title" :data-translate="item.title">{{ item.title }}</div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed } from "vue";

import { setMinioUrl } from "@material/minioUrl";

import type { Option } from "../types";
import type { CollectionItem, MediaType } from "./types";

const props = defineProps<{
  item: CollectionItem;
  cardStyle: CSSProperties;
  cardItemStyle: CSSProperties;
  titleStyle: CSSProperties;
  option: Option;
}>();

const emit = defineEmits<{
  (e: "item-click", item: CollectionItem): void;
}>();

const mediaType = computed<MediaType>(() => {
  const url = props.item.src || "";
  const imageExtensions = /\.(jpg|jpeg|png|apng|gif|bmp)$/i;
  const videoExtensions = /\.(mp4|webm|mov|avi|wmv|flv|mkv)$/i;

  if (imageExtensions.test(url)) return "图片";
  if (videoExtensions.test(url)) return "视频";
  return "";
});

const handleClick = (item: CollectionItem) => {
  emit("item-click", item);
};
</script>

<style lang="scss" scoped>
.collection-item {
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  vertical-align: top;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.02);
    z-index: 1;
    cursor: pointer;
  }

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 4px;
  }

  .title {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    border-radius: 3px;
    background-size: cover;
    background-repeat: no-repeat;
    font-size: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 90%;
  }
}
</style>
