<!-- 元素周期表/图片墙 -->
<template>
  <div class="ft-periodictable">
    <div class="container" :style="containerStyle">
      <div class="threeScene" ref="threeSceneRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";

import { setMinioUrl, useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import { registerFte } from "../../../../registerFte";
import { ftPeriodictableConfig } from "./config";

interface Props {
  element: ComponentType;
}
defineOptions({
  name: "ftPeriodictable"
});

const props = defineProps<Props>();
const { option, width, height } = useBaseData(props.element);
const threeSceneRef = ref<HTMLDivElement | null>(null);
const fteApp = shallowRef<any>(null);

// 计算样式
const containerStyle = computed(() => ({
  width: `${width.value}px`,
  height: `${height.value}px`
}));

// 处理图片URL
const currentOption = computed(() => ({
  ...option.value,
  images: option.value.images.map((item: any) => setMinioUrl(item.url)) || []
}));

// 更新周期表配置
const updatePeriodictable = () => {
  if (!fteApp.value) return;
  console.log(currentOption.value, "currentOption");
  fteApp.value.communication("setPeriodictable", {
    type: "periodictable",
    id: "rW8z1NGr-sa8R-4kfw-ak1m-UiVcc5OKbU0j",
    ...currentOption.value
  });
};
const initData = async () => {
  if (!threeSceneRef.value) return;
  await registerFte();
  console.log(window.fteApp, "new window.fteApp");
  fteApp.value = new window.fteApp.App();
  console.log("初始化周期表", fteApp.value);
  fteApp.value?.initBIService(
    {
      container: threeSceneRef.value,
      ...ftPeriodictableConfig
    },
    (e: number) => {
      if (e === 1) {
        updatePeriodictable();
      }
    }
  );
};
// 监听容器尺寸变化
watch(
  () => containerStyle.value,
  () => {
    setTimeout(() => {
      console.log("containerStyle changed", containerStyle.value);
      if (!fteApp.value) return;
      fteApp.value.communication("resize");
      updatePeriodictable();
    }, 100);
  }
);

// 监听配置变化
watch(
  () => option.value,
  () => {
    updatePeriodictable();
  },
  { deep: true }
);

// 初始化场景
onMounted(() => {
  initData();
});

onBeforeUnmount(() => {
  fteApp.value = null;
});
defineExpose({
  initData
});
</script>

<style lang="scss" scoped>
.ft-periodictable {
  .container {
    background-color: transparent;
    .threeScene {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
