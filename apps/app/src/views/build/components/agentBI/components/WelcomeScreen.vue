<template>
  <Transition name="welcome">
    <div v-if="isVisible" class="welcome-screen">
      <div class="welcome-content">
        <div class="welcome-glow" />

        <div class="welcome-header animate-item" style="--i: 0">
          <h2 class="welcome-title">你好呀，想做一块什么样的大屏？</h2>
          <p class="welcome-subtitle">说说你的想法就行，我来帮你搭建，也能帮你画素材、让画面动起来。</p>
        </div>

        <section class="welcome-section animate-item" style="--i: 1">
          <h3 class="section-label">我能帮你</h3>
          <ul class="capability-list">
            <li v-for="item in capabilities" :key="item.title" class="capability-card">
              <span class="capability-icon">{{ item.icon }}</span>
              <div class="capability-text">
                <span class="capability-title">{{ item.title }}</span>
                <span class="capability-desc">{{ item.desc }}</span>
              </div>
            </li>
          </ul>
        </section>

        <section class="welcome-section animate-item" style="--i: 2">
          <h3 class="section-label">试试这些</h3>
          <div class="welcome-examples">
            <button
              v-for="(ex, idx) in examples"
              :key="ex.label"
              class="example-btn"
              :style="{ '--btn-delay': `${idx * 0.06}s` }"
              @click="$emit('select', ex.prompt)"
            >
              <span class="example-label">{{ ex.label }}</span>
              <span class="example-tags">
                <span v-for="tag in ex.tags" :key="tag" class="example-tag" :data-tag="tag">{{ tag }}</span>
              </span>
            </button>
          </div>
        </section>

        <p class="welcome-hint animate-item" style="--i: 3">也可以直接在下面输入你的想法，或贴一张参考图。</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { WelcomeCapability, WelcomeExample } from "../hooks/useWelcomeScreen";

defineProps<{
  isVisible: boolean;
  examples: WelcomeExample[];
  capabilities: WelcomeCapability[];
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
  gap: 20px;
  position: relative;
}

// 柔和的光晕：比原来更大更淡，像背景里的一团暖光
.welcome-glow {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 360px;
  height: 220px;
  background: radial-gradient(ellipse at center, $color-primary-18 0%, transparent 70%);
  pointer-events: none;
  animation: glow-pulse 4s ease-in-out infinite alternate;
}

@keyframes glow-pulse {
  from {
    opacity: 0.55;
    transform: translateX(-50%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1.06);
  }
}

.animate-item {
  animation: slide-up 0.45s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: calc(var(--i) * 0.08s);
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
  flex-direction: column;
  gap: 8px;

  .welcome-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
    color: $color-text-primary;
  }

  .welcome-subtitle {
    margin: 0;
    font-size: 13px;
    line-height: 1.7;
    color: $color-text-muted;
  }
}

.welcome-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-label {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: $color-text-dim;
}

.capability-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.capability-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;

  .capability-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    line-height: 1;
    background: $color-primary-18;
    border-radius: 10px;
  }

  .capability-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .capability-title {
    font-size: 13px;
    font-weight: 500;
    color: $color-text-secondary;
  }

  .capability-desc {
    font-size: 12px;
    line-height: 1.6;
    color: $color-text-dim;
  }
}

.welcome-examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.example-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 14px;
  text-align: left;
  font-size: 13px;
  color: $color-text-secondary;
  background: $color-lp-15;
  border: 1px solid $color-lp-20;
  border-radius: 14px;
  cursor: pointer;
  transition:
    background $transition-fast,
    border-color $transition-fast,
    box-shadow $transition-fast,
    transform $transition-fast;
  animation: slide-up 0.45s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: calc(0.3s + var(--btn-delay));
  line-height: 1.5;

  &:hover {
    background: $color-lp-25;
    border-color: $color-lp-40;
    box-shadow: 0 4px 16px $color-primary-20;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    background: $color-lp-30;
  }
}

.example-tags {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
}

// 标签用两种柔和的色调区分：生图沿用主题色，生视频用暖桃色
.example-tag {
  padding: 1px 8px;
  font-size: 11px;
  line-height: 18px;
  border-radius: 999px;
  color: $color-primary-name;
  background: $color-primary-18;

  &[data-tag="生视频"] {
    color: #ffb98f;
    background: rgba(255, 185, 143, 0.16);
  }
}

.welcome-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: $color-text-dim;
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
