<template>
  <span
    v-for="(item, index) in dataArray"
    :key="index"
    ref="textRef"
    class="ft-text-text"
    :style="getTextStyle"
    @blur="$emit('blur', index as number)"
    v-html="formatValue(item.value)"
    :data-translate="formatValue(item.value)"
    contenteditable
    :data-editid="element.id"
  />
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { ref, watch } from "vue";

import type { ComponentType } from "@screenwright/types";

defineOptions({
  name: "TextArray"
});
const props = defineProps<{
  element: ComponentType;
  getTextStyle: CSSProperties;
  formatValue: (raw: unknown) => string;
  inputData: any;
}>();
defineEmits<{
  (e: "blur", index: number): void;
}>();
const textRef = ref<HTMLElement[]>([]);
const dataArray = ref<Array<any>>([]);

watch(
  () => props.inputData,
  (nVal) => {
    const targetElement = document.querySelector(`[data-editid='${props.element.id}']`);
    if (targetElement && targetElement instanceof HTMLElement) {
      let isContenteditable = targetElement.getAttribute("data-contenteditable");
      if (isContenteditable !== "true") {
        dataArray.value = Array.isArray(nVal) ? nVal : [];
      }
    } else {
      dataArray.value = Array.isArray(nVal) ? nVal : [];
    }
  },
  { immediate: true }
);
</script>
