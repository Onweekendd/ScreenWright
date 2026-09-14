<template>
  <div class="action-item flex flex-center" :class="{ active: isActive, 'is-disabled': disabled }">
    <el-tooltip :content="content">
      <Icon :type="type" size="18" />
    </el-tooltip>
  </div>
</template>
<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";

interface Props {
  type: string;
  content: string;
  disabled?: boolean;
  isActive?: boolean;
}
defineProps<Props>();
</script>
<style lang="scss" scoped>
@import "src/style/theme.scss";
.action-item {
  width: 25px;
  height: 25px !important;
  text-align: center;
  line-height: 25px !important;
  background-color: transparent !important;
  color: $sw-text-dim;
  font-size: 12px;
  margin-right: 4px;
  border-radius: 5px;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;
  &:hover:not(.is-disabled):not(.active) {
    background-color: $sw-hover-bg !important;
    color: $sw-text-strong;
  }
  &.active {
    background-color: $sw-active-bg !important;
    color: var(--sw-theme-color);
  }
  &.is-disabled {
    opacity: 0.25;
    cursor: not-allowed;
    background: 0 0 !important;
  }
}
</style>
