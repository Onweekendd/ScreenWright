<template>
  <Transition name="welcome">
    <div v-if="isVisible" class="welcome-screen">
      <div class="welcome-content">
        <header class="welcome-header">
          <span class="welcome-eyebrow"><span class="welcome-spark" aria-hidden="true">✦</span> 从一个想法开始</span>
          <h2 class="welcome-title">把灵感，变成一块大屏</h2>
          <p class="welcome-subtitle">找真实素材、生成新画面，一起搭出可以编辑的大屏。</p>
        </header>

        <ul class="capability-list" aria-label="可以帮你做什么">
          <li v-for="item in capabilities" :key="item.title" class="capability-item">
            <span class="capability-icon" aria-hidden="true">{{ item.icon }}</span>
            <span class="capability-title">{{ item.title }}</span>
            <span class="capability-desc">{{ item.desc }}</span>
          </li>
        </ul>

        <section class="welcome-section" aria-labelledby="welcome-examples-label">
          <div class="section-heading">
            <h3 id="welcome-examples-label" class="section-label">选一个灵感试试</h3>
            <span class="section-hint">点击开始创建</span>
          </div>
          <div class="welcome-examples">
            <button
              v-for="(ex, idx) in examples"
              :key="ex.label"
              type="button"
              class="example-btn"
              @click="$emit('select', ex.prompt)"
            >
              <span class="example-index" aria-hidden="true">{{ String(idx + 1).padStart(2, "0") }}</span>
              <span class="example-body">
                <span class="example-label">{{ ex.label }}</span>
                <span class="example-desc">{{ ex.desc }}</span>
                <span class="example-tags">
                  <span v-for="tag in ex.tags" :key="tag" class="example-tag" :data-tag="tag">{{ tag }}</span>
                </span>
              </span>
              <svg class="example-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M4 10h12m-5-5 5 5-5 5"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </section>

        <p class="welcome-hint">也可以直接输入需求，或添加图片、视频作为参考。</p>
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
  min-height: 100%;
  box-sizing: border-box;
  padding: 28px 8px;
  container-type: inline-size;
}

.welcome-content {
  position: relative;
  isolation: isolate;
  width: 100%;
  max-width: 520px;
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-header {
  position: relative;

  &::before {
    content: "";
    position: absolute;
    z-index: -1;
    inset: -40px -8px -20px;
    background: radial-gradient(ellipse at 25% 25%, $color-primary-10, transparent 70%);
    pointer-events: none;
  }
}

.welcome-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: $color-text-muted;
  letter-spacing: 0.05em;
}

.welcome-spark {
  font-size: 16px;
  color: $color-primary;
}

.welcome-title {
  margin: 12px 0 8px;
  font-size: clamp(20px, 5.5cqi, 25px);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.02em;
  color: $color-text-primary;
  text-wrap: balance;
}

.welcome-subtitle {
  margin: 0;
  font-size: 12px;
  line-height: 1.8;
  color: $color-text-muted;
}

.capability-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0 0 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  list-style: none;
}

.capability-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}

.capability-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  margin-bottom: 2px;
  border: 1px solid $color-primary-18;
  border-radius: 8px;
  background: $color-primary-10;
  color: $color-primary;
  font-size: 16px;
}

.capability-title {
  color: $color-text-secondary;
  font-size: 12px;
  line-height: 1.5;
}

.capability-desc {
  color: $color-text-dim;
  font-size: 11px;
  line-height: 1.5;
}

.welcome-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.section-label {
  margin: 0;
  color: $color-text-secondary;
  font-size: 12px;
  font-weight: 500;
}

.section-hint {
  font-size: 11px;
  color: $color-text-dim;
}

.welcome-examples {
  display: grid;
  gap: 8px;
}

.example-btn {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.025);
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition:
    background $transition-fast,
    border-color $transition-fast;

  &:hover {
    border-color: $color-primary-35;
    background: $color-primary-10;

    .example-arrow {
      color: $color-text-primary;
      transform: translateX(2px);
    }
  }

  &:focus-visible {
    outline: 2px solid $color-primary;
    outline-offset: 3px;
  }

  &:active {
    background: $color-primary-18;
  }
}

.example-index {
  padding-top: 2px;
  color: $color-text-dim;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  line-height: 20px;
}

.example-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.example-label {
  color: $color-text-primary;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.6;
}

.example-desc {
  color: $color-text-muted;
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.example-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 3px;
}

.example-tag {
  padding: 1px 6px;
  border-radius: 4px;
  background: $color-primary-10;
  color: $color-text-muted;
  font-size: 10px;
  line-height: 17px;

  &[data-tag^="联网"] {
    background: rgba(108, 195, 190, 0.09);
    color: #91c8c4;
  }
}

.example-arrow {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 3px;
  color: $color-text-dim;
  transition:
    color $transition-fast,
    transform $transition-fast;
}

.welcome-hint {
  margin: -6px 0 0;
  color: $color-text-dim;
  font-size: 11px;
  line-height: 1.7;
  text-align: center;
}

@container (max-width: 300px) {
  .capability-list {
    gap: 8px;
  }

  .capability-desc {
    display: none;
  }

  .example-btn {
    gap: 8px;
    padding: 12px;
  }

  .section-hint {
    display: none;
  }
}

.welcome-enter-active,
.welcome-leave-active {
  transition: opacity $transition-base;
}

.welcome-enter-from,
.welcome-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .welcome-screen,
  .example-btn,
  .example-arrow {
    transition: none;
  }
}
</style>
