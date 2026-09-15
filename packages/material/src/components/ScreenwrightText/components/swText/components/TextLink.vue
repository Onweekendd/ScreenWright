<template>
  <span v-if="props.isBuild" ref="textRef" class="ft-text-text" :style="getTextStyle" @blur="$emit('blur')">
    {{ props.inputData }}
  </span>
  <a
    v-else
    ref="textRef"
    class="ft-text-text"
    :href="props.linkHref"
    :style="getTextStyle"
    :target="props.linkTarget"
    @blur="$emit('blur')"
    v-html="props.inputData"
    :data-translate="props.inputData"
  />
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { ref } from "vue";

import type { ComponentType } from "@screenwright/types";

defineOptions({
  name: "TextLink"
});

const props = defineProps<{
  element: ComponentType;
  getTextStyle: CSSProperties;
  inputData: any;
  isBuild: boolean;
  linkHref: string;
  linkTarget: string;
}>();

defineEmits<{
  (e: "blur"): void;
}>();

const textRef = ref<HTMLElement | null>(null);
</script>
<style lang="scss" scoped>
.ft-text-text {
  text-decoration: none;
}
</style>
