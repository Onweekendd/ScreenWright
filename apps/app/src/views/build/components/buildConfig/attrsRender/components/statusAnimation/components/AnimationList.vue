<template>
  <section class="left-animation-main">
    <!-- 改进的头部设计 -->
    <div class="header">
      <div class="header-content">
        <div class="icon-wrapper">
          <Icon name="动画" type="iconfont-donghua" size="20" />
          <div class="icon-glow" />
        </div>
        <div class="text-content">
          <div class="title">状态动画</div>
          <div class="subtitle">Status Animation</div>
        </div>
      </div>
      <div class="add-button" @click="onAdd">
        <Icon name="添加动画" type="iconfont-jiahao" size="16" />
        <div class="button-ripple" />
      </div>
    </div>

    <!-- 改进的列表设计 -->
    <div class="list-container" @click="clearSelect">
      <transition-group name="animation-list" tag="ul" class="list">
        <li
          v-for="(item, index) in animationList"
          :key="item.id"
          :class="{
            select: selectAnimationId === item.id,
            editing: editingItem && editingItem.id === item.id
          }"
          :style="{ '--item-index': index }"
          @click="goSelect(item)"
          @dblclick="onStartRename(item)"
          @mouseenter="onItemHover(item)"
          @mouseleave="onItemLeave(item)"
        >
          <div class="item-content">
            <div class="item-icon">
              <Icon name="动画项" type="iconfont-donghua" size="14" />
            </div>

            <el-input
              class="edit-input"
              :ref="`editNameRef${item.id}`"
              type="text"
              size="small"
              v-model="tempName"
              @blur="onBlur($event)"
              @keyup.enter="onEndRename"
              v-if="editingItem && editingItem.id === item.id"
            />
            <span class="animation-name" v-else>{{ item.name }}</span>

            <div class="item-actions">
              <div class="action-btn delete-btn" @click="(e: MouseEvent) => onDelete(e, item)">
                <Icon name="删除动画" type="iconfont-shanchu" size="12" />
              </div>
            </div>
          </div>

          <!-- 选中指示器 -->
          <div class="select-indicator" v-if="selectAnimationId === item.id" />

          <!-- 悬停效果 -->
          <div class="hover-overlay" />
        </li>
      </transition-group>

      <!-- 空状态 -->
      <div class="empty-state" v-if="animationList.length === 0">
        <div class="empty-icon">
          <Icon name="空状态" type="iconfont-donghua" size="40" />
        </div>
        <div class="empty-text">暂无动画</div>
        <div class="empty-subtitle">点击上方添加按钮创建动画</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";

import { ElMessage, ElMessageBox } from "element-plus";

import Icon from "@/components/Icon/index.vue";

import type { AnimationInfo } from "../type";
import { useStatusAnimation } from "../useStatusAnimation";

// 定义组件名称
defineOptions({
  name: "AnimationList"
});

// Props
interface Props {
  panelId?: number;
  activeStatusId?: string;
}
const props = defineProps<Props>();

const {
  getCurrentAnimationList,
  setSelectAnimationId,
  selectAnimationId,
  onDeleteAnimation,
  onAddAnimation,
  setSelectStatusId,
  getCurrentStatusList,
  updateAnimationName,
  resetComponentConfig
} = useStatusAnimation();

// 响应式数据
const editingItem = ref<AnimationInfo | null>(null);
const tempName = ref<string>("");

// 计算属性
const animationList = computed(() => {
  return getCurrentAnimationList(props.panelId, props.activeStatusId);
});

// 方法
const onDelete = async (e: MouseEvent, item: AnimationInfo) => {
  e.stopPropagation();

  try {
    await ElMessageBox.confirm(`是否删除动画：${item.name}?`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      customClass: "sw-message-box"
    });

    await onDeleteAnimation(item.id);
  } catch {
    // 用户取消删除
  }
};

const onAdd = async () => {
  await onAddAnimation({
    panelId: props.panelId,
    activeStatusId: props.activeStatusId,
    statusIndex: animationList.value.length + 1
  });
};

const goSelect = async (animation: AnimationInfo) => {
  if (selectAnimationId.value === animation.id) {
    return;
  }

  // 如果当前有动画正在重命名，先完成重命名验证
  if (editingItem.value) {
    if (!isValidAnimationName(tempName.value)) {
      ElMessage.error("动画名称不能为空或仅包含空格");
      editingItem.value = null;
      return;
    } else {
      // 名称有效，完成重命名
      try {
        await updateAnimationName({
          animationId: editingItem.value.id,
          newName: tempName.value
        });
        ElMessage.success("重命名成功");
        editingItem.value = null;
      } catch {
        ElMessage.error("重命名失败");
        editingItem.value = null;
        return;
      }
    }
  }

  setSelectAnimationId(animation.id);

  nextTick(() => {
    if (getCurrentStatusList.value.length > 0) {
      setSelectStatusId(getCurrentStatusList.value[0].statusId);
    }
  });
};

const onStartRename = (item: AnimationInfo) => {
  editingItem.value = item;
  tempName.value = item.name;

  nextTick(() => {
    // 查找当前编辑项的 input 元素并聚焦
    const inputEl = document.querySelector(".editing .edit-input input") as HTMLInputElement;
    if (inputEl) {
      inputEl.focus();
    }
  });
};

const onEndRename = async () => {
  if (!isValidAnimationName(tempName.value)) {
    ElMessage.error("动画名称不能为空或仅包含空格");
    return;
  }

  if (editingItem.value) {
    try {
      await updateAnimationName({
        animationId: editingItem.value.id,
        newName: tempName.value
      });
      ElMessage.success("重命名成功");
      editingItem.value = null;
    } catch {
      ElMessage.error("重命名失败");
    }
  }
};

const onBlur = (e: FocusEvent) => {
  // 延迟检查，确认焦点是否真的离开了输入框
  // 这是为了处理点击输入框wrapper时短暂失焦又重新聚焦的情况
  setTimeout(() => {
    // 检查焦点是否仍在输入框内
    const target = e.target as HTMLElement;
    const inputWrapper = target?.closest(".edit-input");
    if (inputWrapper && inputWrapper.contains(document.activeElement)) {
      // 焦点仍在输入框内，不处理blur
      return;
    }

    if (tempName.value && isValidAnimationName(tempName.value)) {
      onEndRename();
    } else {
      if (tempName.value && !isValidAnimationName(tempName.value)) {
        ElMessage.error("动画名称不能为空或仅包含空格");
      }
      editingItem.value = null;
    }
  }, 0);
};

const clearSelect = async (e: MouseEvent) => {
  e.stopPropagation();
  if (e.target === e.currentTarget) {
    // 如果当前有动画正在重命名，先完成重命名验证
    if (editingItem.value) {
      if (!isValidAnimationName(tempName.value)) {
        ElMessage.error("动画名称不能为空或仅包含空格");
        editingItem.value = null;
        return;
      } else {
        // 名称有效，完成重命名
        try {
          await updateAnimationName({
            animationId: editingItem.value.id,
            newName: tempName.value
          });
          ElMessage.success("重命名成功");
          editingItem.value = null;
        } catch {
          ElMessage.error("重命名失败");
          editingItem.value = null;
          return;
        }
      }
    }
    setSelectAnimationId("");
    setSelectStatusId("");

    resetComponentConfig();
  }
};

const isValidAnimationName = (name: string): boolean => {
  return typeof name === "string" && name.trim().length > 0;
};

// 新增的交互方法
const onItemHover = (_item: AnimationInfo) => {
  // 悬停效果可以在这里添加逻辑
};

const onItemLeave = (_item: AnimationInfo) => {
  // 离开悬停效果可以在这里添加逻辑
};

// 生命周期
onMounted(() => {
  if (animationList.value.length > 0) {
    resetComponentConfig();

    goSelect(animationList.value[0]);
  }
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@import "../styles/variables";
@include common-element-style(".el-input__wrapper");

.left-animation-main {
  flex-grow: 0;
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  background: var(--dark-bg);
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-light);

  /* 头部样式 */
  .header {
    position: relative;
    background: var(--primary-gradient);
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-color);

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover::before {
      opacity: 1;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;

      .icon-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        backdrop-filter: blur(10px);

        .icon-glow {
          position: absolute;
          inset: -2px;
          border-radius: 10px;
          background: var(--primary-light);
          opacity: 0;
          filter: blur(6px);
          transition: opacity 0.3s ease;
        }

        &:hover .icon-glow {
          opacity: 0.6;
        }
      }

      .text-content {
        .title {
          font-size: 14px;
          font-weight: 600;
          color: color-mix(in srgb, var(--sw-theme-color) 80%, transparent);
          line-height: 1.2;
        }

        .subtitle {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }
      }
    }

    .add-button {
      position: relative;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      cursor: pointer;
      backdrop-filter: blur(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;

      .add-text {
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        color: var(--text-primary);
      }

      .button-ripple {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
        transform: scale(0);
        transition: transform 0.3s ease;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-heavy);
        background: rgba(255, 255, 255, 0.25);

        .button-ripple {
          transform: scale(1);
        }
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  /* 列表容器 */
  .list-container {
    flex: 1;
    overflow: hidden;
    position: relative;

    .list {
      list-style: none;
      margin: 0;
      padding: 8px;
      height: 100%;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;

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

      li {
        position: relative;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: slideInUp 0.5s ease calc(var(--item-index) * 0.1s) both;

        .item-content {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          position: relative;
          z-index: 2;

          .item-icon {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--hover-bg);
            border-radius: 6px;
            margin-right: 12px;
            transition: all 0.3s ease;
          }

          .animation-name {
            flex: 1;
            font-size: 13px;
            font-weight: 500;
            color: white;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: color 0.3s ease;
          }

          .edit-input {
            flex: 1;

            :deep(.el-input__wrapper) {
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid color-mix(in srgb, var(--sw-theme-color) 50%, transparent);
              border-radius: 6px;

              .el-input__inner {
                color: var(--text-primary);
                font-size: 13px;
              }
            }
          }

          .item-actions {
            display: flex;
            gap: 4px;
            opacity: 0;
            transform: translateX(10px);
            transition: all 0.3s ease;

            .action-btn {
              width: 24px;
              height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 4px;
              transition: all 0.3s ease;

              &.delete-btn {
                background: var(--primary-deep);
                color: white;

                &:hover {
                  transform: scale(1.1);
                  box-shadow: 0 4px 12px color-mix(in srgb, var(--sw-theme-color) 40%, transparent);
                }
              }
            }
          }
        }

        .select-indicator {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 60%;
          background: var(--primary-light);
          border-radius: 0 2px 2px 0;
          box-shadow: 0 0 10px color-mix(in srgb, var(--sw-theme-color) 60%, transparent);
        }

        .hover-overlay {
          position: absolute;
          inset: 0;
          background: var(--hover-bg);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover {
          transform: translateX(4px);
          border-color: color-mix(in srgb, var(--sw-theme-color) 50%, transparent);
          box-shadow: var(--shadow-light);

          .hover-overlay {
            opacity: 1;
          }

          .item-content {
            .item-icon {
              background: var(--primary-gradient);
              transform: scale(1.1);
            }

            .item-actions {
              opacity: 1;
              transform: translateX(0);
            }
          }
        }

        &.select {
          background: var(--primary-gradient);
          border-color: color-mix(in srgb, var(--sw-theme-color) 80%, transparent);
          box-shadow: var(--shadow-heavy);

          .item-content {
            .item-icon {
              background: rgba(255, 255, 255, 0.2);
            }

            .animation-name {
              color: var(--sw-theme-color);
              font-weight: 600;
            }

            .item-actions {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .hover-overlay {
            opacity: 0.2;
          }
        }

        &.editing {
          border-color: color-mix(in srgb, var(--sw-theme-color) 80%, transparent);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--sw-theme-color) 30%, transparent);
        }
      }
    }

    /* 空状态 */
    .empty-state {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      padding: 40px 20px;

      .empty-icon {
        margin-bottom: 16px;
        opacity: 0.6;
        animation: pulse 2s ease-in-out infinite;
      }

      .empty-text {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 8px;
      }

      .empty-subtitle {
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.5;
      }
    }
  }
}

/* 动画定义 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

/* 列表过渡动画 */
.animation-list-enter-active,
.animation-list-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.animation-list-enter-from {
  opacity: 0;
  transform: translateX(-30px) scale(0.95);
}

.animation-list-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}

.animation-list-move {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
