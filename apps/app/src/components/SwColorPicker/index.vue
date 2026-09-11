<template>
  <SwColorPicker
    ref="innerRef"
    v-bind="props"
    @update:color="emit('update:color', $event)"
    @update:opacity="emit('update:opacity', $event)"
    @update:modelValue="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
  />
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtColorPickerProps } from "@screenwright/ui/color-picker";
import { SwColorPicker, FtColorPickerEmits } from "@screenwright/ui/color-picker";

defineOptions({
  name: "SwColorPicker",
  inheritAttrs: true
});

const props = defineProps<FtColorPickerProps>();
const emit = defineEmits(FtColorPickerEmits);

// 透传内部 SwColorPicker 实例
const innerRef = ref<InstanceType<typeof SwColorPicker> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
