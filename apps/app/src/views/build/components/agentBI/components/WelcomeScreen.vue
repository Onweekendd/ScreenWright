<template>
  <div class="welcome-layout" :class="{ 'welcome-screen': welcomeActive, 'is-leaving': isLeaving }">
    <div class="welcome-content">
      <header v-if="welcomeActive" class="welcome-header">
        <span class="welcome-mark" aria-hidden="true">✦</span>
        <h2 class="welcome-title">今天，想做点什么？</h2>
      </header>

      <div ref="composerEl" class="composer-anchor">
        <slot />
      </div>

      <section v-if="welcomeActive" class="welcome-examples" aria-label="灵感示例">
        <button
          v-for="(ex, idx) in examples"
          :key="ex.label"
          type="button"
          class="example-btn"
          :disabled="isLeaving"
          :style="{ '--item-order': idx }"
          @click="$emit('select', ex.prompt)"
        >
          <span class="example-spark" aria-hidden="true">↗</span>
          <span>{{ ex.desc }}</span>
          <span class="example-arrow" aria-hidden="true">→</span>
        </button>
      </section>

      <ul v-if="welcomeActive" class="capability-list" aria-label="我可以帮你">
        <li v-for="item in capabilities" :key="item.title" class="capability-item">
          <span class="capability-icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="capability-copy">
            <span class="capability-title">{{ item.title }}</span>
            <span class="capability-desc">{{ item.desc }}</span>
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";

import type { WelcomeCapability, WelcomeExample } from "../hooks/useWelcomeScreen";

const props = defineProps<{
  isVisible: boolean;
  examples: WelcomeExample[];
  capabilities: WelcomeCapability[];
}>();

const emit = defineEmits<{
  select: [prompt: string];
  "transition-start": [];
  "layout-change": [isWelcome: boolean];
  "transition-end": [];
}>();

const welcomeActive = ref(props.isVisible);
const isLeaving = ref(false);
const composerEl = ref<HTMLDivElement>();
let exitTimer: ReturnType<typeof setTimeout> | undefined;
let composerAnimation: Animation | undefined;
let transitionVersion = 0;

function cancelTransition() {
  transitionVersion += 1;
  clearTimeout(exitTimer);
  composerAnimation?.cancel();
  composerAnimation = undefined;
}

watch(
  () => props.isVisible,
  (visible) => {
    cancelTransition();
    const version = transitionVersion;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (visible || reducedMotion) {
      welcomeActive.value = visible;
      isLeaving.value = false;
      emit("layout-change", visible);
      emit("transition-end");
      return;
    }

    emit("transition-start");
    isLeaving.value = true;
    exitTimer = setTimeout(async () => {
      const composer = composerEl.value;
      const before = composer?.getBoundingClientRect();
      welcomeActive.value = false;
      isLeaving.value = false;
      // 消息区先占据最终布局，等输入框落位后再淡入。
      emit("layout-change", false);
      await nextTick();
      if (version !== transitionVersion) {
        return;
      }

      const after = composer?.getBoundingClientRect();
      if (composer && before?.width && after?.width && after.height && composer.animate) {
        composerAnimation = composer.animate(
          [
            {
              transform: `translate(${before.left - after.left}px, ${before.top - after.top}px) scale(${before.width / after.width}, ${before.height / after.height})`
            },
            { transform: "none" }
          ],
          { duration: 460, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
        try {
          await composerAnimation.finished;
        } catch {
          // 清空对话、切换会话或卸载时会取消进行中的动画。
          return;
        }
      }
      if (version === transitionVersion) {
        composerAnimation = undefined;
        emit("transition-end");
      }
    }, 180);
  }
);

onBeforeUnmount(cancelTransition);
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

// 保留同一个输入框实例，切换到对话布局时延续草稿、焦点和附件状态。
.welcome-layout,
.welcome-content {
  display: contents;
}

.composer-anchor {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  min-width: 0;
  width: 100%;
  transform-origin: top left;
}

.welcome-header,
.welcome-examples,
.capability-list {
  transition:
    opacity 0.18s ease,
    translate 0.18s ease;
}

.is-leaving {
  .welcome-header,
  .welcome-examples,
  .capability-list {
    opacity: 0;
    translate: 0 -6px;
    pointer-events: none;
  }
}

.welcome-screen {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: clamp(48px, 24vh, 260px) 24px 36px;
  overflow-y: auto;
  box-sizing: border-box;
  container-type: inline-size;

  .welcome-content {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    gap: 22px;
    width: 100%;
    max-width: 640px;
    margin: 0 auto auto;
    animation: welcome-arrive 0.4s ease-out;
  }

  :deep(.box-footer) {
    min-height: 0;
    padding: 0;
  }

  :deep(.footer-input) {
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.035);
    box-shadow: 0 8px 32px -18px rgba(0, 0, 0, 0.4);
    transition:
      border-color 0.2s,
      box-shadow 0.2s;

    &:focus-within {
      box-shadow:
        0 0 0 3px $color-primary-5,
        0 8px 32px -18px rgba(0, 0, 0, 0.4);
    }
  }

  :deep(.editor) {
    min-height: 72px;
  }
}

.welcome-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 2px;
}

.welcome-mark {
  color: color-mix(in srgb, var(--sw-theme-color) 65%, #fff);
  font-size: 23px;
  line-height: 1;
  animation: mark-breathe 6s ease-in-out infinite;
}

.welcome-title {
  margin: 0;
  color: $color-text-primary;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: 0.02em;
}

.welcome-examples {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 6px;
}

.example-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 36px;
  padding: 7px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: $color-text-muted;
  font: inherit;
  font-size: 12px;
  line-height: 1.7;
  text-align: left;
  cursor: pointer;
  animation: welcome-arrive 0.4s backwards;
  animation-delay: calc(var(--item-order) * 60ms + 80ms);
  transition:
    background 0.2s,
    color 0.2s,
    transform 0.2s;

  &:hover {
    background: $color-primary-5;
    color: $color-text-primary;
    transform: translateX(3px);

    .example-spark,
    .example-arrow {
      color: $color-primary;
    }

    .example-arrow {
      opacity: 1;
      transform: translateX(2px);
    }
  }

  &:focus-visible {
    outline: 2px solid $color-primary;
    outline-offset: 2px;
  }
}

.example-spark {
  flex-shrink: 0;
  color: $color-text-dim;
  font-size: 15px;
  transition: color 0.2s;
}

.example-arrow {
  flex-shrink: 0;
  margin-left: auto;
  opacity: 0;
  transition:
    color 0.2s,
    opacity 0.2s,
    transform 0.2s;
}

.capability-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
  padding: 20px 6px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  list-style: none;
}

.capability-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.capability-icon {
  color: color-mix(in srgb, var(--sw-theme-color) 50%, #a0a8bc);
  font-size: 16px;
  line-height: 22px;
}

.capability-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.capability-title {
  color: $color-text-muted;
  font-size: 11px;
  line-height: 1.6;
}

.capability-desc {
  color: $color-text-dim;
  font-size: 10px;
  line-height: 1.6;
}

@container (max-width: 380px) {
  .welcome-content {
    gap: 18px;
  }

  .welcome-title {
    font-size: 16px;
  }

  .capability-list {
    gap: 10px;
    padding-inline: 0;
  }

  .capability-item {
    flex-direction: column;
    gap: 5px;
  }

  .example-btn {
    font-size: 11px;
  }
}

@keyframes welcome-arrive {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes mark-breathe {
  0%,
  100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: translateY(-2px) rotate(5deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
