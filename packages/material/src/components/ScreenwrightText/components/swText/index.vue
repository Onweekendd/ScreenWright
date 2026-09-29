<!-- 文本框 -->
<template>
  <div
    class="ft-text"
    :style="{
      ...styleSizeName,
      ...setTransFormStyle,
    }"
    ref="textRef"
    @click="handleClick"
  >
    <div ref="boxRef" class="ft-text-box flex" :style="styleBox">
      <template v-if="!dataIsArray">
        <TextLink
          v-if="isLink"
          :element="element"
          :getTextStyle="getTextStyle"
          :formatValue="formatValue"
          :inputData="dataChart"
          :isBuild="isBuild.value"
          :linkHref="linkHref"
          :linkTarget="linkTarget"
        />
        <TextNormal
          v-else
          :element="element"
          :getTextStyle="getTextStyle"
          :formatValue="formatValue"
          :inputData="dataChart"
        />
      </template>
      <template v-else>
        <TextArrayLink
          v-if="isLink"
          :element="element"
          :getTextStyle="getTextStyle"
          :formatValue="formatValue"
          :inputData="dataChart"
          :isBuild="isBuild.value"
          :linkHref="linkHref"
          :linkTarget="linkTarget"
        />
        <TextArray
          v-else
          :element="element"
          :getTextStyle="getTextStyle"
          :formatValue="formatValue"
          :inputData="dataChart"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { ComponentType } from "@screenwright/types";

import TextArray from "./components/TextArray.vue";
import TextArrayLink from "./components/TextArrayLink.vue";
import TextLink from "./components/TextLink.vue";
import TextNormal from "./components/TextNormal.vue";
import { useText } from "./useText";

defineOptions({
  name: "ftText",
});

const props = defineProps<{
  element: ComponentType;
}>();

// 使用提取的hook
const {
  textRef,
  boxRef,
  styleSizeName,
  setTransFormStyle,
  dataIsArray,
  styleBox,
  getTextStyle,
  formatValue,
  handleClick,
  isLink,
  linkHref,
  linkTarget,
  dataChart,
  isBuild,
} = useText(props.element);

const opacity = computed(() => {
  return props.element.option.opacity;
});
</script>

<style lang="scss" scoped>
.ft-text {
  opacity: v-bind(opacity) !important;
  height: 100%;
  width: 100%;
  overflow: hidden;

  :deep(*) {
    outline: none;
  }
}
</style>
