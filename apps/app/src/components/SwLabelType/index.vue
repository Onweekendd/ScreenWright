<template>
  <SwLabelType
    ref="innerRef"
    v-bind="props"
    @update:modelValue="emit('update:modelValue', $event)"
    @change="(key, value) => emit('change', key, value)"
  />
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtLabelTypeProps } from "@screenwright/ui/label-type";
import { SwLabelType, FtLabelTypeEmits } from "@screenwright/ui/label-type";

defineOptions({
  name: "SwLabelType",
  inheritAttrs: true
});

const props = defineProps<FtLabelTypeProps>();
const emit = defineEmits(FtLabelTypeEmits);

// 透传内部 SwLabelType 实例
const innerRef = ref<InstanceType<typeof SwLabelType> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
