<template>
  <div>
    <div
      class="markdown-view"
      :style="{
        color: color
      }"
      v-html="markdownContent"
    />
  </div>
</template>

<script setup lang="ts">
import { marked } from "marked";
import { ref, watch } from "vue";

interface Props {
  content?: string;
  typingSpeed?: number;
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  content: "ScreenwrightBI 可视化平台 \n ## title \n ```npm install npm build```",
  typingSpeed: 25,
  color: "#bfbfbf"
});

const displayedText = ref("");
const showCompiled = ref(false);
const currentIndex = ref(0);
const markdownContent = ref("");
const timer = ref<number | null>(null);

const typeText = () => {
  if (timer.value) window.clearTimeout(timer.value);

  if (currentIndex.value < props.content.length && props.typingSpeed) {
    displayedText.value += props.content[currentIndex.value];
    currentIndex.value++;
    if (timer.value) window.clearTimeout(timer.value);
    timer.value = window.setTimeout(typeText, props.typingSpeed);
  } else {
    showCompiled.value = true;
    timer.value = null;
  }
};

watch(
  () => props.content,
  (nv) => {
    if (nv.length > 0 && props.typingSpeed > 0) {
      typeText();
    } else {
      displayedText.value = props.content;
    }
  },
  {
    immediate: true
  }
);

watch(
  () => displayedText.value,
  (nv) => {
    markdownContent.value = marked.parse(nv, { async: false });
  },
  { immediate: true }
);
</script>

<style lang="scss">
.markdown-view {
  width: 100%;
  & > p {
    line-height: 1.5;
    word-break: break-all;
  }
  code {
    word-wrap: normal;
    background: none;
    -webkit-hyphens: none;
    hyphens: none;
    line-height: 1.5;
    tab-size: 4;
    text-align: left;
    white-space: pre;
    word-break: normal;
    word-spacing: normal;
    border-radius: 3px;
    padding: 10px 10px;
    margin: 5px 0;
    display: inline-block;
    background-color: rgba(26, 30, 39, 1);
    width: calc(100% - 20px);
    overflow-x: auto;
  }
}
</style>
