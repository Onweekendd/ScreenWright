<template>
  <div class="table-head" :style="tableHeadStyle" v-if="headerShow">
    <div :class="`list-item ${borderShow ? 'border-show' : 'border-hide'}`">
      <span
        v-for="(field, index) in listLabel"
        :key="field.value"
        :style="listItemStyle(index)"
        :data-translate="field.name"
      >
        {{ field.name }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed } from "vue";

import { setMinioUrl } from "@material/minioUrl";

import type { Option } from "../types";

const props = defineProps<{ option: Option; listLabel: { name: string; value: string }[] }>();

const headerShow = computed(() => props.option.headerShow);
const borderShow = computed(() => props.option.borderShow);

const tableHeadStyle = computed(() => ({
  background:
    props.option.backgroundType === "custom"
      ? `url(${setMinioUrl(props.option.backgroundImage)}) no-repeat center/cover`
      : props.option.headerBackground,
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  backgroundPosition: "center",
  height: props.option.headerlineHeight + "px",
  lineHeight: props.option.headerlineHeight + "px",
  fontSize: props.option.headerFontSize + "px",
  textAlign: props.option.headerTextAlign,
  fontFamily: props.option.headerFontFamily,
  letterSpacing: props.option.headerletterSpacing + "px",
  fontStyle: props.option.headerFontStyle,
  fontWeight: props.option.headerFontWeight,
  color: props.option.headerColor
}));

const listItemStyle = (index: number): CSSProperties => {
  return {
    pointerEvents: "none",
    display: "inline-block",
    width: `${
      props.option.rowShow && index === 0
        ? props.option.rowWidth
        : props.option.seriesYWidth[`${props.option.rowShow ? index - 1 : index}`]
    }px`,
    marginLeft: `${
      props.option.rowShow && index === 0
        ? props.option.rowSpace
        : props.option.seriesYMarginLeft[`${props.option.rowShow ? index - 1 : index}`]
    }px`,
    lineHeight: props.option.headerHeight
  };
};
</script>

<style lang="scss" scoped></style>
