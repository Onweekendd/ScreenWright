<template>
  <span v-if="props.isBuild" ref="textRef" class="ft-text-text" :style="getTextStyle" @blur="$emit('blur')">
    {{ displayValue }}
  </span>
  <a
    v-else
    ref="textRef"
    class="ft-text-text"
    :href="props.linkHref"
    :style="getTextStyle"
    :target="props.linkTarget"
    @blur="$emit('blur')"
    v-html="displayValue"
    :data-translate="displayValue"
  />
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

import type { ComponentType } from "@screenwright/types";

import { isObject } from "lodash-es";

defineOptions({
  name: "TextLink"
});

const props = defineProps<{
  element: ComponentType;
  getTextStyle: CSSProperties;
  formatValue: (raw: unknown) => string;
  inputData: any;
  isBuild: boolean;
  linkHref: string;
  linkTarget: string;
}>();

defineEmits<{
  (e: "blur"): void;
}>();

const textRef = ref<HTMLElement | null>(null);
const displayValue = computed(() => {
  const raw = isObject(props.inputData) ? (props.inputData as any).value : props.inputData;
  return props.formatValue(raw);
});
</script>
<style lang="scss" scoped>
.ft-text-text {
  text-decoration: none;
}
</style>
