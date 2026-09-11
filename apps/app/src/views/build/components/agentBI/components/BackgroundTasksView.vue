<template>
  <div class="bg-tasks">
    <div v-if="!tasks.length" class="bg-tasks__empty">暂无后台任务</div>
    <template v-else>
      <!-- tab 头：每个后台任务一个页签，任务启动即新增 -->
      <div class="bg-tasks__tabs">
        <button
          v-for="task in tasks"
          :key="task.toolCallId"
          :class="['bg-tasks__tab', { 'is-active': task.toolCallId === activeId }]"
          @click="activeId = task.toolCallId"
        >
          <span :class="['bg-tasks__tab-dot', task.status]" />
          <span class="bg-tasks__tab-label">{{ formatName(task.toolName) }}</span>
        </button>
      </div>

      <!-- tab 内容：当前选中任务的流式消息 -->
      <div v-if="activeTask" :key="activeTask.toolCallId" class="bg-tasks__body">
        <div class="bg-tasks__status">
          <span :class="['bg-tasks__badge', activeTask.status]">{{ statusText(activeTask.status) }}</span>
        </div>
        <template v-for="msg in activeTask.messages.value" :key="msg.id">
          <AssistantMessage :message="msg" :is-loading="isLastRunning(activeTask, msg)" />
        </template>
        <div v-if="!activeTask.messages.value.length" class="bg-tasks__pending">任务已派发，等待执行…</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { UIMessage } from "ai";

import { useActiveAgentBISession } from "../agentBISessionContext";
import type { BackgroundTaskView } from "../hooks/useBackgroundTask";
import AssistantMessage from "./AssistantMessage.vue";

const { backgroundTasks: tasks } = useActiveAgentBISession();

/** 当前选中的任务 toolCallId */
const activeId = ref<string>("");

// 维持 activeId 始终指向存在的任务：列表清空则重置；当前选中项消失时切到最新任务，
// 保证新派发的任务能立刻被看到（任务一启动就多出一个页签并流式渲染）。
watch(
  tasks,
  (list) => {
    if (!list.length) {
      activeId.value = "";
      return;
    }
    if (!list.some((task) => task.toolCallId === activeId.value)) {
      activeId.value = list[list.length - 1].toolCallId;
    }
  },
  { immediate: true }
);

const activeTask = computed(() => tasks.value.find((task) => task.toolCallId === activeId.value) ?? null);

/** 仅最后一条消息且任务运行中时显示生成动效 */
const isLastRunning = (task: BackgroundTaskView, msg: UIMessage) =>
  task.status === "running" && msg === task.messages.value[task.messages.value.length - 1];

/** agent-swExecutorAgent → "Bi Executor Agent" */
const formatName = (toolName: string): string => {
  const raw = toolName.replace(/^agent-/, "");
  const formatted = raw
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const statusText = (status: BackgroundTaskView["status"]) =>
  status === "running" ? "执行中" : status === "completed" ? "完成" : "失败";
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.bg-tasks {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: $color-primary-5;
  border-top-left-radius: 10px;
  box-shadow: inset -8px 0 12px -6px rgba(0, 0, 0, 0.5);
}

.bg-tasks__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $color-text-secondary;
  font-size: 12px;
}

/* ---- 页签条 ---- */
.bg-tasks__tabs {
  flex-shrink: 0;
  display: flex;
  gap: 4px;
  padding: 10px 12px 0;
  overflow-x: auto;
  overflow-y: hidden;

  &::-webkit-scrollbar {
    height: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-primary-20;
    border-radius: 2px;
  }
}

.bg-tasks__tab {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid $color-primary-20;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  background: transparent;
  color: $color-text-muted;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    color $transition-fast,
    background $transition-fast;

  &:hover {
    color: $color-text-primary;
    background: $color-primary-10;
  }

  &.is-active {
    color: $color-text-active;
    background: $color-primary-10;
    border-color: $color-primary-40;
  }
}

.bg-tasks__tab-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;

  &.running {
    background: $color-primary;
    animation: bg-dot-breath 1.6s ease-in-out infinite;
  }

  &.completed {
    background: $color-primary-done;
  }

  &.failed {
    background: #f56c6c;
  }
}

/* ---- 内容区 ---- */
.bg-tasks__body {
  flex: 1;
  padding: 12px 16px;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-primary-20;
    border-radius: 2px;

    &:hover {
      background: $color-primary-35;
    }
  }
}

.bg-tasks__status {
  margin-bottom: 4px;
}

.bg-tasks__badge {
  font-size: 10px;
  padding: 1px 8px;
  border-radius: 10px;

  &.running {
    background: $color-primary-20;
    color: $color-primary-name;
  }

  &.completed {
    background: $color-primary-10;
    color: $color-primary-done;
  }

  &.failed {
    background: rgba(245, 108, 108, 0.15);
    color: #f56c6c;
  }
}

.bg-tasks__pending {
  color: $color-text-dim;
  font-size: 12px;
  padding: 12px 0;
}

@keyframes bg-dot-breath {
  0%,
  100% {
    opacity: 0.5;
  }

  50% {
    opacity: 1;
  }
}
</style>
