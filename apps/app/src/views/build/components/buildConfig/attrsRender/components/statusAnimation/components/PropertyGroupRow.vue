<template>
  <div class="property-group-container" v-if="propertyGroup && propertyGroup.group">
    <div class="property-group-row flex">
      <!-- 属性组标题 -->
      <div
        class="group-name"
        :style="{ width: `${groupNameWidth}px` }"
        :class="{ highlight: isHighlighted(propertyGroup.id) }"
        @click="setSelectedRow(propertyGroup)"
      >
        {{ propertyGroup.group }}
      </div>

      <!-- 属性行列表 -->
      <div class="property-list">
        <property-row v-for="(property, propIndex) in propertyGroup.children" :key="propIndex" :property="property">
          <template v-slot:property-editor="slotProps">
            <slot name="property-editor" :property="slotProps.property" :status-id="slotProps.statusId" />
          </template>
        </property-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import type { PropertyNode } from "../type";
import { useStatusAnimation } from "../useStatusAnimation";
import { PROPERTY_GROUP_WIDTH } from "../utils/constants";
import PropertyRow from "./PropertyRow.vue";

// 定义组件名称
defineOptions({
  name: "PropertyGroupRow"
});

// Props
interface Props {
  group: PropertyNode;
}
const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "row-click": [id: string];
}>();

// 使用 hooks
const statusAnimationHooks = useStatusAnimation();

// 响应式数据
const groupNameWidth = ref(PROPERTY_GROUP_WIDTH);

// 计算属性
const selectedRowId = computed(() => statusAnimationHooks.selectedRowId.value);
const propertyGroup = computed(() => props.group);

// 方法
const setSelectedRow = (row: PropertyNode) => {
  statusAnimationHooks.setSelectedRowId(row.id);
  emit("row-click", row.id);
};

const isHighlighted = (rowId: string): boolean => {
  return selectedRowId.value.includes(rowId);
};
</script>

<style lang="scss" scoped>
@import "../styles/variables";

.property-group-container {
  border-radius: 8px;
  overflow: hidden;
  background: rgba(58, 61, 79, 0.1);
  border: 1px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: groupSlideIn 0.5s ease both;
}

.property-group-row {
  display: flex;
  align-items: stretch;
}

/* 属性组标题 */
.group-name {
  background: var(--group-bg);
  margin-right: 1px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  margin-right: 2px;

  // 添加垂直分割线效果
  &::after {
    content: "";
    position: absolute;
    right: 0;
    top: 15%;
    bottom: 15%;
    width: 2px;
    background: var(--secondary-gradient);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  // 扫光效果
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--sw-theme-color) 10%, transparent) 20%,
      color-mix(in srgb, var(--sw-theme-color) 30%, transparent) 50%,
      color-mix(in srgb, var(--sw-theme-color) 10%, transparent) 80%,
      transparent 100%
    );
    transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
  }

  &:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
    transform: translateX(4px);

    &::before {
      left: 100%;
    }

    &::after {
      opacity: 1;
    }
  }

  &:active {
    transform: scale(0.98);
  }

  &.highlight {
    color: white;
    background-color: rgba(0, 142, 255, 0.1);
    background-image: linear-gradient(180deg, var(--sw-theme-color), var(--sw-theme-color)) !important;
    box-shadow: var(--shadow-group);
    position: relative;
    z-index: 10;

    // 发光边框效果
    &::after {
      content: "";
      position: absolute;
      inset: -2px;
      background: var(--success-gradient);
      border-radius: inherit;
      z-index: -1;
      opacity: 0.4;
      filter: blur(8px);
      animation: groupGlow 2s ease-in-out infinite;
    }
  }
}

.property-list {
  flex: 1;
  background: rgba(30, 33, 45, 0.15);
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
  justify-content: center;

  // 为属性列表添加内部阴影
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
    pointer-events: none;
    border-radius: inherit;
  }
}

// 通用样式类
.flex {
  display: flex;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.label-overflow-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 动画定义
@keyframes groupSlideIn {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes groupGlow {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.03);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .property-group-container {
    margin-bottom: 4px;

    .group-name {
      padding: 8px 12px;
      font-size: 12px;
      min-height: 32px;
    }
  }
}

// 减少动画的可访问性设置
@media (prefers-reduced-motion: reduce) {
  .property-group-container {
    animation: none;
  }

  .group-name {
    transition: background-color 0.2s ease;

    &::before {
      display: none;
    }
  }

  @keyframes groupGlow {
    to {
      opacity: 0.6;
    }
  }
}
</style>
