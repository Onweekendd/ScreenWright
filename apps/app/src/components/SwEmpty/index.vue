<template>
  <SwEmpty ref="innerRef" v-bind="props">
    <slot />
  </SwEmpty>
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtEmptyProps } from "@screenwright/ui/empty";
import { SwEmpty } from "@screenwright/ui/empty";

defineOptions({
  name: "sw-empty",
  inheritAttrs: true
});

const props = defineProps<FtEmptyProps>();

// 透传内部 SwEmpty 实例
const innerRef = ref<InstanceType<typeof SwEmpty> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
