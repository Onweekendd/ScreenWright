<template>
  <div class="property-row flex">
    <div
      class="property-cell flex flex-center"
      @click="setSelectedRow"
      @contextmenu="onRightClick"
      :class="{ highlight: isHighlighted }"
      :style="{ width: `${propertyNameWidth}px` }"
    >
      <div class="label-overflow-ellipsis">{{ property.property }}</div>
    </div>
    <div class="value-cells flex">
      <div class="value-cell flex flex-center" v-for="status in statusList" :key="status.statusId">
        <slot name="property-editor" :property="property" :status-id="status.statusId" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { ElMessageBox } from "element-plus";

import type { AnimationProperty, ComponentAnimationConfig, PropertyNode } from "../type";
import { useStatusAnimation } from "../useStatusAnimation";
import { PROPERTY_NAME_WIDTH } from "../utils/constants";

// 定义组件名称
defineOptions({
  name: "PropertyRow"
});

// Props
interface Props {
  property: PropertyNode;
}
const props = defineProps<Props>();

// 使用 hooks
const statusAnimationHooks = useStatusAnimation();

// 响应式数据
const propertyNameWidth = ref(PROPERTY_NAME_WIDTH);

// 计算属性
const selectedRowId = computed(() => statusAnimationHooks.selectedRowId.value);
const statusList = computed(() => statusAnimationHooks.getCurrentStatusList.value);
const isHighlighted = computed(() => selectedRowId.value.includes(props.property.id));

// 方法
const setSelectedRow = () => {
  statusAnimationHooks.setSelectedRowId(props.property.id);
};

const onRightClick = async (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  if (!props.property.property || props.property.property === "componentId") {
    return;
  }

  try {
    await ElMessageBox.confirm(`是否删除属性：${props.property.property}?`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      customClass: "sw-message-box"
    });

    // 从属性ID中提取组件ID（假设格式为 componentId-group-property）
    const componentId = props.property.id.split("-")[0];
    await statusAnimationHooks.removePropertyAndRestoreDefault(
      componentId,
      props.property.property as keyof ComponentAnimationConfig & keyof AnimationProperty
    );
  } catch {
    // 用户取消删除
  }
};
</script>

<style lang="scss" scoped>
@import "../styles/variables";

.property-row {
  margin-bottom: 2px;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: propertyRowSlideIn 0.4s ease both;

  .property-cell {
    cursor: pointer;
    background: rgba(46, 49, 63, 0.3);
    border: 1px solid var(--border-color);
    border-radius: 6px 0 0 6px;
    margin-right: 1px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &:hover {
      transform: translateX(4px);
      border-radius: inherit;
      box-shadow: var(--shadow-light);

      .property-cell {
        background: var(--hover-bg);
        border-color: rgba(139, 88, 231, 0.4);
      }

      .value-cell {
        background: rgba(139, 88, 231, 0.05);
        border-color: rgba(139, 88, 231, 0.2);
      }
    }

    // 添加微妙的渐变效果
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent 0%, rgba(139, 88, 231, 0.1) 50%, transparent 100%);
      transition: left 0.5s ease;
    }

    &:hover::before {
      left: 100%;
    }

    &:active {
      transform: scale(0.98);
    }

    &.highlight {
      color: white;
      background-color: rgba(0, 142, 255, 0.1);
      background-image: linear-gradient(180deg, #8b58e7, #642cff);
      border-color: rgba(139, 88, 231, 0.8);
      box-shadow: var(--shadow-property);
      position: relative;
      z-index: 10;

      // 发光效果
      &::after {
        content: "";
        position: absolute;
        inset: -2px;
        background: var(--primary-light);
        border-radius: inherit;
        z-index: -1;
        opacity: 0.3;
        filter: blur(6px);
        animation: glowPulse 2s ease-in-out infinite;
      }
    }
  }

  .value-cells {
    flex: 1;
    display: flex;

    .value-cell {
      width: 100px;
      height: 100%;
      background: rgba(35, 38, 48, 0.2);
      border: 1px solid var(--border-color);
      border-radius: 0 6px 6px 0;
      margin-right: 1px;
      box-sizing: border-box;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &:last-child {
        margin-right: 0;
        border-radius: 0 6px 6px 0;
      }

      &:first-child:last-child {
        border-radius: 0 6px 6px 0;
      }

      // 悬停时的优雅扫光效果
      // &::before {
      //   content: "";
      //   position: absolute;
      //   top: 0;
      //   left: -100%;
      //   width: 100%;
      //   height: 100%;
      //   background: linear-gradient(
      //     90deg,
      //     transparent 0%,
      //     rgba(139, 88, 231, 0.1) 20%,
      //     rgba(139, 88, 231, 0.3) 50%,
      //     rgba(139, 88, 231, 0.1) 80%,
      //     transparent 100%
      //   );
      //   transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      //   z-index: 1;
      // }

      // &:hover::before {
      //   left: 100%;
      // }

      // 添加微妙的缩放效果
      &:hover {
        transform: scale(1.02);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }
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
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 动画定义
@keyframes propertyRowSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.02);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .property-row {
    .property-cell {
      padding: 6px 8px;
    }

    .value-cells .value-cell {
      width: 80px;
    }
  }
}

// 暗色主题微调
@media (prefers-color-scheme: dark) {
  .property-row {
    .property-cell {
      background: rgba(46, 49, 63, 0.2);
    }

    .value-cells .value-cell {
      background: rgba(35, 38, 48, 0.15);
    }
  }
}
</style>
