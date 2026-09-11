<template>
  <SwRadio
    ref="innerRef"
    v-bind="props"
    @update:modelValue="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
  />
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtRadioProps } from "@screenwright/ui/radio";
import { SwRadio, FtRadioEmits } from "@screenwright/ui/radio";

defineOptions({
  name: "SwRadio",
  inheritAttrs: true
});

const props = defineProps<FtRadioProps>();
const emit = defineEmits(FtRadioEmits);

// 透传内部 SwRadio 实例
const innerRef = ref<InstanceType<typeof SwRadio> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
