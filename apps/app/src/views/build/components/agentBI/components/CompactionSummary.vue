<template>
  <div class="compaction-summary" :class="{ 'is-open': open }">
    <button class="summary-divider" :aria-expanded="open" @click="open = !open">
      <span class="divider-line" />
      <span class="summary-toggle">
        <span class="summary-icon">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 3.5h8M3.5 6h5M5 8.5h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
          </svg>
        </span>
        <span class="summary-label">上下文已压缩</span>
        <span v-if="hint" class="summary-hint">{{ hint }}</span>
        <span class="summary-chevron">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2.5 3.5L5 6l2.5-2.5"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </span>
      <span class="divider-line" />
    </button>

    <transition name="summary-expand">
      <div v-if="open" class="summary-body">
        <p class="summary-note">以上对话已由下面这份摘要替代，AI 之后只看得到摘要，看不到原消息。</p>
        <MarkdownContent :content="body" class="summary-text" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import type { UIMessage } from "ai";

import { summaryBody, summaryStats } from "../hooks/message/compactionSummary";
import MarkdownContent from "./MarkdownContent.vue";

const props = defineProps<{ message: UIMessage }>();

const open = ref(false);

const body = computed(() => summaryBody(props.message));

const hint = computed(() => {
  const hidden = summaryStats(props.message)?.hiddenTokenCount;
  return hidden ? `约 ${hidden.toLocaleString()} tokens 的上文` : "";
});
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.compaction-summary {
  display: flex;
  flex-direction: column;
  margin: 10px 0;
}

.summary-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  user-select: none;
}

.divider-line {
  flex: 1;
  height: 0;
  border-top: 1px dashed $color-primary-25;
}

.summary-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px 3px 6px;
  border: 1px solid $color-primary-20;
  border-radius: 12px;
  background: $color-primary-5;
  color: $color-text-dim;
  font-size: 11px;
  white-space: nowrap;
  transition:
    background $transition-fast,
    color $transition-fast,
    border-color $transition-fast;

  .summary-divider:hover & {
    background: $color-primary-10;
    border-color: $color-primary-35;
    color: $color-text-muted;
  }
}

.summary-icon {
  display: flex;
  align-items: center;
  color: $color-primary-60;
}

.summary-label {
  letter-spacing: 0.3px;
}

.summary-hint {
  color: $color-primary-50;
}

.summary-chevron {
  display: flex;
  align-items: center;
  color: $color-primary-50;
  transition: transform $transition-fast;

  .is-open & {
    transform: rotate(180deg);
  }
}

.summary-body {
  margin-top: 8px;
  padding: 6px 10px;
  border-left: 2px solid $color-primary-20;
  border-radius: 0 4px 4px 0;
  background: $color-primary-5;
  max-height: 420px;
  overflow-y: auto;
}

.summary-note {
  margin: 0 0 4px;
  font-size: 11px;
  color: $color-primary-50;
}

.summary-text {
  font-size: 12px;
  color: $color-text-dim;
  word-break: break-word;
}

.summary-expand-enter-active,
.summary-expand-leave-active {
  transition:
    max-height 0.25s ease,
    opacity 0.2s ease;
  max-height: 420px;
  opacity: 1;
}

.summary-expand-enter-from,
.summary-expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
