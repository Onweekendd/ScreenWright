<template>
  <SwItemEmpty ref="innerRef" v-bind="props" />
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtItemEmptyProps } from "@screenwright/ui/item-empty";
import { SwItemEmpty } from "@screenwright/ui/item-empty";

defineOptions({
  name: "SwItemEmpty",
  inheritAttrs: true
});

const props = defineProps<FtItemEmptyProps>();

// 透传内部 SwItemEmpty 实例
const innerRef = ref<InstanceType<typeof SwItemEmpty> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
