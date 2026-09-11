<template>
  <div class="content-msg">
    <el-timeline :class="['msg-timeline', { 'is-generating': isLoading }]">
      <template
        v-for="(part, i) in normalizedParts as any[]"
        :key="i"
        v-memo="[part, isLoading && i === normalizedParts.length - 1]"
      >
        <el-timeline-item v-if="part.type === 'reasoning'" hide-timestamp class="timeline-item--text">
          <ReasoningPart :part="part" />
        </el-timeline-item>
        <el-timeline-item v-else-if="part.type === 'text'" hide-timestamp class="timeline-item--text">
          <MarkdownContent :content="(part as TextUIPart).text" />
        </el-timeline-item>
        <el-timeline-item v-else-if="part.type === 'data-tool-workflow'" hide-timestamp class="timeline-item--tool">
          <WorkflowMessage :part="part" />
        </el-timeline-item>
        <el-timeline-item v-else-if="part.type === 'data-tool-agent'" hide-timestamp class="timeline-item--tool">
          <SubAgentPart :part="part as any" />
        </el-timeline-item>
        <el-timeline-item
          v-else-if="isToolPart(part)"
          hide-timestamp
          :class="isToolError(part) ? 'timeline-item--tool-error' : 'timeline-item--tool'"
        >
          <WorkflowMessage v-if="isWorkflowTool(getToolName(part))" :part="part" />
          <LayoutTemplateResult v-else-if="isLayoutTool(getToolName(part))" :part="part" />
          <TodoWritePart v-else-if="getToolName(part) === 'todoWrite'" :part="part" />
          <SubAgentPart v-else-if="isAgentTool(getToolName(part))" :part="part as any" />
          <ToolCallPartUI v-else :part="part" />
        </el-timeline-item>
        <el-timeline-item v-else-if="part.type === 'error'" hide-timestamp class="timeline-item--error">
          <span class="error-text">{{ extractErrorMessage(part) }}</span>
        </el-timeline-item>
        <!-- OM 记忆压缩：每个 cycleId 只渲染一次（start 作为锚点，end/failed 通过 map 传入） -->
        <el-timeline-item v-else-if="part.type === 'data-om-buffering-start'" hide-timestamp class="timeline-item--om">
          <OMBufferingPart
            :start-data="(part as RawPart).data as unknown as OmStartData"
            :end-data="omEndMap.get((part as RawPart).data.cycleId as string)"
            :failed-data="omFailedMap.get((part as RawPart).data.cycleId as string)"
          />
        </el-timeline-item>
      </template>
      <!-- 尚无可渲染的 parts 但正在加载时，显示一个占位节点 -->
      <el-timeline-item v-if="isLoading && !hasVisibleParts" hide-timestamp class="timeline-item--placeholder" />
    </el-timeline>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { TextUIPart, UIMessage } from "ai";

import WorkflowMessage from "./figmaToBIMessage/WorkflowMessage.vue";
import LayoutTemplateResult from "./LayoutTemplateResult.vue";
import MarkdownContent from "./MarkdownContent.vue";
import type { OmEndData, OmFailedData, OmStartData } from "./OMBufferingPart.vue";
import OMBufferingPart from "./OMBufferingPart.vue";
import ReasoningPart from "./ReasoningPart.vue";
import SubAgentPart from "./SubAgentPart.vue";
import TodoWritePart from "./TodoWritePart.vue";
import ToolCallPartUI from "./ToolCallPart.vue";

export interface V5ToolPart {
  type: `tool-${string}`;
  toolCallId: string;
  toolName?: string;
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input: unknown;
  output?: unknown;
  errorText?: string;
}

const props = defineProps<{ message: UIMessage; isLoading?: boolean }>();

const isToolPart = (part: { type: string }): part is V5ToolPart => part.type.startsWith("tool-");
const isToolError = (part: V5ToolPart): boolean => part.state === "output-error";
const getToolName = (part: V5ToolPart): string => part.toolName ?? part.type.replace(/^tool-/, "");
const isWorkflowTool = (toolName: string) => toolName.includes("workflow-");
const isLayoutTool = (toolName: string) => toolName.includes("LayoutTemplate");
const isAgentTool = (toolName: string) => toolName.startsWith("agent-");

const hasVisibleParts = computed(() =>
  (props.message.parts as { type: string }[]).some(
    (p) =>
      p.type === "text" || p.type === "reasoning" || p.type === "error" || p.type === "data-tool-agent" || isToolPart(p)
  )
);

const extractErrorMessage = (part: Record<string, unknown>): string => {
  const raw = part.errorText ?? part.error ?? "";
  if (typeof raw !== "string") {
    return String(raw);
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed.message ?? raw;
  } catch {
    return raw;
  }
};

const normalizedParts = computed(() => {
  let parts = props.message.parts.filter((p) => {
    if (p.type === "text" && p.text === "") {
      return false;
    }

    return true;
  });

  const hasStreamingWorkflow = parts.some((p) => p.type === "data-tool-workflow");
  if (hasStreamingWorkflow) {
    // 流式时 data-tool-workflow 已经渲染，过滤掉重复的 tool-workflow-* part
    parts = parts.filter((p) => !(p.type.startsWith("tool-") && isWorkflowTool(getToolName(p as V5ToolPart))));
  }

  const hasStreamingAgent = parts.some((p) => p.type === "data-tool-agent");
  if (hasStreamingAgent) {
    // 流式时 data-tool-agent 已经渲染，过滤掉重复的 tool-agent-* part
    parts = parts.filter((p) => !(p.type.startsWith("tool-") && isAgentTool(getToolName(p as V5ToolPart))));
  }

  return parts;
});

type RawPart = { type: string; data: Record<string, unknown> };

/** cycleId → end data */
const omEndMap = computed(() => {
  const map = new Map<string, OmEndData>();
  for (const part of props.message.parts as RawPart[]) {
    if (part.type === "data-om-buffering-end") {
      map.set(part.data.cycleId as string, part.data as unknown as OmEndData);
    }
  }
  return map;
});

/** cycleId → failed data */
const omFailedMap = computed(() => {
  const map = new Map<string, OmFailedData>();
  for (const part of props.message.parts as RawPart[]) {
    if (part.type === "data-om-buffering-failed") {
      map.set(part.data.cycleId as string, part.data as unknown as OmFailedData);
    }
  }
  return map;
});
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;
$timeline-item-radius: 8px;
// 圆点垂直居中于 part 内容的 36px 最小高度：36/2 - 8/2 = 14px
$timeline-item-top: 14px;

.content-msg {
  margin: 8px 0 0 0;
  color: $color-text-msg;
}

/* ---- el-timeline 覆盖 ---- */
.msg-timeline {
  padding-left: 0 !important;

  :deep(.el-timeline-item) {
    padding-bottom: 16px;

    &:last-child {
      padding-bottom: 0;
    }
  }

  :deep(.timeline-item--reasoning) {
    padding-bottom: 2px !important;
  }

  :deep(.el-timeline-item__tail) {
    transform: translateY($timeline-item-radius + $timeline-item-top) !important;
    left: 3px !important;
    border-left: 2px solid rgba($color-primary-step, 0.2) !important;
  }

  /* ---- 文本节点：浅紫色 ---- */
  :deep(.el-timeline-item__node) {
    width: $timeline-item-radius !important;
    height: $timeline-item-radius !important;
    top: $timeline-item-top;
    left: 0 !important;
    z-index: 1;
    background: $color-text-dim !important;
  }

  /* ---- 思考节点：半透明紫色 ---- */
  :deep(.timeline-item--reasoning .el-timeline-item__node) {
    background: $color-primary-25 !important;
    border: 1.5px solid $color-primary-40 !important;
  }

  /* ---- 工具节点：深紫色，同 10px ---- */
  :deep(.timeline-item--tool .el-timeline-item__node) {
    background: $color-primary !important;
    border: 1.5px solid $color-primary-60 !important;
  }

  /* ---- 文本节点：灰色（覆盖外层 timeline-item--tool 的继承）---- */
  :deep(.timeline-item--text .el-timeline-item__node) {
    background: $color-text-dim !important;
    border: none !important;
  }

  /* ---- 工具错误节点：红色 ---- */
  :deep(.timeline-item--tool-error .el-timeline-item__node) {
    background: #f56c6c !important;
    border: 1.5px solid #f56c6c !important;
  }

  /* ---- 占位节点（无 parts 时）---- */
  :deep(.timeline-item--placeholder .el-timeline-item__node) {
    background: $color-primary-25 !important;
    border: 1.5px solid $color-primary-40 !important;
  }

  /* ---- 错误节点：红色 ---- */
  :deep(.timeline-item--error .el-timeline-item__node) {
    background: #f56c6c !important;
    border: 1.5px solid #f56c6c !important;
  }

  .error-text {
    color: #f56c6c;
    font-size: 13px;
    word-break: break-word;
  }

  /* ---- 生成中：最后一个节点的圆点呼吸动效 ---- */
  &.is-generating :deep(.el-timeline-item:last-child .el-timeline-item__node) {
    animation: node-breath 2.6s ease-in-out infinite;
  }

  /* 内容区 */
  :deep(.el-timeline-item__wrapper) {
    padding-left: 20px;
    top: 0;
  }

  :deep(.el-timeline-item__content) {
    min-height: 36px;
    color: $color-text-msg !important;
    font-size: 13px;
    letter-spacing: 0.5px;
    line-height: 1.7;
    display: flex;
    align-items: center;
  }

  @keyframes node-breath {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(124, 77, 255, 0.5);
      opacity: 0.7;
    }

    50% {
      box-shadow: 0 0 0 5px rgba(124, 77, 255, 0);
      opacity: 1;
    }
  }
}
</style>
