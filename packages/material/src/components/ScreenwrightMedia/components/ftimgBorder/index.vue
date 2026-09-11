<template>
  <div class="ft-img-border" :style="styleSizeName">
    <div :style="computedStyle" />
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed } from "vue";

import { isNil } from "lodash-es";

import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

const props = defineProps<{ element: ComponentType }>();
const { option, styleSizeName, dataChart } = useBaseData(props.element);
defineOptions({
  name: "ftImgBorder"
});
// 基础样式
const baseStyle = computed(
  (): CSSProperties => ({
    width: "100%",
    height: "100%",
    backgroundColor: option.value.backgroundColor || "rgba(180, 181, 198, 0.1)",
    backgroundClip: "padding-box",
    opacity: option.value.opacity || 0,
    filter: "blur(0px)"
  })
);

// 边框样式
const borderStyle = computed((): CSSProperties | null => {
  if (isNil(dataChart.value)) return {};

  return {
    borderImageSource: `url(${setMinioUrl(dataChart.value)})`,
    borderImageSlice: `${option.value.topWidth || 0} ${option.value.rightWidth || 0} ${option.value.bottomWidth || 0} ${
      option.value.leftWidth || 0
    }`,
    borderWidth: `${option.value.topWidth || 0}px ${option.value.rightWidth || 0}px ${
      option.value.bottomWidth || 0
    }px ${option.value.leftWidth || 0}px`,
    borderStyle: "solid",
    boxSizing: "border-box" as const
  };
});

// 合并样式
const computedStyle = computed(
  (): CSSProperties => ({
    ...baseStyle.value,
    ...borderStyle.value
  })
);
</script>

<style lang="scss" scoped>
.ft-img-border {
  position: relative;
  width: 100%;
  height: 100%;

  > div {
    width: inherit;
    height: inherit;
  }
}
</style>
