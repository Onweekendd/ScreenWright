<template>
  <SwCoordinateTabs
    ref="innerRef"
    v-bind="props"
    @update:modelValue="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
  />
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtCoordinateTabsProps } from "@screenwright/ui/coordinate-tabs";
import { SwCoordinateTabs, FtCoordinateTabsEmits } from "@screenwright/ui/coordinate-tabs";

defineOptions({
  name: "SwCoordinateTabs",
  inheritAttrs: true
});

const props = defineProps<FtCoordinateTabsProps>();
const emit = defineEmits(FtCoordinateTabsEmits);

// 透传内部 SwCoordinateTabs 实例
const innerRef = ref<InstanceType<typeof SwCoordinateTabs> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
