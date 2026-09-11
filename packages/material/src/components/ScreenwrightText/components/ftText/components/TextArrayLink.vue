<template>
  <template v-for="(item, index) in dataArray" :key="index">
    <span
      v-if="props.isBuild"
      contenteditable
      :data-editid="element.id"
      ref="textRef"
      class="ft-text-text"
      :style="getTextStyle"
      @blur="$emit('blur', index)"
      v-html="item.value"
      :data-translate="item.value"
    />
    <a
      v-else
      ref="textRef"
      class="ft-text-text"
      :href="props.linkHref"
      :style="getTextStyle"
      :target="props.linkTarget"
      @blur="$emit('blur', index)"
      v-html="item.value"
      :data-translate="item.value"
    />
  </template>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { ref, watch } from "vue";

import type { ComponentType } from "@screenwright/types";

defineOptions({
  name: "TextArrayLink"
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
      console.log(nVal, "nValnValnVal");
      dataArray.value = Array.isArray(nVal) ? nVal : [];
    }
  },
  { immediate: true }
);

// 获取数据数组
// const dataArray = computed(() => {
//   return Array.isArray(props.inputData) ? props.inputData : [];
// });
</script>
<style lang="scss" scoped>
.ft-text-text {
  text-decoration: none;
}
</style>
