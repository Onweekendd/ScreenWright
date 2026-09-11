<template>
  <div class="page-btn flex flex-center" :style="styleConfig.pager">
    <div class="prevPage" :style="styleConfig.pageIcon" @click="emits('change', current - 1)" />
    <div class="pageInfo">
      <span class="pageInfo-current" :style="styleConfig.pagerfont">{{ current }}</span>
      <span class="pageInfo-total" :style="styleConfig.totalfont">/{{ pageTotal }}</span>
    </div>
    <div class="nextPage" :style="styleConfig.pageIcon" @click="emits('change', current + 1)" />
  </div>
</template>

<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";

import type { StyleConfig, VideoOption } from "../../types";

defineProps<{
  current: number;
  pageTotal: number;
  option: VideoOption;
  styleConfig: StyleConfig;
  element: ComponentType;
}>();

const emits = defineEmits<{
  (e: "change", index: number): void;
}>();
</script>
<style lang="scss" scoped>
.page-btn {
  width: 100%;
  height: 40px;
  position: absolute;
  bottom: 0;
  left: 0;
  .prevPage,
  .nextPage {
    width: 44px;
    height: 24px;
    background-size: 100% 100%;
  }
  .prevPage {
    transform: rotateY(180deg);
  }
  .pageInfo {
    margin: 0 40px;
    letter-spacing: 2px;
    &-current {
      color: #ffffff;
      font-size: 20px;
    }
    &-total {
      color: #25fffb;
      font-size: 16px;
    }
  }
}
</style>
