<template>
  <div class="history-sidebar" :class="{ 'is-open': showHistory }">
    <!-- 历史内容（左侧，展开时可见） -->
    <div class="sidebar-content">
      <HistoryPanel
        :threads="threads"
        :is-loading="isLoading"
        :selected-id="selectedId"
        @select="$emit('select', $event)"
        @rename="(threadId, title) => emit('rename', threadId, title)"
      />
    </div>

    <!-- 图标条（右侧，始终固定可见） -->
    <div class="sidebar-rail">
      <el-tooltip effect="dark" placement="left" content="历史记录">
        <Icon type="iconfont-caidanzhankai" style="font-size: 13px" class="rail-icon" @click="toggleHistory" />
      </el-tooltip>
      <el-tooltip effect="dark" placement="left" content="后台任务">
        <div class="rail-icon" :class="{ 'is-active': bgTasksActive }" @click="$emit('toggleBgTasks')">
          <Icon type="iconfont-sucai" style="font-size: 15px" />
          <!-- 进行中任务数徽标：有任务运行时显示 -->
          <span v-if="runningTaskCount > 0" class="rail-badge">{{
            runningTaskCount > 99 ? "99+" : runningTaskCount
          }}</span>
        </div>
      </el-tooltip>
    </div>

    <!-- 新建对话（绝对定位，展开后显示文字+边框） -->
    <el-tooltip effect="dark" placement="left" content="新建对话">
      <div class="sidebar-new-chat" @click="$emit('newChat')">
        <Icon type="iconfont-tianjiazhuangtai" style="font-size: 13px" />
        <span v-if="showHistory">新建对话</span>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import type { CustomStorageThreadType } from "@screenwright/server/rpc";

import Icon from "@/components/Icon/index.vue";

import HistoryPanel from "./HistoryPanel.vue";

withDefaults(
  defineProps<{
    threads: CustomStorageThreadType[];
    isLoading: boolean;
    selectedId?: string;
    bgTasksActive?: boolean;
    /** 进行中后台任务数（来自当前激活会话），用于后台任务入口图标徽标 */
    runningTaskCount?: number;
  }>(),
  { runningTaskCount: 0 }
);

const emit = defineEmits<{
  select: [thread: CustomStorageThreadType];
  rename: [threadId: string, title: string];
  newChat: [];
  toggleBgTasks: [];
  openHistory: [];
}>();

const showHistory = ref(false);

/** 切换历史面板：仅在「展开」的瞬间通知外部按需拉取历史记录 */
const toggleHistory = () => {
  showHistory.value = !showHistory.value;
  if (showHistory.value) {
    emit("openHistory");
  }
};
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.history-sidebar {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  width: 30px;
  overflow: hidden;
  transition: width 0.25s ease;
  position: relative;

  &.is-open {
    width: 200px;
  }
}

/* 左侧历史内容区，折叠时宽度为 0 */
.sidebar-content {
  flex: 1;
  overflow: hidden;
  padding-top: 8px;
  margin-top: 90px;
  min-width: 0;
}

/* 右侧图标条，始终固定 30px */
.sidebar-rail {
  flex-shrink: 0;
  width: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
  gap: 4px;
}

.rail-icon {
  position: relative;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 5px;
  color: $color-text-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    color $transition-fast,
    background $transition-fast;

  &:hover {
    background: $color-primary-10;
    color: $color-text-primary;
  }

  &.is-active {
    color: $color-text-primary;
    background: $color-primary-10;
  }
}

/* 进行中任务数徽标：右上角小红点数字 */
.rail-badge {
  position: absolute;
  top: -2px;
  right: 0px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 7px;
  background: $color-primary;
  color: #fff;
  font-size: 9px;
  line-height: 14px;
  text-align: center;
  font-weight: 600;
  box-sizing: border-box;
  pointer-events: none;
}

/* 新建对话：right 固定为 0，图标始终居中在 rail，展开时只扩展 left */
/* top = padding-top(10) + icon(23) + gap(4) + icon(23) + gap(4) = 64px */
.sidebar-new-chat {
  position: absolute;
  top: 70px;
  right: 0;
  width: 30px;
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: 8px;
  /* 左右对称 padding，使图标在 30px rail 内居中 */
  padding: 4px 8px;
  border-radius: 6px;
  box-shadow: 0 0 0 1px transparent;
  color: $color-text-secondary;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  transition:
    background $transition-fast,
    color $transition-fast,
    box-shadow $transition-fast;

  .is-open & {
    left: 6px;
    width: auto;
    padding-left: 6px;
    overflow: visible;
    box-shadow: 0 0 0 1px $color-border-panel;

    &:hover {
      background: $color-primary-10;
      color: $color-text-primary;
      box-shadow: 0 0 0 1px $color-primary-35;
    }
  }
}
</style>
