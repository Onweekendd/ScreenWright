<template>
  <div class="todo-write">
    <div class="todo-write__header" @click="expanded = !expanded">
      <div class="todo-write__header-left">
        <span class="todo-write__title">任务清单</span>
        <span class="todo-write__count">{{ completedCount }}/{{ displayTodos.length }}</span>
      </div>
      <Icon
        :type="expanded ? 'iconfont-shangjiantou' : 'iconfont-xiajiantou'"
        style="font-size: 11px; color: color-mix(in srgb, var(--sw-theme-color) 60%, transparent)"
      />
    </div>
    <div v-if="expanded" class="todo-list">
      <div v-for="(todo, i) in displayTodos" :key="i" class="todo-item" :class="[`is-${todo.status}`]">
        <span class="todo-item__icon">
          <!-- completed -->
          <svg v-if="todo.status === 'completed'" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2" />
            <path
              d="M3.5 6l2 2 3-3"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <!-- in_progress -->
          <svg
            v-else-if="todo.status === 'in_progress'"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            class="todo-item__spin"
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.2" stroke-dasharray="14 8" />
          </svg>
          <!-- pending -->
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.2" />
          </svg>
        </span>
        <span class="todo-item__text">{{ todo.status === "in_progress" ? todo.activeForm : todo.content }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import Icon from "@/components/Icon/index.vue";

import type { V5ToolPart } from "./AssistantMessage.vue";

interface TodoItem {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm: string;
}

const props = defineProps<{ part: V5ToolPart }>();

const displayTodos = computed<TodoItem[]>(() => {
  const output = props.part.output as { newTodos?: TodoItem[] } | null;
  if (output?.newTodos) {
    return output.newTodos;
  }
  const input = props.part.input as { todos?: TodoItem[] } | null;
  return input?.todos ?? [];
});

const completedCount = computed(() => displayTodos.value.filter((t) => t.status === "completed").length);

const expanded = ref(true);
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.todo-write {
  margin: 6px 0;
  border: 1px solid $color-primary-25;
  border-radius: 6px;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    background: $color-primary-10;
    cursor: pointer;
    user-select: none;
    transition: background $transition-fast;

    &:hover {
      background: $color-primary-18;
    }

    &-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  &__title {
    font-size: 12px;
    color: $color-text-muted;
    letter-spacing: 0.3px;
  }

  &__count {
    font-size: 11px;
    color: $color-text-dim;
    font-family: $font-monospace;
  }
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: $color-bg-tool-body;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  line-height: 1.5;

  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  &__text {
    flex: 1;
    min-width: 0;
  }

  /* pending */
  &.is-pending {
    color: $color-text-dim;

    .todo-item__icon {
      color: $color-text-dim;
    }
  }

  /* in_progress */
  &.is-in_progress {
    color: $color-primary;

    .todo-item__icon {
      color: $color-primary;
    }
  }

  /* completed */
  &.is-completed {
    color: $color-text-dim;
    text-decoration: line-through;
    opacity: 0.6;

    .todo-item__icon {
      color: $color-primary-50;
    }
  }

  /* spin animation for in_progress icon */
  &__spin {
    animation: todo-spin 1.2s linear infinite;
  }
}

@keyframes todo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
