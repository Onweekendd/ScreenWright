<template>
  <SwSingleSelect
    ref="innerRef"
    v-bind="props"
    @update:modelValue="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
    @handleSelect="(value, oldValue) => emit('handleSelect', value, oldValue)"
  />
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtSingleSelectProps } from "@screenwright/ui/single-select";
import { SwSingleSelect, FtSingleSelectEmits } from "@screenwright/ui/single-select";

defineOptions({
  name: "SwSingleSelect",
  inheritAttrs: true
});

const props = defineProps<FtSingleSelectProps>();
const emit = defineEmits(FtSingleSelectEmits);

// 透传内部 SwSingleSelect 实例
const innerRef = ref<InstanceType<typeof SwSingleSelect> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
