<template>
  <SwCollapseItem
    ref="innerRef"
    v-bind="props"
    @update:modelValue="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
  >
    <template #title v-if="$slots.title">
      <slot name="title" />
    </template>
    <template #content v-if="$slots.content">
      <slot name="content" />
    </template>
    <template #icon v-if="$slots.icon">
      <slot name="icon" />
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { ref } from "vue";

import type { FtCollapseItemProps } from "@screenwright/ui/collapse-item";
import { SwCollapseItem, FtCollapseItemEmits } from "@screenwright/ui/collapse-item";

defineOptions({
  name: "SwCollapseItem",
  inheritAttrs: true
});

const props = defineProps<FtCollapseItemProps>();
const emit = defineEmits(FtCollapseItemEmits);

// 透传内部 SwCollapseItem 实例
const innerRef = ref<InstanceType<typeof SwCollapseItem> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
