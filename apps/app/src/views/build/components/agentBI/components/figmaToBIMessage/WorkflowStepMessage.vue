<template>
  <Transition name="collapse">
    <div v-if="expanded" class="tool-call__body">
      <slot>
        <div v-for="step in steps" :key="step.id" class="tool-call__step">
          <!-- 步骤名称：优先显示中文名，否则显示 ID -->
          <span class="tool-call__step-name">{{ getStepName(step) }}</span>
          <!-- 状态徽章 -->
          <span v-if="getStepStatus(step) === 'running'" class="tool-call__badge processing">执行中...</span>
          <span v-else-if="getStepStatus(step) === 'success'" class="tool-call__badge done">完成</span>
          <span v-else class="tool-call__badge pending">等待中</span>
        </div>
      </slot>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  expanded: boolean;
  steps?: Array<{ id: string; [key: string]: unknown }>;
}>();

const getStepName = (step: { id: string; [key: string]: unknown }) => (step.name as string) || step.id;

const getStepStatus = (step: { [key: string]: unknown }) => (step.status as string) || "pending";
</script>

<style lang="scss" scoped>
@use "../../styles/variables" as *;

.tool-call__body {
  padding: 8px 10px;
  background: $color-bg-step-body;
  border-top: 1px solid $color-primary-10;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tool-call__step {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-call__step-name {
  color: $color-text-secondary;
  font-family: $font-monospace;
  font-size: 11px;
}

.tool-call__badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;

  &.pending {
    background: $color-pending-bg;
    color: $color-pending;
  }

  &.processing {
    background: rgba($color-primary, 0.2);
    color: $color-primary;
  }

  &.done {
    background: $color-success-bg;
    color: $color-success;
  }
}

.collapse-enter-active,
.collapse-leave-active {
  transition:
    opacity $transition-base ease,
    max-height 0.25s ease;
  max-height: 300px;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
