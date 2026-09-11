<template>
  <div class="reasoning-part" :class="{ 'is-open': open }">
    <button class="reasoning-toggle" @click="open = !open">
      <span class="reasoning-icon">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2" />
          <path d="M6 3.5v3M6 8v.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        </svg>
      </span>
      <span class="reasoning-label">思考过程</span>
      <span class="reasoning-chevron">
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
    </button>

    <transition name="reasoning-expand">
      <div v-if="open" class="reasoning-body">
        <MarkdownContent :content="part.text" class="reasoning-text" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import MarkdownContent from "./MarkdownContent.vue";

interface ReasoningUIPart {
  type: "reasoning";
  text: string;
  state: "done";
}

defineProps<{ part: ReasoningUIPart }>();

const open = ref(false);
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.reasoning-part {
  display: inline-flex;
  flex-direction: column;
  gap: 0;
}

.reasoning-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px 3px 6px;
  border: 1px solid $color-primary-20;
  border-radius: 12px;
  background: $color-primary-5;
  color: $color-text-dim;
  font-size: 11px;
  cursor: pointer;
  transition:
    background $transition-fast,
    color $transition-fast,
    border-color $transition-fast;
  user-select: none;
  width: fit-content;

  &:hover {
    background: $color-primary-10;
    border-color: $color-primary-35;
    color: $color-text-muted;
  }
}

.reasoning-icon {
  display: flex;
  align-items: center;
  color: $color-primary-60;
}

.reasoning-label {
  letter-spacing: 0.3px;
}

.reasoning-chevron {
  display: flex;
  align-items: center;
  color: $color-primary-50;
  transition: transform $transition-fast;

  .is-open & {
    transform: rotate(180deg);
  }
}

.reasoning-body {
  margin-top: 4px;
  padding: 4px 8px;
  border-left: 2px solid $color-primary-20;
  border-radius: 0 4px 4px 0;
  background: $color-primary-5;

  :deep(.markdown-content) {
    font-size: 12px;
    line-height: 1.35;

    &,
    * {
      line-height: 1.35 !important;
    }

    p {
      margin: 0 !important;
    }

    li > p {
      margin: 0 !important;
      display: inline;
    }

    ol {
      margin: 1px 0 !important;
      padding-left: 14px !important;
      line-height: 0 !important;
    }

    ul {
      margin: 1px 0 !important;
      padding-left: 14px !important;
      line-height: 1 !important;
    }

    li {
      margin: 0 !important;
      line-height: 1.3 !important;
    }

    pre {
      margin: 2px 0 !important;
      > code {
        padding: 4px 6px !important;
        font-size: 10px !important;
      }
    }

    code {
      font-size: 0.88em !important;
    }

    h1,
    h2,
    h3 {
      margin: 3px 0 1px !important;
      font-size: 12px !important;
    }
  }
}

.reasoning-text {
  font-size: 11px;
  line-height: 1.4;
  color: $color-text-dim;
  white-space: pre-wrap;
  word-break: break-word;
}

/* expand/collapse transition */
.reasoning-expand-enter-active,
.reasoning-expand-leave-active {
  transition:
    max-height 0.25s ease,
    opacity 0.2s ease;
  max-height: 600px;
  opacity: 1;
}

.reasoning-expand-enter-from,
.reasoning-expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
