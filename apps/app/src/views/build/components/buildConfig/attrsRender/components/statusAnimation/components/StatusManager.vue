<template>
  <div class="status-manager">
    <div class="manager-container">
      <!-- 时间控制区域 -->
      <div class="time-section" :style="{ width: `${componentWidth + propertyGroupWidth + propertyNameWidth}px` }">
        <div class="time-input-wrapper">
          <el-input-number
            v-model="duration"
            :min="0"
            :max="10000"
            :precision="0"
            :step="100"
            @change="handleUpdateDuration"
            @blur="handleDurationBlur"
            @keydown="handleDurationKeydown"
            controls-position="right"
            size="small"
            class="duration-input"
            :style="{ width: `${propertyGroupWidth + 20}px` }"
          />
          <span class="time-unit">ms</span>
        </div>
      </div>

      <!-- 状态标签页区域 -->
      <div class="status-tabs-container">
        <div class="status-tabs">
          <!-- 状态列表（包括添加按钮） -->
          <div class="existing-status-tabs">
            <draggable
              v-model="draggableStatusList"
              :animation="200"
              :disabled="isTransitioning"
              group="status-tabs"
              item-key="statusId"
              class="draggable-status-list"
              @end="handleDragEnd"
            >
              <template #item="{ element: status, index }">
                <div
                  class="status-tab"
                  :style="{
                    width: `${propertyValueEditorWidth}px`,
                    '--tab-index': index
                  }"
                  :class="{
                    active: selectStatusId === status.statusId,
                    editing: editingStatus && editingStatus.statusId === status.statusId
                  }"
                  @click="selectStatus(status.statusId)"
                  @dblclick="onStartRename(status)"
                  @contextmenu="handleDeleteFromMenu($event, status)"
                >
                  <div class="tab-content">
                    <el-input
                      class="status-edit-input"
                      :ref="`statusEditRef${status.statusId}`"
                      type="text"
                      size="small"
                      v-model="tempStatusName"
                      @blur="onBlur($event)"
                      @keyup.enter="onEndRename"
                      v-if="editingStatus && editingStatus.statusId === status.statusId"
                    />
                    <span class="status-name" v-else>{{ status.statusName }}</span>
                    <!-- 活跃状态指示器 -->
                    <div v-if="selectStatusId === status.statusId" class="active-indicator" />
                  </div>

                  <!-- 悬停效果 -->
                  <div class="tab-hover-effect" />
                </div>
              </template>
            </draggable>

            <!-- 添加状态按钮 -->
            <div
              class="status-tab add-status-tab"
              :style="{ width: `${propertyValueEditorWidth}px` }"
              @click="handleAddStatus"
              title="添加新状态"
            >
              <div class="tab-content">
                <Icon name="添加状态" type="iconfont-xianshi_tianjia" size="16" />
                <span class="add-status-text">添加状态</span>
              </div>
              <div class="tab-hover-effect" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import draggable from "vuedraggable";

import { ElMessage, ElMessageBox } from "element-plus";

import Icon from "@/components/Icon/index.vue";

import type { StatusAnimationMapping } from "../type";
import { useStatusAnimation } from "../useStatusAnimation";
import {
  COMPONENT_WIDTH,
  PROPERTY_GROUP_WIDTH,
  PROPERTY_NAME_WIDTH,
  PROPERTY_VALUE_EDITOR_WIDTH
} from "../utils/constants";

// 定义组件名称
defineOptions({
  name: "StatusManager"
});

const {
  animations,
  selectAnimationId,
  selectStatusId,
  statusAnimations,
  setSelectStatusId,
  onUpdateAnimationDuration,
  addStatus,
  onDeleteStatusFromAnimation,
  updateStatusName,
  reorderStatuses,
  triggerDragCompleteAnimation
} = useStatusAnimation();

// 响应式数据
const componentWidth = ref(COMPONENT_WIDTH);
const propertyGroupWidth = ref(PROPERTY_GROUP_WIDTH);
const propertyNameWidth = ref(PROPERTY_NAME_WIDTH);
const propertyValueEditorWidth = ref(PROPERTY_VALUE_EDITOR_WIDTH);
const editingStatus = ref<StatusAnimationMapping | null>(null);
const tempStatusName = ref("");

// 过渡状态管理
const isTransitioning = ref(false);
const displayStatusList = ref<StatusAnimationMapping[]>([]);
const previousAnimationId = ref("");

// 可拖拽的状态列表
const draggableStatusList = computed({
  get: () => displayStatusList.value,
  set: (newList: StatusAnimationMapping[]) => {
    displayStatusList.value = newList;
  }
});

// 获取当前动画组的持续时间
const duration = computed(() => {
  if (!selectAnimationId.value || !animations.value[selectAnimationId.value]) {
    return 1000;
  }
  return animations.value[selectAnimationId.value].duration;
});

// 获取当前动画组下的状态列表
const statusList = computed((): StatusAnimationMapping[] => {
  if (!selectAnimationId.value || !statusAnimations.value[selectAnimationId.value]) {
    return [];
  }

  // 从状态动画映射中获取状态列表
  const statusMapping = statusAnimations.value[selectAnimationId.value];
  return Object.values(statusMapping);
});

// 监听动画ID的变化，管理状态切换过渡
watch(
  selectAnimationId,
  async (newAnimationId, oldAnimationId) => {
    // 如果是初始化或者相同的动画ID，直接更新显示列表
    if (!oldAnimationId || newAnimationId === oldAnimationId) {
      displayStatusList.value = statusList.value;
      previousAnimationId.value = newAnimationId;
      return;
    }

    // 如果正在过渡中，等待前一个过渡完成
    if (isTransitioning.value) {
      return;
    }

    // 开始过渡
    isTransitioning.value = true;
    previousAnimationId.value = oldAnimationId;

    // 清空显示列表，触发离开动画
    displayStatusList.value = [];

    // 等待离开动画完成（CSS动画时间为0.5s）
    await nextTick();
    setTimeout(() => {
      // 更新为新的状态列表，触发进入动画
      displayStatusList.value = statusList.value;
      previousAnimationId.value = newAnimationId;

      // 过渡完成
      setTimeout(() => {
        isTransitioning.value = false;
      }, 100);
    }, 300); // 略大于CSS动画时间
  },
  { immediate: true }
);

// 监听statusList变化，在非过渡期间同步更新displayStatusList
watch(statusList, (newStatusList) => {
  if (!isTransitioning.value) {
    displayStatusList.value = newStatusList;
  }
});

// 方法
const selectStatus = (statusId: string) => {
  setSelectStatusId(statusId);
};

const handleUpdateDuration = async (newDuration: number | undefined) => {
  if (newDuration !== undefined && newDuration >= 0) {
    await onUpdateAnimationDuration(newDuration);
  }
};

// 失焦时处理空值
const handleDurationBlur = (e: FocusEvent) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement)) return;

  const value = input.value;
  if (value === "" || value === null || value === undefined) {
    // 恢复为当前的 duration 值
    nextTick(() => {
      input.value = String(duration.value);
    });
  }
};

// 阻止空格键清空内容
const handleDurationKeydown = (e: KeyboardEvent) => {
  if (e.key === " " || e.code === "Space") {
    e.preventDefault();
    const input = e.target;
    if (!(input instanceof HTMLInputElement)) return;

    // 如果全选了内容，填入默认值 1000
    const isAllSelected = input.selectionStart === 0 && input.selectionEnd === input.value.length;
    if (isAllSelected) {
      input.value = "1000";
      input.select();
    }
  }
};

const handleAddStatus = async () => {
  await addStatus();
};

const onStartRename = (status: StatusAnimationMapping) => {
  editingStatus.value = status;
  tempStatusName.value = status.statusName;

  nextTick(() => {
    // 查找当前编辑项的 input 元素并聚焦
    const inputEl = document.querySelector(".editing .status-edit-input input") as HTMLInputElement;
    if (inputEl) {
      inputEl.focus();
    }
  });
};

const onEndRename = async () => {
  if (!tempStatusName.value) {
    ElMessage.error("状态名称不能为空");
    return;
  }

  if (editingStatus.value && selectAnimationId.value) {
    try {
      await updateStatusName({
        animationId: selectAnimationId.value,
        statusId: editingStatus.value.statusId,
        newName: tempStatusName.value
      });
      ElMessage.success("状态重命名成功");
      editingStatus.value = null;
    } catch {
      ElMessage.error("状态重命名失败");
    }
  }
};

const onBlur = (e: FocusEvent) => {
  // 延迟检查，确认焦点是否真的离开了输入框
  setTimeout(() => {
    // 检查焦点是否仍在输入框内
    const target = e.target as HTMLElement;
    const inputWrapper = target?.closest(".status-edit-input");
    if (inputWrapper && inputWrapper.contains(document.activeElement)) {
      // 焦点仍在输入框内，不处理blur
      return;
    }

    if (tempStatusName.value) {
      onEndRename();
    } else {
      editingStatus.value = null;
    }
  }, 0);
};

const handleDeleteFromMenu = async (event: MouseEvent, status: StatusAnimationMapping) => {
  event.stopPropagation();
  event.preventDefault();

  try {
    await ElMessageBox.confirm(`是否删除状态：${status.statusName}?`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      customClass: "sw-message-box"
    });

    await onDeleteStatusFromAnimation(selectAnimationId.value, status.statusId);
    ElMessage.success("状态删除成功");

    // 选择第一个可用状态
    const currentStatusList = isTransitioning.value ? statusList.value : displayStatusList.value;
    if (currentStatusList.length > 0) {
      setSelectStatusId(currentStatusList[0].statusId);
    }
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message);
    }

    console.warn("状态删除失败", error);
  }
};

// 定义事件
const emit = defineEmits<{
  "status-reordered": [];
}>();

// 处理拖拽结束
const handleDragEnd = async () => {
  if (!selectAnimationId.value || isTransitioning.value) {
    return;
  }

  try {
    // 获取新的状态顺序
    const newStatusOrder = draggableStatusList.value.map((status) => status.statusId);

    // 调用重新排序方法
    await reorderStatuses(selectAnimationId.value, newStatusOrder);

    console.log("状态顺序更新成功");

    // 触发拖拽完成动画
    triggerDragCompleteAnimation();

    // 发出状态重新排序事件
    emit("status-reordered");
  } catch (error) {
    console.error("状态顺序更新失败", error);
    ElMessage.error("状态顺序更新失败");

    // 如果更新失败，恢复原来的顺序
    displayStatusList.value = statusList.value;
  }
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@import "../styles/variables";
@include common-element-style(".el-select__wrapper");
@include common-element-style(".el-input__wrapper");

// Element Plus 输入框样式重写
:deep(.el-input-number) {
  .el-input-number__decrease,
  .el-input-number__increase {
    width: 28px !important;
    background: rgba(139, 88, 231, 0.1);
    border: 1px solid rgba(139, 88, 231, 0.3) !important;
    color: var(--text-primary);
    transition: all 0.3s ease;

    &:hover {
      background: var(--primary-gradient);
      border-color: rgba(139, 88, 231, 0.8) !important;
      transform: scale(1.05);
    }
  }

  .el-input__wrapper {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid var(--border-color) !important;
    border-radius: 6px !important;
    padding-left: 8px !important;
    padding-right: 32px !important;
    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(139, 88, 231, 0.5) !important;
      background: rgba(255, 255, 255, 0.08) !important;
    }

    &.is-focus {
      border-color: rgba(139, 88, 231, 0.8) !important;
      box-shadow: 0 0 0 2px rgba(139, 88, 231, 0.2) !important;
    }

    .el-input__inner {
      color: var(--text-primary) !important;
      font-weight: 500;
      text-align: center;
    }
  }
}

.status-manager {
  width: 100%;
  height: 100%;
  background: var(--dark-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-light);

  .manager-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: stretch;
    padding-left: 8px;

    /* 时间控制区域 */
    .time-section {
      background: var(--section-bg);
      border-right: 1px solid var(--border-color);
      box-sizing: border-box;
      display: flex;
      justify-content: flex-start;
      height: 100%;
      position: relative;

      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--primary-light);
        border-radius: 0 2px 2px 0;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .header-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--success-gradient);
          border-radius: 6px;
          color: white;
          font-size: 12px;
        }

        .section-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }
      }

      .time-input-wrapper {
        height: 100%;
        display: flex;
        align-items: center;
        gap: 8px;

        .duration-input {
          flex: 1;
        }

        .time-unit {
          font-size: 11px;
          color: var(--text-secondary);
          font-weight: 500;
        }
      }
    }

    /* 状态标签页区域 */
    .status-tabs-container {
      flex: 1;
      background: var(--card-bg);
      position: relative;

      .status-tabs {
        height: 100%;
        display: flex;
        align-items: stretch;

        .existing-status-tabs {
          display: flex;
          align-items: stretch;

          .draggable-status-list {
            display: flex;
            align-items: stretch;
          }
        }

        .status-tab {
          box-sizing: border-box;
          position: relative;
          background: var(--card-bg);
          border-right: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          // 拖拽时的样式
          &.sortable-ghost {
            opacity: 0.5;
            background: rgba(139, 88, 231, 0.1);
            border: 2px dashed rgba(139, 88, 231, 0.5);
          }

          &.sortable-chosen {
            transform: scale(1.05);
            box-shadow: var(--shadow-heavy);
            z-index: 1000;
          }

          &.sortable-drag {
            opacity: 0.8;
            transform: rotate(5deg);
            box-shadow: var(--shadow-heavy);
          }

          .tab-content {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;

            .status-name {
              font-size: 12px;
              font-weight: 500;
              color: white;
              transition: all 0.3s ease;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 100%;
            }

            .status-edit-input {
              width: 100%;

              :deep(.el-input__wrapper) {
                background: rgba(255, 255, 255, 0.1) !important;
                border: 1px solid rgba(139, 88, 231, 0.5) !important;
                border-radius: 4px !important;

                .el-input__inner {
                  color: var(--text-primary) !important;
                  font-size: 12px;
                  text-align: center;
                }
              }
            }

            .active-indicator {
              position: absolute;
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 60%;
              height: 3px;
              background: var(--primary-gradient);
              border-radius: 2px 2px 0 0;
              box-shadow: 0 -2px 8px rgba(139, 88, 231, 0.6);
            }
          }

          .tab-hover-effect {
            position: absolute;
            inset: 0;
            background: var(--hover-bg);
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          &:hover:not(.editing) {
            transform: translateY(-2px);
            box-shadow: var(--shadow-light);

            .tab-hover-effect {
              opacity: 1;
            }

            .status-name {
              font-size: 12px;
              color: white;
            }
          }

          &.active {
            background: var(--primary-gradient);
            border-color: rgba(139, 88, 231, 0.8);
            box-shadow: var(--shadow-heavy);
            z-index: 10;

            .status-name {
              font-size: 12px;
              color: rgba(139, 88, 231);
              font-weight: 600;
            }

            .tab-hover-effect {
              opacity: 0.2;
            }

            &:hover:not(.editing) {
              transform: translateY(-2px);

              .status-name {
                color: rgba(139, 88, 231) !important;
              }
            }
          }

          &.editing {
            border-color: rgba(139, 88, 231, 0.8);
          }

          &:last-child {
            border-right: none;
          }

          // 添加状态按钮样式
          &.add-status-tab {
            background: rgba(139, 88, 231, 0.05);
            border: 2px dashed rgba(139, 88, 231, 0.3);
            border-radius: 6px;
            transition: all 0.3s ease;

            .tab-content {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              color: rgba(139, 88, 231, 0.8);

              .add-status-text {
                white-space: nowrap;
                font-size: 12px;
                font-weight: 500;
              }
            }

            &:hover {
              background: rgba(139, 88, 231, 0.1);
              border-color: rgba(139, 88, 231, 0.6);
              transform: none;

              .tab-content {
                color: rgba(139, 88, 231, 1);
              }

              .tab-hover-effect {
                opacity: 0.3;
              }
            }

            &:active {
              transform: scale(0.98);
            }
          }
        }
      }
    }
  }
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--section-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 0;
  box-shadow: var(--shadow-heavy);
  min-width: 160px;
  outline: none;

  .context-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    font-size: 12px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(139, 88, 231, 0.1);
    }

    &.danger {
      color: #ff6b6b;

      &:hover {
        background: rgba(255, 107, 107, 0.1);
      }
    }
  }

  .context-menu-divider {
    height: 1px;
    background: var(--border-color);
    margin: 4px 0;
  }
}

/* 动画定义 */
@keyframes tabSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 状态标签过渡动画 */
.status-tab-enter-active,
.status-tab-leave-active {
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.status-tab-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.status-tab-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
