<template>
  <div class="page-reload">
    <div :style="contentStyle" class="content-box" @click="handleClick">
      <img :style="iconStyle" :src="iconUrl" alt="" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeMount, onMounted } from "vue";

import type { ComponentType } from "@screenwright/types";

import { usePageReload } from "./usePageReload";

const props = defineProps<{
  element: ComponentType;
}>();

const { contentStyle, iconStyle, iconUrl, timeOut, timer, autoUpdateInterval, handleClick, initComponent } =
  usePageReload(props.element);

onMounted(() => {
  console.log("initComponent");
  initComponent();
});

onBeforeMount(() => {
  if (timeOut.value) clearTimeout(timeOut.value);
  if (timer.value) clearInterval(timer.value);
  if (autoUpdateInterval.value) clearInterval(autoUpdateInterval.value);
});
</script>
