<template>
  <!-- 桌面端（Tauri）自定义标题栏：替代已隐藏的系统原生标题栏（decorations: false） -->
  <div class="sw-titlebar" data-tauri-drag-region>
    <div class="sw-titlebar__title" data-tauri-drag-region>Screenwright</div>

    <div class="sw-titlebar__controls">
      <button class="sw-titlebar__btn" title="最小化" @click="onMinimize">
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <rect x="2" y="5.5" width="8" height="1" fill="currentColor" />
        </svg>
      </button>
      <button class="sw-titlebar__btn" :title="isMaximized ? '还原' : '最大化'" @click="onToggleMaximize">
        <svg v-if="!isMaximized" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <rect x="2.5" y="2.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1" />
        </svg>
        <svg v-else viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <rect x="2.5" y="3.5" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1" />
          <path d="M4.5 3.5V2.5h5v5H8.5" fill="none" stroke="currentColor" stroke-width="1" />
        </svg>
      </button>
      <button class="sw-titlebar__btn sw-titlebar__btn--close" title="关闭" @click="onClose">
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.1" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";

import type { UnlistenFn } from "@tauri-apps/api/event";
import type { Window } from "@tauri-apps/api/window";

const appWindow = shallowRef<Window | null>(null);
const isMaximized = ref(false);
let unlistenResize: UnlistenFn | null = null;

const syncMaximized = async () => {
  if (!appWindow.value) {
    return;
  }
  isMaximized.value = await appWindow.value.isMaximized();
};

onMounted(async () => {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  appWindow.value = getCurrentWindow();
  await syncMaximized();
  // 双击标题栏、拖拽贴边等也会改变最大化状态，靠 resize 事件同步图标
  unlistenResize = await appWindow.value.onResized(syncMaximized);
});

onBeforeUnmount(() => {
  unlistenResize?.();
});

const onMinimize = () => appWindow.value?.minimize();
const onToggleMaximize = () => appWindow.value?.toggleMaximize();
const onClose = () => appWindow.value?.close();
</script>

<style lang="scss" scoped>
@import "src/style/theme.scss";

.sw-titlebar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: var(--sw-titlebar-height, 32px);
  padding-left: 12px;
  background: $sw-surface-2;
  color: $sw-text-dim;
  user-select: none;
  -webkit-user-select: none;

  &__title {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    font-size: 12px;
    letter-spacing: 0.02em;
    color: $sw-text-muted;
  }

  &__controls {
    display: flex;
    height: 100%;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: $sw-text-dim;
    cursor: pointer;
    transition: background-color 0.15s ease;

    &:hover {
      background: $sw-hover-bg;
      color: $sw-text-strong;
    }

    &--close:hover {
      background: #e81123;
      color: #ffffff;
    }
  }
}
</style>
