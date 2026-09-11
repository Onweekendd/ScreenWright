<template>
  <el-watermark
    :rotate="waterMark.degree || 0"
    :content="[waterMark.text]"
    :font="waterMarkFontStyle"
    style="width: 100%; height: 100%; pointer-events: none"
    :gap="[200, 200]"
    v-if="showWaterMark"
  >
    <div :style="{ height: height + 'px', zIndex: -1 }" />
  </el-watermark>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useWindowSize } from "@vueuse/core";

import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";

const { height } = useWindowSize();
const { editConfig } = useEditStore();
const waterMark = computed(() => {
  return editConfig.value.waterMark;
});
const showWaterMark = computed(() => {
  return editConfig.value.showWaterMark;
});
const waterMarkFontStyle = computed(() => {
  return {
    fontSize: waterMark.value.fontSize,
    color: waterMark.value.color,
    fontWeight: waterMark.value.fontWeight === "bolder" ? 800 : 100,
    fontStyle: (waterMark.value.fontStyle === "italic" ? "italic" : "normal") as any,
    fontFamily: waterMark.value.fontFamily
  };
});
</script>
