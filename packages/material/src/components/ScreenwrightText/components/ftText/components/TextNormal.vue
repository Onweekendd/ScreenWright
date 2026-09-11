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
  inputData: any;
}>();

defineEmits<{
  (e: "blur"): void;
}>();

const textRef = ref<HTMLElement | null>(null);
const inputValue = computed(() => {
  if (isObject(props.inputData)) {
    return (props.inputData as any).value || "";
  }
  return props.inputData || "";
});
</script>
