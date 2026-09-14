<template>
  <div
    class="control-item flex flex-justify-center flex-align-center"
    :class="{ active: isActive, 'is-compact': compact }"
    :title="compact ? name : undefined"
  >
    <Icon :type="type" :size="compact ? 18 : 20" class="control-item-icon" />
    <span v-if="!compact" class="control-item-desc">
      <span class="control-item-name">{{ name }}</span>
      <span v-if="enName" class="control-item-en">{{ enName }}</span>
    </span>
  </div>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";

interface ControlItemProps {
  isActive?: boolean;
  name: string;
  enName?: string;
  type: string;
  /** 紧凑模式：只留小图标（顶栏一行放不下时启用），中文名走 title 提示 */
  compact?: boolean;
}
defineProps<ControlItemProps>();
</script>
<style lang="scss" scoped>
@import "src/style/theme.scss";
.control-item {
  box-sizing: border-box;
  height: 46px;
  // 不写死宽度，按内容自适应（padding 提供留白），避免短标签左右空一大片
  min-width: 56px;
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
  padding: 0 12px;
  color: $sw-text-dim;
  background-color: $sw-surface-2;
  border: 1px solid $sw-border;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover:not(.active) {
    background-color: $sw-hover-bg;
    border-color: color-mix(in srgb, var(--sw-theme-color) 40%, $sw-border);
    color: $sw-text-strong;
  }

  &.active {
    border-color: transparent;
    background-color: transparent;
    background-image: linear-gradient(
      135deg,
      color-mix(in srgb, var(--sw-theme-color) 72%, white) 0%,
      var(--sw-theme-color) 48%,
      color-mix(in srgb, var(--sw-theme-color) 78%, black) 100%
    );
    box-shadow: 0 4px 12px color-mix(in srgb, var(--sw-theme-color) 28%, transparent);
    color: #fff;
  }

  .control-item-desc {
    display: flex;
    flex-direction: column;
    justify-content: center;
    line-height: 1.15;
    white-space: nowrap;
  }
  .control-item-name {
    font-size: 12px;
  }
  .control-item-en {
    font-size: 9px;
    opacity: 0.7;
  }

  // 紧凑模式：只留图标，正方形按钮，尺寸与右侧关闭按钮一致
  &.is-compact {
    width: 46px;
    min-width: 46px;
    padding: 0;
    gap: 0;
  }
}
</style>
