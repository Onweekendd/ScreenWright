<template>
  <span
    ref="textRef"
    class="ft-text-text"
    :style="getTextStyle"
    @blur="$emit('blur')"
    v-html="inputValue"
    :data-translate="inputValue"
  />
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

import type { ComponentType } from "@screenwright/types";

import { isObject } from "lodash-es";

defineOptions({
  name: "TextNormal"
});

const props = defineProps<{
  element: ComponentType;
  getTextStyle: CSSProperties;
  formatValue: (raw: unknown) => string;
  inputData: any;
}>();

defineEmits<{
  (e: "blur"): void;
}>();

const textRef = ref<HTMLElement | null>(null);
const inputValue = computed(() => {
  const raw = isObject(props.inputData) ? (props.inputData as any).value : props.inputData;
  return props.formatValue(raw);
});
</script>
