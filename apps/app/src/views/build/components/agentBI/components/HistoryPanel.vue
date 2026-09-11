<template>
  <div class="history-content">
    <div v-if="isLoading" class="history-empty">加载中...</div>
    <div v-else-if="!threads.length" class="history-empty">暂无历史记录</div>
    <ul v-else class="history-list">
      <li
        v-for="thread in threads"
        :key="thread.id"
        :class="['history-item', { active: selectedId === thread.id, editing: editingId === thread.id }]"
        @click="$emit('select', thread)"
      >
        <Icon type="iconfont-liaotianjilu" style="font-size: 14px; flex-shrink: 0" />

        <!-- 标题编辑态：替换展示区为输入框，click 阻止冒泡避免触发 select -->
        <input
          v-if="editingId === thread.id"
          :ref="(el) => setEditInput(el)"
          v-model="editingText"
          class="history-title-input"
          @click.stop
          @keydown.enter="confirmEdit(thread)"
          @keydown.escape="cancelEdit"
          @blur="confirmEdit(thread)"
        />

        <!-- 标题展示态 -->
        <div v-else class="history-item__info">
          <span class="history-item__title">{{ thread.title || "新对话" }}</span>
          <span class="history-item__time">{{ formatTime(thread.updatedAt) }}</span>
        </div>

        <!-- 重命名图标（hover 显示，编辑态隐藏） -->
        <Icon
          v-if="editingId !== thread.id"
          type="iconfont-bianji"
          style="font-size: 13px"
          class="history-edit-icon"
          @click.stop="startEdit(thread)"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";

import type { CustomStorageThreadType } from "@screenwright/server/rpc";

import Icon from "@/components/Icon/index.vue";

defineProps<{
  threads: CustomStorageThreadType[];
  isLoading: boolean;
  selectedId?: string;
}>();

const emit = defineEmits<{
  select: [thread: CustomStorageThreadType];
  /** 重命名线程标题：落到 useAgentBIThreadList.updateThreadTitle */
  rename: [threadId: string, title: string];
}>();

// ── 标题内联编辑（从 TabBar 迁入：命名能力放在历史列表，顶部 tab 不再命名）──
const editingId = ref<string>("");
const editingText = ref("");
const editInputEl = ref<HTMLInputElement | null>(null);

const setEditInput = (el: unknown) => {
  editInputEl.value = (el as HTMLInputElement | null) ?? null;
};

const startEdit = async (thread: CustomStorageThreadType) => {
  editingText.value = thread.title || "新对话";
  editingId.value = thread.id;
  await nextTick();
  editInputEl.value?.focus();
};

const confirmEdit = (thread: CustomStorageThreadType) => {
  // enter 已置空 editingId，blur 再次触发时直接跳过，避免重复提交
  if (editingId.value !== thread.id) {
    return;
  }
  const trimmed = editingText.value.trim();
  editingId.value = "";
  if (trimmed && trimmed !== (thread.title || "新对话")) {
    emit("rename", thread.id, trimmed);
  }
};

const cancelEdit = () => {
  editingId.value = "";
};

/**
 * 格式化时间为本地化字符串
 * 格式：MM-DD HH:mm（例如：03-05 14:30）
 * @param val - 时间值（字符串、Date 对象或 null/undefined）
 * @returns 格式化后的时间字符串，如果输入无效则返回空字符串
 */
const formatTime = (val: string | Date | null | undefined): string => {
  if (!val) {
    return "";
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
};
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.history-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 8px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-scrollbar-thumb;
    border-radius: 2px;

    &:hover {
      background: $color-scrollbar-thumb-hover;
    }
  }
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: $color-text-secondary;
  font-size: 12px;
  padding: 48px 16px;
  text-align: center;
}

.history-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 4px;
  border-radius: 8px;
  cursor: pointer;
  color: $color-text-muted;
  transition: all $transition-base $transition-smooth;
  border-left: 2px solid transparent;

  &:hover {
    background: rgba(45, 108, 223, 0.08);
    color: $color-text-primary;
    border-left-color: $color-primary;

    .history-item__title {
      color: $color-text-primary;
    }

    .history-edit-icon {
      opacity: 1;
    }
  }

  &.active {
    background: $color-primary-20;
    color: $color-text-active;
    border-left-color: $color-primary;

    .history-item__title {
      color: $color-text-active;
      font-weight: 500;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    font-size: 13px;
    color: $color-text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color $transition-base;
  }

  &__time {
    font-size: 11px;
    color: $color-text-dim;
    transition: color $transition-base;
  }
}

/* 重命名图标：绝对定位贴右上角，仅 item hover 时浮现 */
.history-edit-icon {
  position: absolute;
  top: 8px;
  right: 4px;
  color: $color-text-secondary;
  opacity: 0;
  cursor: pointer;
  transition:
    opacity $transition-fast,
    color $transition-fast;

  &:hover {
    color: $color-text-primary;
  }
}

/* 内联重命名输入框：替换 __info 区，垂直居中对齐 */
.history-title-input {
  flex: 1;
  min-width: 0;
  align-self: center;
  padding: 2px 6px;
  font-size: 13px;
  font-family: $font-family-panel;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid $color-primary-80;
  border-radius: 4px;
  color: $color-text-primary;
  outline: none;
}
</style>
