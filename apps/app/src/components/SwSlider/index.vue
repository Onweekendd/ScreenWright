<template>
  <SwSlider
    ref="innerRef"
    v-bind="props"
    @update:modelValue="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
  />
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtSliderProps } from "@screenwright/ui/slider";
import { SwSlider, FtSliderEmits } from "@screenwright/ui/slider";

defineOptions({
  name: "SwSlider",
  inheritAttrs: true
});

const props = withDefaults(defineProps<FtSliderProps>(), {
  showNumberInput: true
});
const emit = defineEmits(FtSliderEmits);

// 透传内部 SwSlider 实例
const innerRef = ref<InstanceType<typeof SwSlider> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
