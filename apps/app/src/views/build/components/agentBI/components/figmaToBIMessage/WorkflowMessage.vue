<template>
  <!-- 不是 workflow 类型或没有 steps 时，使用标准 tool call 格式 -->
  <!-- <ToolCallPartUI v-if="isToolCallFormat || !isWorkflowTool" :part="displayPart" /> -->

  <!-- steps format: show workflow step list -->
  <div class="tool-call">
    <div class="tool-call__header" @click="expanded = !expanded">
      <div class="tool-call__header-left">
        <Icon type="iconfont-gongjv" style="font-size: 13px" />
        <span class="tool-call__name">{{ workflowData?.name || toolName }}</span>
        <span v-if="!isFinish" class="tool-call__badge pending">执行中...</span>
        <span v-else class="tool-call__badge done">完成</span>
      </div>
      <Icon
        :type="expanded ? 'iconfont-shangjiantou' : 'iconfont-xiajiantou'"
        style="font-size: 11px; color: color-mix(in srgb, var(--sw-theme-color) 60%, transparent)"
      />
    </div>
    <!-- 当前正在转化的组件 -->
    <div v-if="currentComponentName && !isFinish" class="tool-call__current">
      <span class="loading-spinner" />
      <span class="current-text">正在添加：{{ currentComponentTitle }}</span>
    </div>
    <!-- 节点转换统计信息 -->
    <div v-if="statistics && isFinish" class="tool-call__statistics">
      <div class="statistics-header">{{ statistics.message }}</div>
      <div class="statistics-details">
        <div v-for="(detail, index) in statistics.details" :key="index" class="statistics-item">
          {{ detail }}
        </div>
      </div>
    </div>
    <WorkflowStepMessage :expanded="expanded" :steps="stepStates" />
    <!-- input / output（历史记录场景）-->
    <Transition name="collapse">
      <div v-if="expanded && (hasInput || isFinish)" class="tool-call__body">
        <div v-if="hasInput" class="tool-call__section">
          <span class="tool-call__label">输入</span>
          <pre class="tool-call__code">{{ formatJson(part.input) }}</pre>
        </div>
        <div v-if="isFinish && part.output" class="tool-call__section">
          <span class="tool-call__label">输出</span>
          <pre class="tool-call__code">{{ formatJson(part.output) }}</pre>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import Icon from "@/components/Icon/index.vue";

import { useFigmaToBI } from "../../hooks/useFigmaToBI";
import WorkflowStepMessage from "./WorkflowStepMessage.vue";

const expanded = ref(false);

const props = defineProps<{
  part: {
    type: string;
    data?: {
      name?: string;
      steps?: Record<string, unknown>;
      progress?: { current: number; total: number; message: string };
      statistics?: {
        total: number;
        success: number;
        failed: number;
        skipped: number;
        message: string;
        details: string[];
      };
      output?: unknown;
    };
    input?: unknown;
    output?: unknown;
    toolName?: string;
    toolCallId?: string;
    state?: string;
  };
}>();

const hasInput = computed(() => {
  const input = props.part.input;
  return input !== null && input !== undefined && Object.keys(input as object).length > 0;
});

const formatJson = (val: unknown): string => {
  try {
    if (typeof val === "string") {
      try {
        return JSON.stringify(JSON.parse(val), null, 2);
      } catch {
        return val;
      }
    }
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
};

// 获取当前正在添加的组件
const { currentAddingComponent } = useFigmaToBI();

const toolName = computed(() =>
  (props.part.toolName ?? props.part.type.replace(/^tool-/, "")).replace(/^workflow-/, "")
);

// 获取 workflow 数据（data-tool-workflow 类型有 data 字段，tool 类型有 output 字段）
const workflowData = computed(() => {
  // 优先从 data 字段获取（data-tool-workflow 类型）
  if (props.part.data) {
    return props.part.data;
  }
  // 备用从 output 字段获取（tool 类型）
  return props.part.output as
    | {
        name?: string;
        steps?: Record<string, unknown>;
        progress?: { current: number; total: number; message: string };
        statistics?: {
          total: number;
          success: number;
          failed: number;
          skipped: number;
          message: string;
          details: string[];
        };
        result?: Array<{ name: string; type: string }>;
        output?: unknown;
      }
    | null
    | undefined;
});

const stepStates = computed(() => {
  const steps = workflowData.value?.steps as Record<string, unknown> | undefined;
  return Object.entries(steps ?? {}).map(([id, step]) => ({ id, ...(step as object) }));
});

// 判断工作流是否完成：
// 1. tool 类型：state === "output-available"
// 2. data-tool-workflow 类型：后端注入了 statistics（node-convert-to-bi-step 完成的标志）
// 3. 进度到达 100%
const isFinish = computed(() => {
  if (props.part.state === "output-available") {
    return true;
  }
  if (workflowData.value?.statistics) {
    return true;
  }
  if (progress.value && progress.value.current >= progress.value.total) {
    return true;
  }
  return false;
});

// 进度信息
const progress = computed(
  () => workflowData.value?.progress as { current: number; total: number; message: string } | undefined
);

// 统计信息：优先使用后端给的 statistics；否则从最终 output.result 列表合成
const statistics = computed(() => {
  if (workflowData.value?.statistics) {
    return workflowData.value.statistics;
  }
  const result = (workflowData.value as any)?.result;
  if (!Array.isArray(result) || result.length === 0) {
    return undefined;
  }
  const typeCounts: Record<string, number> = {};
  for (const item of result) {
    if (!item?.type) {
      continue;
    }
    typeCounts[item.type] = (typeCounts[item.type] ?? 0) + 1;
  }
  return {
    total: result.length,
    success: result.length,
    failed: 0,
    skipped: 0,
    message: `已转化 ${result.length} 个组件`,
    details: Object.entries(typeCounts).map(([type, count]) => `${type}: ${count}`)
  };
});

// 当前正在转化的组件类型
const currentComponentName = computed(() => currentAddingComponent.value?.component?.name || "");
// 当前正在转化的组件名称
const currentComponentTitle = computed(() => currentAddingComponent.value?.name || "");
</script>

<style lang="scss" scoped>
@use "../../styles/variables" as *;

.tool-call {
  margin: 6px 0;
  border: 1px solid $color-primary-25;
  border-radius: 6px;
  overflow: hidden;
  font-size: 12px;
  flex: 1;

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
      gap: 6px;
    }
  }

  &__name {
    color: $color-text-dim;
    font-family: $font-monospace;
  }

  &__body {
    padding: 8px 10px;
    background: $color-bg-tool-body;
    border-top: 1px solid $color-primary-10;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    font-size: 11px;
    color: $color-text-dim;
    letter-spacing: 0.3px;
  }

  &__code {
    margin: 0;
    padding: 8px 10px;
    background: $color-bg-code;
    border: 1px solid $color-primary-10;
    border-radius: 4px;
    color: $color-code-text;
    font-family: $font-monospace;
    font-size: 11px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: $color-primary-25;
      border-radius: 2px;
    }
  }

  &__badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;

    &.pending {
      background: $color-pending-bg;
      color: $color-pending;
    }

    &.done {
      background: $color-primary-20;
      color: $color-primary-done;
    }
  }

  &__progress {
    padding: 8px 10px;
    background: $color-bg-step-body;
    border-top: 1px solid $color-primary-10;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__current {
    padding: 8px 10px;
    background: $color-bg-step-body;
    border-top: 1px solid $color-primary-10;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__statistics {
    padding: 8px 10px;
    background: $color-bg-step-body;
    border-top: 1px solid $color-primary-10;
  }
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid color-mix(in srgb, var(--sw-theme-color) 20%, transparent);
  border-top-color: $color-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.current-text {
  font-size: 11px;
  color: $color-text-secondary;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: color-mix(in srgb, var(--sw-theme-color) 20%, transparent);
  border-radius: 2px;
  overflow: hidden;

  &__fill {
    height: 100%;
    background: linear-gradient(
      90deg,
      $color-primary,
      color-mix(in srgb, var(--sw-theme-color) 90%, white)
    );
    border-radius: 2px;
    transition: width 0.3s ease;
  }
}

.progress-text {
  font-size: 11px;
  color: $color-text-secondary;
}

.statistics-header {
  font-size: 12px;
  font-weight: 500;
  color: $color-text-primary;
  margin-bottom: 6px;
}

.statistics-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.statistics-item {
  font-size: 11px;
  color: $color-text-secondary;
  font-family: $font-monospace;
}

.collapse-enter-active,
.collapse-leave-active {
  transition:
    opacity $transition-base ease,
    max-height 0.25s ease;
  max-height: 400px;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
