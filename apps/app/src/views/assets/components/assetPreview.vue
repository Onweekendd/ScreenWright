<template>
  <div class="asset-preview flex flex-justify-center flex-align-center">
    <template v-if="`${item.resourceType}` === '2' && item.url">
      <video style="max-width: 100%; height: 100%" :src="setMinioUrl(item.url)" muted autoplay loop controls />
    </template>
    <template v-else-if="isVideoOrWeb(item.url)">
      <video
        crossorigin="anonymous"
        style="max-width: 100%; height: 100%"
        :src="setMinioUrl(item.url)"
        muted
        autoplay
        loop
        controls
      />
    </template>
    <template v-else-if="item.url.includes('.hdr') && item.hdrPreviewImg">
      <img :src="item.hdrPreviewImg" v-if="item.hdrPreviewImg" class="previewImg" />
      <SwItemEmpty v-else />
      <!-- <el-image style="width: 100%; height: 100%" :src="item.hdrPreviewImg || defaultContentItemImg" /> -->
    </template>

    <el-image
      v-else
      style="width: 100%; height: 100%"
      :src="`${preViewUrl}?t=${new Date().getTime()}`"
      fit="scale-down"
    />
  </div>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";

import type mitt from "mitt";

import SwItemEmpty from "@/components/SwItemEmpty/index.vue";
import type { assetItem } from "@/model/Assets";
import { setMinioUrl } from "@/utils/config";

const preViewUrl = ref();
interface Props {
  item: assetItem;
}
declare global {
  interface Window {
    JSPlugin: any;
    emitter: ReturnType<typeof mitt>;
  }
}
const props = defineProps<Props>();
const isVideoOrWeb = (url: string) => {
  const lastType = url.split(".").pop();
  return lastType === "mp4" || lastType === "webm";
};
onMounted(async () => {
  await nextTick();
  preViewUrl.value = setMinioUrl(props.item.url);
});
</script>
<style lang="scss" scoped>
.asset-preview {
  max-height: 566px;
  height: 566px;
  .previewImg {
    height: auto;
    width: 100%;
    max-height: 100%;
  }
}
.model-view-container {
  width: 100%;
  min-height: 555px;
  border: 1px dashed #3e4049;
}
</style>
