<template>
  <SwSingleColorPicker
    ref="innerRef"
    v-bind="props"
    @update:modelValue="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
  />
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtSingleColorPickerProps } from "@screenwright/ui/single-color-picker";
import { SwSingleColorPicker, FtSingleColorPickerEmits } from "@screenwright/ui/single-color-picker";

defineOptions({
  name: "SwSingleColorPicker",
  inheritAttrs: true
});

const props = defineProps<FtSingleColorPickerProps>();
const emit = defineEmits(FtSingleColorPickerEmits);

// 透传内部 SwSingleColorPicker 实例
const innerRef = ref<InstanceType<typeof SwSingleColorPicker> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
