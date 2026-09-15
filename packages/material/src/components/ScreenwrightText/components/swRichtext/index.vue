<template>
  <div class="ft-richtext" :style="containerStyle">
    <div ref="richtextRef" class="richtext-container" v-html="htmlText" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { ComponentType } from "@screenwright/types";

import { useBaseData } from "@screenwright/composables";

import { sleep } from "./../utils";

interface Props {
  element: ComponentType;
}
defineOptions({
  name: "ftRichtext"
});
const props = defineProps<Props>();
const { width, height, option } = useBaseData(props.element);

// 编辑器 DOM 引用
const richtextRef = ref<HTMLElement | null>(null);

// 容器样式
const containerStyle = computed(() => ({
  width: width.value,
  height: height.value
}));

// 将 HTML 标签替换为 '^' 的纯文本序列（派生自 content）
const textTotal = computed(() => option.value.content.replace(/<.+?>/g, "^"));
// 从内容中提取的 HTML 标签列表（派生自 content）
const textLabels = computed<string[]>(() => option.value.content.match(/<.+?>/g) ?? []);

const htmlText = ref("");
const bufferedHtml = ref("");
const currentIndex = ref(0);
const textLabelIndex = ref(0);

const resetAnimationState = () => {
  htmlText.value = "";
  bufferedHtml.value = "";
  currentIndex.value = 0;
  textLabelIndex.value = 0;
};

const renderText = () => {
  const textAniType = option.value.textAnimationType;
  const aniTime = textAniType === "typingEffect" ? option.value.textAnimationTiming : 0;

  if (currentIndex.value < textTotal.value.length) {
    switch (textAniType) {
      case "typingEffect":
        htmlText.value +=
          textTotal.value[currentIndex.value] === "^"
            ? textLabels.value[textLabelIndex.value]
            : textTotal.value[currentIndex.value];
        break;
      case "jumpingEffect":
      case "fallingEffect":
        bufferedHtml.value +=
          textTotal.value[currentIndex.value] === "^"
            ? textLabels.value[textLabelIndex.value]
            : `<span
                  class="${textAniType}"
                  style="animation-delay: ${currentIndex.value * (option.value.textAnimationTiming / 1000)}s">
                    ${textTotal.value[currentIndex.value]}
                </span>`;
        break;
    }
    if (textTotal.value[currentIndex.value] === "^") {
      textLabelIndex.value++;
    }
    currentIndex.value++;
    if (textAniType) {
      setTimeout(renderText, aniTime);
    }
  } else {
    if (bufferedHtml.value) {
      htmlText.value = bufferedHtml.value;
    }
  }
};

const loadContent = async () => {
  const textAniType = option.value.textAnimationType;
  await sleep(option.value.textAnimationDelay || 0);
  if (textAniType) {
    resetAnimationState();
    renderText();
  } else {
    htmlText.value = option.value.content;
  }
};

watch(
  [
    () => option.value.content,
    () => option.value.textAnimationType,
    () => option.value.textAnimationTiming,
    () => option.value.textAnimationDelay
  ],
  () => {
    loadContent();
  },
  { immediate: true }
);
</script>

<style lang="scss">
.richtext-container {
  height: 100%;
  color: #ffffff;

  .jumpingEffect {
    display: inline-block;
    opacity: 0;
    animation: jumping 0.5s ease forwards;
  }
  @keyframes jumping {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  .fallingEffect {
    display: inline-block;
    opacity: 0;
    transform: translateY(-50px);
    animation: falling 0.5s forwards;
  }

  @keyframes falling {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>
