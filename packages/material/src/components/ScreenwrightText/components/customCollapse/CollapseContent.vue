<template>
  <div
    class="content-box flex flex-center"
    :style="{
      ...contentStyle,
      height: `${isExpanded ? `${option.contentHeight || 200}px` : '0'}`
    }"
  >
    <div class="border-bg flex flex-center" :style="detailStyle">
      <video
        :style="{
          ...radiusStyle,
          'object-fit': item.imageSize || 'fill'
        }"
        v-if="item.type === 'video'"
        :src="setMinioUrl(item.value)"
        autoplay="true"
        loop
        muted
      />
      <img
        v-else-if="item.type === 'image'"
        :src="setMinioUrl(item.value)"
        alt=""
        :style="{ ...radiusStyle, 'object-fit': item.imageSize || 'fill' }"
      />
      <div v-else class="text-word" :style="radiusStyle">
        {{ item.value || "--" }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { setMinioUrl } from "@material/minioUrl";

interface Props {
  item: {
    title: string;
    value: string;
    type: string;
    index: number;
    imageSize: "contain" | "cover" | "fill" | "none" | "scale-down";
  };
  isExpanded: boolean;
  contentStyle: Record<string, any>;
  detailStyle: Record<string, any>;
  radiusStyle: Record<string, any>;
  option: Record<string, any>;
}
defineProps<Props>();
</script>

<style lang="scss" scoped>
.content-box {
  transition: height 0.5s ease-in;
  overflow: hidden;

  .border-bg {
    width: 100%;
    height: 100%;
    box-sizing: content-box;
  }

  img,
  video {
    height: 100%;
    width: 100%;
    object-fit: contain;
  }

  .text-word {
    width: 100%;
    height: 100%;
    white-space: break-spaces;
    text-indent: 2em;
    overflow: auto;
  }

  ::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}
</style>
