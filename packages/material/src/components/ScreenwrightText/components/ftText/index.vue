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
      <template v-if="element.option.selectedTextType === 'multiGradient'">
        <TextMultiGradient
          :element="element"
          :getTextStyle="getTextStyle"
          :inputData="dataChart"
        />
      </template>
      <template v-else>
        <template v-if="!dataIsArray">
          <TextLink
            v-if="option.type === 'link'"
            :element="element"
            :getTextStyle="getTextStyle"
            :inputData="dataChart"
            :isBuild="isBuild.value"
            :linkHref="linkHref"
            :linkTarget="linkTarget"
          />
          <TextNormal
            v-else
            :element="element"
            :getTextStyle="getTextStyle"
            :inputData="dataChart"
          />
        </template>
        <template v-else>
          <TextArrayLink
            v-if="option.type === 'link'"
            :element="element"
            :getTextStyle="getTextStyle"
            :inputData="dataChart"
            :isBuild="isBuild.value"
            :linkHref="linkHref"
            :linkTarget="linkTarget"
          />
          <TextArray
            v-else
            :element="element"
            :getTextStyle="getTextStyle"
            :is-typing-effect="isTypingEffect"
            :clone-data-chart="cloneDataChart"
            :text-animation="textAnimation"
            :inputData="dataChart"
          />
        </template>
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
import TextMultiGradient from "./components/TextMultiGradient.vue";
import TextNormal from "./components/TextNormal.vue";
import { useText } from "./useText.js";

defineOptions({
  name: "ftText",
});

const props = defineProps<{
  element: ComponentType;
}>();

// 使用提取的hook
const {
  option,
  textRef,
  boxRef,
  cloneDataChart,
  styleSizeName,
  setTransFormStyle,
  dataIsArray,
  styleBox,
  isTypingEffect,
  textAnimation,
  getTextStyle,
  handleClick,
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
