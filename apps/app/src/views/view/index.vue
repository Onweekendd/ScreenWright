<template>
  <!-- :style="overFlowStyle" -->
  <div class="bi-view" :style="overFlowStyle">
    <div
      class="loading-mask-scene"
      style="width: 100%; height: 100%; background-color: #232630"
      v-if="loadingScreenData"
    >
      <video src="/video/loading/loading-mask-scene.webm" autoplay loop muted />
    </div>

    <div
      class="view-wrapper"
      :style="{
        ...wrapperStyle,
        ...wrapperBgStyle
      }"
      v-else
    >
      <buildRender
        :editConfig="currentConfig"
        v-model="componentList"
        disabled
        :panel-id="panelId"
        :status-id="statusId"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";

import { useBluePrint } from "@/hooks/useBluePrint";
import buildRender from "@/views/build/components/buildRender/index.vue";

import { useTabsTouchMove } from "./useTabsTouchMove";
import { useVideoProgress } from "./useVideoProgress";
import { useView } from "./useView";
defineOptions({
  name: "ScreenwrightView"
});

// 使用组合式函数获取所有视图相关的逻辑
const {
  loadingScreenData,
  panelId,
  statusId,
  componentList,
  currentConfig,
  wrapperStyle,
  wrapperBgStyle,
  init,
  cleanup,
  overFlowStyle
} = useView();
const { initTabsTouchMove } = useTabsTouchMove();

const { initBluePrint } = useBluePrint();
const { initVideoProgressControl } = useVideoProgress();
// 生命周期处理
onMounted(async () => {
  await initBluePrint();
  await init();
  initTabsTouchMove(componentList.value);
  initVideoProgressControl(componentList.value);
});

onBeforeUnmount(() => {
  cleanup();
});
</script>
<style lang="scss" scoped>
.loading-mask-scene {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.bi-view {
  position: relative;
  width: 100%;
  height: 100%;

  // &::-webkit-scrollbar {
  //   width: 10px !important;
  //   height: 10px !important;
  // }

  &::-webkit-scrollbar-track {
    background-color: #2d2d2d !important;
    border-radius: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #5a5a5a !important;
    border-radius: 5px;

    &:hover {
      background-color: #6a6a6a !important;
    }
  }
  .view-wrapper {
    overflow: hidden !important;
    position: relative;
  }
}
</style>
