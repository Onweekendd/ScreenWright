<template>
  <div class="bi-view" :style="overFlowStyle">
    <div
      class="view-wrapper"
      :style="{
        ...wrapperStyle,
        ...wrapperBgStyle
      }"
    >
      <buildRender :editConfig="currentConfig" v-model="componentList" disabled />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

import type { LargeScreeInfo } from "@screenwright/types";

import buildRender from "@/views/build/components/buildRender/index.vue";

import { useExportView } from "./useExportView";

defineOptions({
  name: "ScreenwrightView"
});

const props = defineProps<{
  data?: LargeScreeInfo;
}>();
// 使用组合式函数获取所有视图相关的逻辑
const { componentList, currentConfig, wrapperStyle, overFlowStyle, wrapperBgStyle, init, cleanup } = useExportView();
const route = useRoute();

// 生命周期处理
onMounted(async () => {
  await init(props.data as LargeScreeInfo & { [key: string]: unknown });
});

// 监听路由参数变化，重新执行 init
watch(
  () => route.params,
  async () => {
    if (props.data) {
      cleanup();

      await init(props.data as LargeScreeInfo & { [key: string]: unknown });
    }
  },
  { deep: true }
);

onBeforeUnmount(() => {
  cleanup();
});
</script>
<style lang="scss" scoped>
.bi-view {
  position: relative;
  width: 100%;
  height: 100%;

  &::-webkit-scrollbar {
    width: 10px !important;
    height: 10px !important;
  }

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
