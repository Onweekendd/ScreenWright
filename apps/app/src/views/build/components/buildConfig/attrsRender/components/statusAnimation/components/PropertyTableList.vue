<template>
  <div class="property-table-container">
    <!-- 属性数据区域 -->
    <div class="table-body-container">
      <div v-for="(component, componentIndex) in getRenderTableData" :key="componentIndex" class="component-row">
        <!-- 左侧组件名称 -->
        <component-name-cell
          :component-id="component.id"
          :component-name="component.componentName ?? ''"
          :width="COMPONENT_WIDTH"
          :is-highlighted="isHighlighted(component.id)"
        />

        <!-- 右侧属性区域 -->
        <div class="component-properties">
          <property-group-row
            v-for="(group, groupIndex) in component.children"
            :key="groupIndex"
            :group="group"
            :status-names="getCurrentStatusList"
            @row-click="setSelectedRow"
          >
            <template v-slot:property-editor="{ property, statusId }">
              <property-value-editor
                :value="property.states?.[statusId]"
                :property="property"
                :status-id="statusId"
                :component-id="property.id.split('-')[0]"
              />
            </template>
          </property-group-row>

          <!-- 组件内属性为空状态 -->
          <div v-if="!component.children || component.children.length === 0" class="empty-properties">
            <div class="empty-icon">
              <Icon name="空属性" type="iconfont-shuxing" size="24" />
            </div>
            <div class="empty-text">暂无属性</div>
            <div class="empty-subtitle">Ctrl + 左键添加属性</div>
          </div>
        </div>
      </div>

      <div v-if="getRenderTableData.length === 0" class="global-empty-state">
        <div class="empty-animation">
          <div class="empty-icon-large">
            <Icon name="空动画" type="iconfont-donghua" size="48" />
          </div>
          <div class="empty-title">暂无添加组件</div>
          <div class="empty-description">
            <p>请先使用 Ctrl + 左键选中画布中的组件完成添加</p>
            <p>或 Ctrl + 左键选中侧边栏组件</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";

import { useStatusAnimation } from "../useStatusAnimation";
import { COMPONENT_WIDTH } from "../utils/constants";
import ComponentNameCell from "./ComponentNameCell.vue";
import PropertyGroupRow from "./PropertyGroupRow.vue";
import PropertyValueEditor from "./PropertyValueEditor.vue";

// 定义组件名称
defineOptions({
  name: "PropertyTableList"
});

const { getRenderTableData, getCurrentStatusList, selectedRowId, setSelectedRowId } = useStatusAnimation();

// 方法
const setSelectedRow = (id: string) => {
  setSelectedRowId(id);
};

const isHighlighted = (componentId: string): boolean => {
  // 如果组件本身被选中，应该高亮
  if (selectedRowId.value.includes(componentId)) {
    return true;
  }

  return false;
};
</script>

<style lang="scss" scoped>
@import "../styles/variables";

.property-table-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--dark-bg);

  overflow: hidden;
  position: relative;

  // 添加背景网格效果
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
    z-index: 1;
  }
}

/* 表格主体区域 */
.table-body-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
  z-index: 2;
  padding: 8px;

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--primary-gradient);
    border-radius: 3px;
    transition: background 0.3s ease;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--secondary-gradient);
  }

  /* 组件行 */
  .component-row {
    display: flex;
    margin-bottom: 8px;
    background: var(--section-bg);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: var(--shadow-light);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: componentSlideIn 0.5s ease both;
    border: 1px solid var(--border-color);

    &:hover {
      box-shadow: var(--shadow-component);
      border-color: rgba(139, 88, 231, 0.3);
    }

    /* 右侧属性区域 */
    .component-properties {
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex: 1;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 动画定义
@keyframes componentSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 空状态样式
.empty-properties {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: auto;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 2px 0;
  margin: 0 4px;
  border: 2px dashed rgba(139, 88, 231, 0.3);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(139, 88, 231, 0.5);
    background: rgba(255, 255, 255, 0.05);
  }

  .empty-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 2px;
  }

  .empty-subtitle {
    font-size: 12px;
    color: var(--text-secondary);
    text-align: center;
    line-height: 1.4;
    opacity: 0.8;
  }
}

.global-empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 60px 40px;
  max-width: 400px;
  width: 100%;
  z-index: 3;

  .empty-animation {
    .empty-icon-large {
      margin-bottom: 24px;
      opacity: 0.4;
      color: var(--primary-light);
      animation: float 3s ease-in-out infinite;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 16px;
    }

    .empty-description {
      color: var(--text-secondary);
      line-height: 1.6;
      opacity: 0.9;

      p {
        margin: 8px 0;
        font-size: 14px;
      }
    }
  }
}

// 动画定义
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .property-table-container {
    .table-body-container {
      padding: 4px;

      .component-row {
        margin-bottom: 4px;
      }
    }
  }
}
</style>
