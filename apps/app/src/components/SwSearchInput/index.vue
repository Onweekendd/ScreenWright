<template>
  <SwSearchInput
    ref="innerRef"
    v-bind="props"
    @update:modelValue="emit('update:modelValue', $event)"
    @select="emit('select', $event)"
    @change="emit('change', $event)"
    @clear="emit('clear')"
  />
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtSearchInputProps } from "@screenwright/ui/search-input";
import { SwSearchInput, FtSearchInputEmits } from "@screenwright/ui/search-input";

defineOptions({
  name: "SwSearchInput",
  inheritAttrs: true
});

const props = defineProps<FtSearchInputProps>();
const emit = defineEmits(FtSearchInputEmits);

// 透传内部 SwSearchInput 实例
const innerRef = ref<InstanceType<typeof SwSearchInput> | null>(null);
defineExpose({
  focus: () => {
    // 通过 instance 调用内部组件的 focus 方法
    const instance = innerRef.value as any;
    if (instance?.focus) {
      instance.focus();
    }
  },
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
