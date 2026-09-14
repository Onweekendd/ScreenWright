<template>
  <el-form-item v-bind="formItemProps" :class="computedClass" :style="cssVars" @click="handleClick">
    <template #label>
      <span v-if="isPropertyConfigured" class="status-animation-indicator">
        <span class="label-text">{{ props.label }}</span>
        <el-tooltip placement="top" :show-after="500">
          <template #content>
            <div class="tooltip-content">
              <div class="tooltip-title">此处的修改将被应用到状态动画</div>
              <div class="tooltip-properties">
                <div class="tooltip-subtitle">已配置的属性：</div>
                <div class="property-list">
                  <span v-for="property in configuredProperties" :key="property" class="property-tag">
                    {{ property }}
                  </span>
                </div>
              </div>
            </div>
          </template>
          <Icon type="QuestionFilled" size="10" style="position: relative; color: var(--sw-theme-color)" />
        </el-tooltip>
      </span>
      <span v-else class="label-text">{{ props.label }}</span>
    </template>
    <slot />
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";

import Icon from "@/components/Icon/index.vue";

import { type StatusSelectorProps, useStatusSelector } from "./hooks/useStatusSelector";

const props = withDefaults(defineProps<StatusSelectorProps>(), {
  isLocked: false
});

// 使用hook处理所有逻辑
const { formItemProps, computedClass, handleClick, isPropertyConfigured, configuredProperties } =
  useStatusSelector(props);

// 生成CSS变量用于显示label
const cssVars = computed(() => ({
  "--ctrl-tip-content": `"点击添加 ${props.label || ""} 属性"`
}));
</script>

<style lang="scss" scoped>
// 进阶表单项的样式
.advanced-form-item {
  position: relative;
  transition: all 0.5s ease;

  // 默认状态 - 普通光标，无 hover 效果
  cursor: default !important;

  // 当 Ctrl 键按下时的样式
  &.ctrl-active {
    // 只有在 Ctrl 激活 + hover 时才有效果
    &:hover {
      cursor: pointer !important;
      padding: 0 4px;
      border-radius: 4px;
      color: var(--sw-theme-color) !important;
      background-color: color-mix(in srgb, var(--sw-theme-color) 8%, transparent);
      border: 1px dashed color-mix(in srgb, var(--sw-theme-color) 50%, transparent);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);

      // 只在 hover 时屏蔽原始控件的交互 - 使用更精确的选择器
      :deep([role="button"]),
      :deep([role="checkbox"]),
      :deep([role="radio"]),
      :deep([tabindex]),
      :deep(input),
      :deep(select),
      :deep(button),
      :deep(.el-checkbox),
      :deep(.el-input),
      :deep(.el-select),
      :deep(.el-radio),
      :deep(.sw-input),
      :deep(.sw-radio),
      :deep([class*="el-"]),
      :deep([class*="ft-"]) {
        pointer-events: none;
        opacity: 0.7;
        filter: grayscale(0.3);
        transition: all 0.2s ease;
      }
    }

    // 添加一个小的视觉提示 - 放置在左上角，内容来自props中的label
    &::before {
      content: var(--ctrl-tip-content);
      position: absolute;
      top: -20px;
      left: 0;
      font-size: 10px;
      color: var(--sw-theme-color);
      background: rgba(64, 158, 255, 0.1);
      padding: 2px 4px;
      border-radius: 2px;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 1001;
      white-space: nowrap;
    }

    &:hover::before {
      opacity: 1;
    }
  }

  // 锁定状态样式
  &.locked {
    opacity: 0.6;
    pointer-events: none;

    &::after {
      content: "🔒";
      position: absolute;
      top: 5px;
      right: 5px;
      font-size: 12px;
      opacity: 0.5;
    }
  }
}

// 继承标签样式
:deep(.el-form-item__label) {
  cursor: inherit !important;
  color: inherit !important;
}

// 状态动画指示器样式
.status-animation-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .animation-icon {
    color: var(--sw-theme-color);
    font-size: 12px;
    cursor: help;
    transition: color 0.2s ease;

    &:hover {
      color: #6b46c1;
    }
  }

  .label-text {
    display: inline-block;
  }
}

.label-text {
  display: inline-block;
}

// Tooltip 内容样式
:deep(.el-tooltip__popper) {
  .tooltip-content {
    max-width: 200px;

    .tooltip-title {
      font-weight: 500;
      margin-bottom: 8px;
      color: #303133;
    }

    .tooltip-properties {
      .tooltip-subtitle {
        font-size: 12px;
        color: #606266;
        margin-bottom: 4px;
      }

      .property-list {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;

        .property-tag {
          display: inline-block;
          padding: 2px 6px;
          background-color: #f0f9ff;
          color: #0369a1;
          border: 1px solid #bae6fd;
          border-radius: 4px;
          font-size: 11px;
          line-height: 1.2;
        }
      }
    }
  }
}
</style>
