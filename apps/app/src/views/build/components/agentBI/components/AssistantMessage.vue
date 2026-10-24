<template>
  <div class="content-msg">
    <el-timeline :class="['msg-timeline', { 'is-generating': isLoading }]">
      <TransitionGroup
        :css="false"
        @enter="expandStep"
        @leave="collapseStep"
        @enter-cancelled="cancelStepAnimation"
        @leave-cancelled="cancelStepAnimation"
      >
        <el-timeline-item
          v-for="(row, i) in displayRows as any[]"
          :key="row.key"
          v-memo="[row.part, processExpanded, isLoading && i === displayRows.length - 1]"
          hide-timestamp
          :class="row.className"
        >
          <ExecutionProcessBlock
            v-if="row.part.type === 'data-execution-process'"
            :tool-count="row.part.toolCount"
            :running="row.part.running"
            :expanded="processExpanded"
            @toggle="manualProcessExpanded = !processExpanded"
          />
          <ReasoningPart v-else-if="row.part.type === 'reasoning'" :part="row.part" />
          <MarkdownContent v-else-if="row.part.type === 'text'" :content="(row.part as TextUIPart).text" />
          <WorkflowMessage v-else-if="row.part.type === 'data-tool-workflow'" :part="row.part" />
          <SubAgentPart v-else-if="row.part.type === 'data-tool-agent'" :part="row.part" />
          <template v-else-if="isToolPart(row.part)">
            <WorkflowMessage v-if="isWorkflowTool(getToolName(row.part))" :part="row.part" />
            <LayoutTemplateResult v-else-if="isLayoutTool(getToolName(row.part))" :part="row.part" />
            <TodoWritePart v-else-if="getToolName(row.part) === 'todoWrite'" :part="row.part" />
            <SubAgentPart v-else-if="isAgentTool(getToolName(row.part))" :part="row.part" />
            <ToolCallPartUI v-else :part="row.part" />
          </template>
          <span v-else-if="row.part.type === 'error'" class="error-text">{{ extractErrorMessage(row.part) }}</span>
          <OMBufferingPart
            v-else-if="row.part.type === 'data-om-buffering-start'"
            :start-data="(row.part as RawPart).data as unknown as OmStartData"
            :end-data="omEndMap.get((row.part as RawPart).data.cycleId as string)"
            :failed-data="omFailedMap.get((row.part as RawPart).data.cycleId as string)"
          />
        </el-timeline-item>
      </TransitionGroup>
      <!-- 尚无可渲染的 parts 但正在加载时，显示一个占位节点 -->
      <el-timeline-item v-if="isLoading && !hasVisibleParts" hide-timestamp class="timeline-item--placeholder" />
    </el-timeline>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";

import type { TextUIPart, UIMessage } from "ai";

import { type AssistantDisplayPart, groupAssistantParts } from "../hooks/groupAssistantParts";
import ExecutionProcessBlock from "./ExecutionProcessBlock.vue";
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

const groupedParts = computed(() => groupAssistantParts(normalizedParts.value, props.isLoading));
const manualProcessExpanded = ref(false);
const processExpanded = computed(() => manualProcessExpanded.value);
const displayParts = computed(() =>
  processExpanded.value ? groupAssistantParts(normalizedParts.value, props.isLoading, true) : groupedParts.value
);

// 使用原始 part 序号作 key，收起过程时正文不会被当成工具节点替换。
const displayRows = computed(() => {
  const indices = new Map<AssistantDisplayPart, number[]>();
  normalizedParts.value.forEach((part, index) => {
    const occurrences = indices.get(part) ?? [];
    occurrences.push(index);
    indices.set(part, occurrences);
  });
  return displayParts.value.flatMap((part) => {
    const originalIndex = indices.get(part)?.shift();
    // 流中还会透传 SDK 标准 part 联合之外的 error 帧。
    const type = String(part.type);
    const className =
      type === "data-execution-process"
        ? "timeline-item--process"
        : type === "text" || type === "reasoning"
          ? "timeline-item--text"
          : isToolPart(part)
            ? isToolError(part)
              ? "timeline-item--tool-error"
              : "timeline-item--tool"
            : type === "data-tool-workflow" || type === "data-tool-agent"
              ? "timeline-item--tool"
              : type === "error"
                ? "timeline-item--error"
                : type === "data-om-buffering-start"
                  ? "timeline-item--om"
                  : "";
    if (!className) {
      return [];
    }
    return [{ part, className, key: type === "data-execution-process" ? "process" : `part-${originalIndex}` }];
  });
});

const stepAnimations = new Map<HTMLElement, { cancel: () => void }>();
const cancelStepAnimation = (element: Element) => stepAnimations.get(element as HTMLElement)?.cancel();
const animateStep = (element: Element, done: () => void, expanding: boolean) => {
  const node = element as HTMLElement;
  cancelStepAnimation(node);
  if (typeof node.animate !== "function" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    done();
    return;
  }
  const previousBoxSizing = node.style.boxSizing;
  const height = node.getBoundingClientRect().height;
  const padding = getComputedStyle(node).paddingBottom;
  node.style.boxSizing = "border-box";
  const closed = { height: "0px", paddingBottom: "0px", opacity: 0 };
  const opened = { height: `${height}px`, paddingBottom: padding, opacity: 1 };
  const options = {
    duration: 240,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)"
  };
  const animation = node.animate(expanding ? [closed, opened] : [opened, closed], options);
  // 只裁剪正文，连线位于 wrapper 外，必须能跨越节点底部连接下一个圆点。
  const wrapper = node.querySelector<HTMLElement>(".el-timeline-item__wrapper");
  const clipFrames = [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0)" }];
  const contentAnimation = wrapper?.animate(expanding ? clipFrames : [...clipFrames].reverse(), options);
  let finished = false;
  const finish = () => {
    if (finished) {
      return;
    }
    finished = true;
    contentAnimation?.cancel();
    node.style.boxSizing = previousBoxSizing;
    stepAnimations.delete(node);
    done();
  };
  animation.onfinish = finish;
  animation.oncancel = finish;
  stepAnimations.set(node, {
    cancel: () => {
      animation.cancel();
      finish();
    }
  });
};
const expandStep = (element: Element, done: () => void) => animateStep(element, done, true);
const collapseStep = (element: Element, done: () => void) => animateStep(element, done, false);
onUnmounted(() => stepAnimations.forEach((animation) => animation.cancel()));

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
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--sw-theme-color) 50%, transparent);
      opacity: 0.7;
    }

    50% {
      box-shadow: 0 0 0 5px color-mix(in srgb, var(--sw-theme-color) 0%, transparent);
      opacity: 1;
    }
  }
}
</style>
