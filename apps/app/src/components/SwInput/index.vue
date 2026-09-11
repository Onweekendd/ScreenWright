<template>
  <SwInput
    ref="innerRef"
    v-bind="props"
    @update:modelValue="emit('update:modelValue', $event)"
    @input="emit('input', $event)"
    @change="emit('change', $event)"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
    @clear="emit('clear')"
  />
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtInputProps } from "@screenwright/ui/input";
import { SwInput, FtInputEmits } from "@screenwright/ui/input";

defineOptions({
  name: "SwInput",
  inheritAttrs: true
});

const props = defineProps<FtInputProps>();
const emit = defineEmits(FtInputEmits);

// 透传内部 SwInput 实例
const innerRef = ref<InstanceType<typeof SwInput> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
