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
.control-item {
  box-sizing: border-box;
  height: 100%;
  // 不写死宽度，按内容自适应（padding 提供留白），避免短标签左右空一大片
  min-width: 56px;
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
  padding: 0 12px;
  color: #b4b7c1;
  background-image: url("@/assets/image/button/top_bt_normal.png");
  background-repeat: no-repeat;
  background-size: 100% 100%;
  cursor: pointer;

  &.active {
    background-image: url("@/assets/image/button/top_bt_select.png");
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
    height: 46px;
    padding: 0;
    gap: 0;
    background-size: 100% 100%;
  }
}
</style>
