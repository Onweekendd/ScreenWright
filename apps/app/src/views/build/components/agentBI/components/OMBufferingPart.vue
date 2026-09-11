<template>
  <div class="om-part" :class="[`is-${status}`]">
    <button class="om-toggle" @click="status !== 'pending' && (open = !open)">
      <span class="om-icon">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <ellipse cx="6" cy="3" rx="4" ry="1.5" stroke="currentColor" stroke-width="1.1" />
          <path d="M2 3v6c0 .83 1.79 1.5 4 1.5s4-.67 4-1.5V3" stroke="currentColor" stroke-width="1.1" />
          <path d="M2 6c0 .83 1.79 1.5 4 1.5S10 6.83 10 6" stroke="currentColor" stroke-width="1.1" />
        </svg>
      </span>
      <span class="om-label">
        <span class="om-op">{{ operationLabel }}</span>
        <span class="om-status-text">{{ statusLabel }}</span>
      </span>
      <span v-if="status === 'pending'" class="om-dots"> <span /><span /><span /> </span>
      <span v-else class="om-chevron" :class="{ 'is-open': open }">
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

    <transition name="om-expand">
      <div v-if="open && status !== 'pending'" class="om-body">
        <!-- Done -->
        <template v-if="status === 'done' && endData">
          <div class="om-stats">
            <span class="om-stat">
              <span class="om-stat__label">耗时</span>
              <span class="om-stat__value">{{ endData.durationMs }}ms</span>
            </span>
            <span class="om-stat">
              <span class="om-stat__label">压缩</span>
              <span class="om-stat__value">{{ endData.tokensBuffered }} → {{ endData.bufferedTokens }} tokens</span>
            </span>
          </div>
          <div v-if="endData.observations" class="om-observations">
            <span class="om-observations__label">记忆摘要</span>
            <pre class="om-observations__content">{{ endData.observations }}</pre>
          </div>
        </template>

        <!-- Failed -->
        <template v-else-if="status === 'failed' && failedData">
          <div class="om-stats">
            <span class="om-stat">
              <span class="om-stat__label">耗时</span>
              <span class="om-stat__value">{{ failedData.durationMs }}ms</span>
            </span>
          </div>
          <div class="om-error">{{ failedData.error }}</div>
        </template>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

export interface OmStartData {
  cycleId: string;
  operationType: "observation" | "reflection";
  startedAt: string;
  tokensToBuffer: number;
}

export interface OmEndData {
  cycleId: string;
  operationType: "observation" | "reflection";
  completedAt: string;
  durationMs: number;
  tokensBuffered: number;
  bufferedTokens: number;
  observations: string;
}

export interface OmFailedData {
  cycleId: string;
  operationType: "observation" | "reflection";
  failedAt: string;
  durationMs: number;
  error: string;
}

const props = defineProps<{
  startData?: OmStartData;
  endData?: OmEndData;
  failedData?: OmFailedData;
}>();

const open = ref(false);

const status = computed<"pending" | "done" | "failed">(() => {
  if (props.endData) return "done";
  if (props.failedData) return "failed";
  return "pending";
});

const operationType = computed(
  () => props.endData?.operationType ?? props.failedData?.operationType ?? props.startData?.operationType
);

const operationLabel = computed(() => (operationType.value === "reflection" ? "反思" : "观察"));

const statusLabel = computed(() => {
  if (status.value === "done") return "记忆已压缩";
  if (status.value === "failed") return "记忆压缩失败";
  return "后台压缩记忆";
});
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.om-part {
  display: inline-flex;
  flex-direction: column;
  gap: 0;
}

.om-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px 3px 6px;
  border: 1px solid $color-primary-20;
  border-radius: 12px;
  background: $color-primary-5;
  color: $color-text-dim;
  font-size: 11px;
  cursor: default;
  user-select: none;
  width: fit-content;
  transition:
    background $transition-fast,
    color $transition-fast,
    border-color $transition-fast;

  .is-done &,
  .is-failed & {
    cursor: pointer;
    &:hover {
      background: $color-primary-10;
      border-color: $color-primary-35;
      color: $color-text-muted;
    }
  }

  .is-failed & {
    border-color: rgba(255, 100, 100, 0.25);
    color: rgba(255, 130, 130, 0.8);
  }
}

.om-icon {
  display: flex;
  align-items: center;
  color: $color-primary-60;

  .is-failed & {
    color: rgba(255, 100, 100, 0.6);
  }
}

.om-label {
  display: flex;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.3px;
}

.om-op {
  font-size: 10px;
  padding: 0px 4px;
  border-radius: 4px;
  color: $color-text-user-bubble;

  .is-failed & {
    background: rgba(255, 100, 100, 0.1);
    color: rgba(255, 130, 130, 0.8);
  }
}

.om-chevron {
  display: flex;
  align-items: center;
  color: $color-primary-50;
  transition: transform $transition-fast;

  &.is-open {
    transform: rotate(180deg);
  }
}

/* 三点 loading 动画 */
.om-dots {
  display: flex;
  align-items: center;
  gap: 2px;

  span {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: $color-primary-50;
    animation: om-dot-bounce 1.2s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes om-dot-bounce {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 展开内容 */
.om-body {
  margin-top: 4px;
  padding: 6px 8px;
  border-left: 2px solid $color-primary-20;
  border-radius: 0 4px 4px 0;
  background: $color-primary-5;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .is-failed & {
    border-left-color: rgba(255, 100, 100, 0.2);
  }
}

.om-stats {
  display: flex;
  gap: 12px;
}

.om-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;

  &__label {
    color: $color-text-dim;
  }

  &__value {
    color: $color-text-muted;
    font-family: $font-monospace;
  }
}

.om-observations {
  display: flex;
  flex-direction: column;
  gap: 3px;

  &__label {
    font-size: 10px;
    color: $color-text-dim;
    letter-spacing: 0.3px;
  }

  &__content {
    margin: 0;
    padding: 6px 8px;
    background: $color-bg-code;
    border: 1px solid $color-primary-10;
    border-radius: 4px;
    color: $color-code-text;
    font-family: $font-monospace;
    font-size: 11px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 200px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: $color-primary-25;
      border-radius: 2px;
    }
  }
}

.om-error {
  font-size: 11px;
  color: rgba(255, 130, 130, 0.9);
  font-family: $font-monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.om-expand-enter-active,
.om-expand-leave-active {
  transition:
    max-height 0.25s ease,
    opacity 0.2s ease;
  max-height: 400px;
  opacity: 1;
}

.om-expand-enter-from,
.om-expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
