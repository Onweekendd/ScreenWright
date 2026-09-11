<template>
  <el-drawer
    v-model="visible"
    direction="rtl"
    :modal="false"
    :with-header="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :size="drawerWidth"
    append-to-body
    modal-class="agent-bi-overlay"
    :class="['agent-bi-drawer', { 'is-resizing': isResizing }]"
  >
    <!-- 左侧拖拽伸缩手柄 -->
    <div class="resize-handle" @mousedown="startResize" />

    <!-- 顶部 tab 栏（取代原标题栏，支持多对话切换；命名能力在历史侧栏，tab 不再内联命名） -->
    <TabBar
      :sessions="sessions"
      :active-session-id="activeSessionId"
      @select="activeSessionId = $event"
      @close="closeTab"
      @clear-records="handleClearRecords"
      @close-drawer="visible = false"
    />

    <!-- 面板主体 -->
    <div v-if="activeSession" class="panel-inner">
      <!-- 主内容区：对话 / 后台任务视图切换。切 tab 时按 sessionId 整体重挂载，叶子组件重新注入激活会话 -->
      <div :key="activeSession.sessionId" class="process-area">
        <ChatArea v-show="!showBgTasks" />
        <BackgroundTasksView v-show="showBgTasks" class="bg-tasks-view" />
        <!-- 审批/提问/计划弹层：覆盖对话页与后台任务页 -->
        <ApprovalDialog />
      </div>

      <!-- 历史侧栏 -->
      <HistorySidebar
        :threads="memoryThreads"
        :is-loading="isLoadingMemory"
        :selected-id="activeSession.activeThreadId.value"
        :running-task-count="activeSession.runningTaskCount.value"
        :bg-tasks-active="showBgTasks"
        @select="handleSelectThread"
        @rename="updateThreadTitle"
        @new-chat="addTab"
        @toggle-bg-tasks="showBgTasks = !showBgTasks"
        @open-history="queryMemory"
      />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { provide, ref } from "vue";

import type { CustomStorageThreadType } from "@screenwright/server/rpc";

import { ActiveSessionKey } from "./agentBISessionContext";
import ApprovalDialog from "./components/ApprovalDialog.vue";
import BackgroundTasksView from "./components/BackgroundTasksView.vue";
import ChatArea from "./components/ChatArea.vue";
import HistorySidebar from "./components/HistorySidebar.vue";
import TabBar from "./components/TabBar.vue";
import { useAgentBIThreadList } from "./hooks/useAgentBIThreadList";
import { useDrawerResize } from "./hooks/useDrawerResize";
import { useAgentBISessions } from "./useAgentBISessions";

const { visible, sessions, activeSessionId, activeSession, addTab, closeTab, openThread } = useAgentBISessions();

// 共享历史列表（所有 tab 共用一份）
const { memoryThreads, isLoadingMemory, queryMemory, updateThreadTitle } = useAgentBIThreadList();

// 把激活会话注入子树，供 ChatInput / ApprovalDialog / BackgroundTasksView 取用
provide(ActiveSessionKey, activeSession);

const { drawerWidth, isResizing, startResize } = useDrawerResize({ visible });

const showBgTasks = ref(false);

const handleSelectThread = async (thread: CustomStorageThreadType) => {
  await openThread(thread);
};

const handleClearRecords = () => {
  if (activeSession.value) {
    activeSession.value.messages.value = [];
  }
};

defineExpose({ drawerWidth, visible });
</script>

<style lang="scss">
@use "./styles/variables" as *;

/* overlay 本身不拦截点击，但 drawer 面板本身需要可交互
   （:modal="false" 时该容器无 .el-overlay 类，且 inset:0 为内联样式，所以避让标题栏的偏移写在 .el-drawer 上） */
.agent-bi-overlay {
  pointer-events: none;

  .el-drawer {
    pointer-events: auto;
    background-color: #181a24;
  }
}

.agent-bi-drawer.el-drawer {
  --el-drawer-bg-color: #{$color-bg-drawer};
  background: $color-bg-drawer;
  background-image: $gradient-drawer-bg;
  background-repeat: no-repeat;
  background-position: bottom;
  font-size: 13px;
  color: $color-text-primary;
  font-family: $font-family-panel;
  /* append-to-body 后铺满视口，桌面端要避开顶部自定义标题栏（Web 端该变量为 0）。
     多套一层 .rtl 是为了压过 element-plus 同权重的 .el-drawer.rtl { top: 0; height: 100% } */
  &.rtl {
    top: var(--sw-titlebar-height, 0px);
    height: calc(100% - var(--sw-titlebar-height, 0px));
  }

  &.is-resizing {
    transition: none !important;
  }

  .el-drawer__body {
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    height: 100%;
  }
}
</style>

<style lang="scss" scoped>
@use "./styles/variables" as *;

/* ---- 拖拽手柄 ---- */
.resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  cursor: ew-resize;
  z-index: 1;
  transition: background $transition-fast;

  &:hover {
    background: $color-primary-50;
  }

  &:active {
    background: $color-primary-80;
  }
}

/* ---- 面板主体 ---- */
.panel-inner {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background: linear-gradient(45deg, $color-primary-10, rgba(0, 0, 0, 0.01));
}

/* ---- 主对话区 ---- */
.process-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  border-top-right-radius: 10px;
  /* 作为审批弹层(.ask-popup-mask: absolute inset:0)的定位锚点，使其覆盖对话页+后台任务页 */
  position: relative;
}

/* ---- 后台任务占位视图 ---- */
.bg-tasks-view {
  flex: 1;
  height: 100%;
}
</style>
