<template>
  <div class="markdown-content" v-html="parsed" />
</template>

<script setup lang="ts">
import { computed } from "vue";

import { marked } from "marked";

const props = defineProps<{ content: string }>();

const parsed = computed(() => marked.parse(props.content) as string);
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.markdown-content {
  width: 100%;
  color: inherit;

  :deep(p) {
    line-height: 1.6;
    word-break: break-word;
    overflow-wrap: break-word;
    margin: 6px 0;
  }

  :deep(ol),
  :deep(ul) {
    margin: 6px 0;
    padding-left: 1.5em;
  }

  :deep(li) {
    line-height: 1.6;
    margin: 4px 0;
  }

  :deep(ol > li) {
    list-style: decimal;
  }

  /* 内联代码：单反引号 `code` → <code> */
  :deep(:not(pre) > code) {
    border-radius: 3px;
    padding: 1px 5px;
    background-color: $color-bg-inline-code;
    font-size: 0.9em;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  /* 代码块：三反引号 → <pre><code> */
  :deep(pre) {
    margin: 5px 0;
    border-radius: 3px;
    background-color: $color-bg-code-block;
    overflow-x: auto;

    > code {
      display: block;
      padding: 10px;
      line-height: 1.5;
      tab-size: 4;
      text-align: left;
      white-space: pre;
      word-break: normal;
      word-spacing: normal;
      word-wrap: normal;
      -webkit-hyphens: none;
      hyphens: none;
      background: none;
    }
  }

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 8px 0 6px;
    font-weight: 600;
  }
  :deep(img) {
    max-width: 100px;
    height: auto;
    margin: 5px 6px;
  }
}
</style>
