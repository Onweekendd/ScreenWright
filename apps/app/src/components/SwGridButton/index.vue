<template>
  <SwGridButton
    ref="innerRef"
    v-bind="props"
    @update:modelValue="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
  />
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtGridButtonProps } from "@screenwright/ui/grid-button";
import { SwGridButton, FtGridButtonEmits } from "@screenwright/ui/grid-button";

defineOptions({
  name: "SwGridButton",
  inheritAttrs: true
});

const props = defineProps<FtGridButtonProps>();
const emit = defineEmits(FtGridButtonEmits);

// 透传内部 SwGridButton 实例
const innerRef = ref<InstanceType<typeof SwGridButton> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
