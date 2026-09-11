<template>
  <SwInputNumber
    ref="innerRef"
    v-bind="props"
    @update:modelValue="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtInputNumberProps } from "@screenwright/ui/input-number";
import { SwInputNumber, FtInputNumberEmits } from "@screenwright/ui/input-number";

defineOptions({
  name: "SwInputNumber",
  inheritAttrs: true
});

const props = withDefaults(defineProps<FtInputNumberProps>(), {
  isInputChange: true
});
const emit = defineEmits(FtInputNumberEmits);

// 透传内部 SwInputNumber 实例
const innerRef = ref<InstanceType<typeof SwInputNumber> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
