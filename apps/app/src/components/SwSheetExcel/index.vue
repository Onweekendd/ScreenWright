<template>
  <SwSheetExcel ref="innerRef" v-bind="props" @change="emit('change', $event)" @confirm="emit('confirm', $event)" />
</template>
<script setup lang="ts">
// @ts-nocheck
import { ref } from "vue";

import type { FtSheetExcelProps } from "@screenwright/ui/sheet-excel";
import { SwSheetExcel, FtSheetExcelEmits } from "@screenwright/ui/sheet-excel";

defineOptions({
  name: "sheet-excel",
  inheritAttrs: true
});

const props = defineProps<FtSheetExcelProps>();
const emit = defineEmits(FtSheetExcelEmits);

// 透传内部 SwSheetExcel 实例
const innerRef = ref<InstanceType<typeof SwSheetExcel> | null>(null);
defineExpose({
  // 暴露原始实例以覆盖更多能力（按需使用）
  get instance() {
    return innerRef.value;
  }
});
</script>
