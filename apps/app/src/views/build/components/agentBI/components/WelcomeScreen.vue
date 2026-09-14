<template>
  <Transition name="welcome">
    <div v-if="isVisible" class="welcome-screen">
      <div class="welcome-content">
        <div class="welcome-glow" />

        <div class="welcome-header animate-item" style="--i: 0">
          <span class="header-emoji">🎉</span>
          <h2 class="welcome-title">欢迎使用 Screenwright AI 创作智能体！</h2>
        </div>

        <p class="welcome-desc animate-item" style="--i: 1">
          您可以直接用自然语言描述大屏创作需求，例如说明行业场景、布局样式、视觉风格、所需组件、使用用途。
        </p>

        <div class="welcome-guide animate-item" style="--i: 2">
          <div class="guide-title">
            <span class="guide-emoji">📝</span>
            <span>操作流程指引如下：</span>
          </div>
          <ul class="guide-steps">
            <li v-for="(step, idx) in steps" :key="idx" class="guide-step">
              <span class="step-bullet">▪</span>
              <span>{{ step }}</span>
            </li>
          </ul>
        </div>

        <p class="welcome-cta animate-item" style="--i: 3">
          <span class="cta-emoji">💡</span>
          请说出您的大屏创作需求，开始创作吧！
        </p>

        <div class="welcome-examples animate-item" style="--i: 4">
          <button
            v-for="(ex, idx) in examples"
            :key="idx"
            class="example-btn"
            :style="{ '--btn-delay': `${idx * 0.06}s` }"
            @click="$emit('select', ex.prompt)"
          >
            {{ ex.label }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { WelcomeExample } from "../hooks/useWelcomeScreen";

defineProps<{
  isVisible: boolean;
  examples: WelcomeExample[];
  steps: string[];
}>();

defineEmits<{
  select: [prompt: string];
}>();
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.welcome-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 4px;
  min-height: 100%;
}

.welcome-content {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.welcome-glow {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  height: 180px;
  background: radial-gradient(ellipse at center, $color-primary-18 0%, transparent 70%);
  pointer-events: none;
  animation: glow-pulse 3s ease-in-out infinite alternate;
}

@keyframes glow-pulse {
  from {
    opacity: 0.6;
    transform: translateX(-50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1.05);
  }
}

.animate-item {
  animation: slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: calc(var(--i) * 0.07s);
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-header {
  display: flex;
  align-items: center;
  gap: 8px;

  .header-emoji {
    font-size: 20px;
    line-height: 1;
    flex-shrink: 0;
  }

  .welcome-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: $color-primary-name;
    line-height: 1.4;
    background: linear-gradient(135deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.welcome-desc {
  margin: 0;
  font-size: 12px;
  color: $color-text-muted;
  line-height: 1.7;
  padding: 10px 14px;
  background: $color-primary-5;
  border: 1px solid $color-primary-18;
  border-radius: 8px;
}

.welcome-guide {
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid $color-lp-20;
  border-radius: 8px;

  .guide-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: $color-text-secondary;
    margin-bottom: 8px;

    .guide-emoji {
      font-size: 14px;
      line-height: 1;
    }
  }

  .guide-steps {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .guide-step {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 12px;
    color: $color-text-dim;
    line-height: 1.6;

    .step-bullet {
      color: $color-primary-60;
      flex-shrink: 0;
      margin-top: 1px;
    }
  }
}

.welcome-cta {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: $color-text-secondary;

  .cta-emoji {
    font-size: 14px;
    line-height: 1;
    flex-shrink: 0;
  }
}

.welcome-examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.example-btn {
  width: 100%;
  padding: 9px 14px;
  text-align: left;
  font-size: 12px;
  color: $color-primary-name;
  background: $color-lp-15;
  border: 1px solid $color-lp-30;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background $transition-fast,
    border-color $transition-fast,
    box-shadow $transition-fast,
    transform $transition-fast;
  animation: slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: calc(0.28s + var(--btn-delay));
  line-height: 1.5;

  &:hover {
    background: $color-lp-25;
    border-color: $color-lp-55;
    box-shadow: 0 0 12px $color-primary-20;
    transform: translateX(3px);
  }

  &:active {
    transform: translateX(1px);
    background: $color-lp-35;
  }
}

// Transition
.welcome-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.welcome-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.welcome-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.welcome-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
