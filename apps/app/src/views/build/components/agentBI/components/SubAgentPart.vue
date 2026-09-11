<template>
  <div class="sub-agent-part">
    <div class="sub-agent-part__header" @click="collapsed = !collapsed">
      <span class="sub-agent-part__name">{{ agentDisplayName }}</span>
      <span :class="['sub-agent-part__badge', isRunning ? 'running' : 'done']">
        {{ isRunning ? "执行中" : "完成" }}
      </span>
      <el-icon :class="['sub-agent-part__chevron', { 'is-collapsed': collapsed }]">
        <ArrowDown />
      </el-icon>
    </div>
    <!-- 折叠时用 v-if 彻底卸载内层 timeline：v-show 只是 display:none，组件仍挂载、仍每帧重渲染，
         子 agent 默认折叠却在后台持续渲染越来越大的列表，是卡顿的主要来源之一 -->
    <div v-if="!collapsed" class="sub-agent-part__body">
      <AssistantMessage :message="syntheticMessage" :is-loading="isRunning" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, shallowRef, watch } from "vue";

import { ArrowDown } from "@element-plus/icons-vue";
import type { UIMessage } from "ai";

import type { V5ToolPart } from "./AssistantMessage.vue";

// 用 defineAsyncComponent 打破与 AssistantMessage 的循环引用
const AssistantMessage = defineAsyncComponent(() => import("./AssistantMessage.vue"));

// ---- 类型定义 ----

interface AgentToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
}

interface AgentToolResult {
  toolCallId: string;
  result: unknown;
  // 顶层 toolResults(尚未折叠进 step)会带这两个字段,合成 step 时需要
  toolName?: string;
  args?: Record<string, unknown>;
}

interface AgentStep {
  text: string;
  reasoning?: string[]; // 该步的思考 token 数组
  reasoningText?: string; // 该步思考的拼接全文（Mastra 提供）
  toolCalls: AgentToolCall[];
  toolResults: AgentToolResult[];
}

interface AgentStreamData {
  id: string;
  text: string;
  reasoning?: string[]; // 模型输出的思考过程文本块（流式累积，每帧为全量）
  toolCalls: AgentToolCall[]; // 当前未完成的 pending tool calls
  toolResults?: AgentToolResult[]; // resume 后的续跑 chunk 偶尔会在顶层带新结果
  steps: AgentStep[];
  status: "running" | "completed";
}

interface SubAgentToolResult {
  toolName: string;
  toolCallId: string;
  result: unknown;
  args: Record<string, unknown>;
}

interface SubAgentOutput {
  text: string;
  subAgentToolResults: SubAgentToolResult[];
}

type StreamingPart = { type: "data-tool-agent"; data: AgentStreamData };
type HistoricalPart = V5ToolPart & { output: SubAgentOutput };

const props = defineProps<{
  part: StreamingPart | HistoricalPart;
}>();

const collapsed = ref(true);

// ---- 工具函数 ----

type UIPart = V5ToolPart | { type: "text"; text: string } | { type: "reasoning"; text: string; state: "done" };

function getStepReasoningText(step: AgentStep): string {
  if (step.reasoningText && step.reasoningText.trim().length > 0) {
    return step.reasoningText;
  }
  return (step.reasoning ?? []).join("");
}

function stepsToUIParts(steps: AgentStep[]): UIPart[] {
  const parts: UIPart[] = [];
  for (const step of steps) {
    // 每个 step 的思考过程：在该步的 text/tool calls 之前渲染
    const reasoningText = getStepReasoningText(step);
    if (reasoningText.trim().length > 0) {
      parts.push({ type: "reasoning", text: reasoningText, state: "done" });
    }
    if (step.text) {
      parts.push({ type: "text", text: step.text });
    }
    for (const tc of step.toolCalls ?? []) {
      const tr = (step.toolResults ?? []).find((r) => r.toolCallId === tc.toolCallId);
      parts.push({
        type: `tool-${tc.toolName}` as `tool-${string}`,
        toolCallId: tc.toolCallId,
        toolName: tc.toolName,
        state: tr ? "output-available" : "input-available",
        input: tc.args,
        output: tr?.result
      } satisfies V5ToolPart);
    }
  }
  return parts;
}

function toolResultsToUIParts(toolResults: SubAgentToolResult[]): V5ToolPart[] {
  return toolResults.map((tr) => ({
    type: `tool-${tr.toolName}` as `tool-${string}`,
    toolCallId: tr.toolCallId,
    toolName: tr.toolName,
    state: "output-available" as const,
    input: tr.args,
    output: tr.result
  }));
}

// ---- 流式增量累积 ----

// 关键事实：readUIMessageStream 每次都 yield 全量 snapshot（不是 delta）。
//
// 两种 step 的身份语义不同：
//   - tool step（含 toolCalls）：身份 = toolCallId 集合；一旦定型不再变化 → 进 committed
//     map，永远不丢、永远不翻车回 pending —— 解决"连续 suspend 时已完成工具回执行中"
//   - text-only step：内容随流式输出增长（text/reasoning 边流边长），没有稳定身份 →
//     不进 committed，每帧从 incoming 取最新版本；通过"挂在哪个 tool step 之后"定位
//
// 算法概览：
//   1. 从 base.steps 抽出 committed tool step（按首次出现顺序）
//   2. incoming.steps + 合成孤儿 → 把新出现的 tool step 追加进 committed
//   3. 把 incoming 中的 text-only step 切分成"段"，每段标注 afterKey（挂在哪个
//      tool step 之后；null = 挂在最前面）
//   4. 按 committedOrder 输出 tool step，每个之后插入对应 afterKey 的 text 段
//
// 后端 snapshot 的"半成品窗口":
//   Mastra 内部事件顺序是 tool-call → tool-result → step-finish。后端推 chunk 的时机
//   独立于这些事件,可能正好在 tool-result 与 step-finish 之间抓拍,导致一帧里:
//     - 顶层 toolResults 已经有这个工具的 result
//     - steps 里却还没有承载它的 step(result 还没被折叠)
//   如果流就此结束(典型:resume 后的工具是 sub-agent 这轮的最后一步),半成品就成
//   定态。→ buildContinuation 必须把"孤儿顶层 toolResults"合成 step,否则工具卡在
//   底部 pending 永远显示"执行中"。
const baseline = shallowRef<AgentStreamData | null>(null);
const accumulated = shallowRef<AgentStreamData | null>(null);

function toolStepKey(s: AgentStep): string {
  if (s.toolCalls.length === 0) {
    return "";
  }
  return s.toolCalls
    .map((c) => c.toolCallId)
    .sort()
    .join("|");
}

function isTextStepMeaningful(s: AgentStep): boolean {
  return (
    s.text.trim().length > 0 ||
    (s.toolResults?.length ?? 0) > 0 ||
    (s.reasoning?.length ?? 0) > 0 ||
    (s.reasoningText?.trim().length ?? 0) > 0
  );
}

function buildContinuation(base: AgentStreamData, incoming: AgentStreamData): AgentStreamData {
  // 1. 抽取 base 中的 committed tool step（按首次出现顺序）
  const committedById = new Map<string, AgentStep>();
  const committedOrder: string[] = [];
  for (const s of base.steps) {
    const k = toolStepKey(s);
    if (k && !committedById.has(k)) {
      committedById.set(k, s);
      committedOrder.push(k);
    }
  }
  const committedCallIds = new Set<string>();
  committedById.forEach((s) => s.toolCalls.forEach((c) => committedCallIds.add(c.toolCallId)));

  // 1b. 计算 baseline 的"在途 trailing reasoning"：顶层 reasoning 减去已 committed step 的部分。
  //     这段 trailing 属于下一个即将形成的 tool step。若该 step 出现时 reasoningText 为空
  //     (Mastra 在工具完成的同一帧重置了顶层 reasoning[])，不注入则思考内容永久丢失。
  const baseCommittedReasoningText = committedOrder.map((k) => getStepReasoningText(committedById.get(k)!)).join("");
  const baseTopReasoningText = (base.reasoning ?? []).join("");
  let baseTrailingReasoning = "";
  if (baseCommittedReasoningText.length === 0) {
    baseTrailingReasoning = baseTopReasoningText;
  } else if (baseTopReasoningText.startsWith(baseCommittedReasoningText)) {
    baseTrailingReasoning = baseTopReasoningText.slice(baseCommittedReasoningText.length);
  }

  // 2. pending pool：已 committed 的工具不能再回到 pending
  const pendingPool = [...base.toolCalls, ...(incoming.toolCalls ?? [])]
    .filter((c, i, arr) => arr.findIndex((x) => x.toolCallId === c.toolCallId) === i)
    .filter((c) => !committedCallIds.has(c.toolCallId));

  // 3. 增强 incoming.steps：若 step 有 toolResults 命中 pending toolCall（resume 后的
  //    续跑 step 常见情况），把对应 toolCall 注入进去
  const incomingAug = (incoming.steps ?? []).map((s) => {
    const matched = pendingPool.filter(
      (c) =>
        (s.toolResults ?? []).some((r) => r.toolCallId === c.toolCallId) &&
        !s.toolCalls.some((c2) => c2.toolCallId === c.toolCallId)
    );
    return matched.length ? { ...s, toolCalls: [...s.toolCalls, ...matched] } : s;
  });

  // 4. 孤儿顶层 toolResults → 合成 step（兜底半成品 snapshot）
  const coveredIds = new Set(incomingAug.flatMap((s) => (s.toolResults ?? []).map((r) => r.toolCallId)));
  const orphans = (incoming.toolResults ?? []).filter(
    (r) => !coveredIds.has(r.toolCallId) && !committedCallIds.has(r.toolCallId)
  );
  const synthetic: AgentStep[] = orphans.map((r) => {
    const pending = pendingPool.find((c) => c.toolCallId === r.toolCallId);
    return {
      text: "",
      reasoning: [],
      toolCalls: [
        pending ?? {
          toolCallId: r.toolCallId,
          toolName: r.toolName ?? "unknown",
          args: r.args ?? {}
        }
      ],
      toolResults: [r]
    };
  });

  // 5. 把新出现的 tool step 加入 committed；对已 committed 的允许"信息量更大"
  //    的版本刷新内容(位置不动)。Mastra 在 step-finish 之前可能就把 step 推到
  //    incoming.steps,此时 reasoning/text/toolResults 都还不完整,后续帧才补全。
  //    锁定首版会导致顶层 reasoning 已长但 step.reasoningText 没跟上,差集
  //    算出的 trailing 把已渲染过的思考又输出到末尾(看起来"被合并")。
  for (const s of [...incomingAug, ...synthetic]) {
    const k = toolStepKey(s);
    if (!k) {
      continue;
    }
    const existing = committedById.get(k);
    if (!existing) {
      // 若新 step 自身没有 reasoning，注入上一帧的 baseTrailingReasoning（该步思考以顶层
      // trailing 形式存在，工具完成时 Mastra 重置 reasoning[]，不注入则永久丢失）
      const stepToCommit =
        getStepReasoningText(s).length === 0 && baseTrailingReasoning.trim().length > 0
          ? { ...s, reasoningText: baseTrailingReasoning }
          : s;
      baseTrailingReasoning = ""; // 只给第一个新 step，后续新 step 有自己的 reasoning
      committedById.set(k, stepToCommit);
      committedOrder.push(k);
      continue;
    }
    // toolResults 权重最高(出现意味着工具已结束);其次 reasoning 长度,再次 text 长度
    const incomingInfo = (s.toolResults?.length ?? 0) * 1_000_000 + getStepReasoningText(s).length + s.text.length;
    const existingInfo =
      (existing.toolResults?.length ?? 0) * 1_000_000 + getStepReasoningText(existing).length + existing.text.length;
    if (incomingInfo > existingInfo) {
      committedById.set(k, s);
    }
  }

  // 6. 切分 incoming 的 text-only step，按"挂在哪个 tool 之后"定位
  //    afterKey === null 表示挂在最开头（任何 tool step 之前）
  const textSegments = new Map<string | null, AgentStep[]>();
  let currentAfter: string | null = null;
  for (const s of incomingAug) {
    const k = toolStepKey(s);
    if (k) {
      currentAfter = k;
    } else if (isTextStepMeaningful(s)) {
      const bucket = textSegments.get(currentAfter) ?? [];
      bucket.push(s);
      textSegments.set(currentAfter, bucket);
    }
  }

  // 7. 按 committedOrder 重组：开头 text 段 + (tool step + 该 step 之后的 text 段)*
  const resultSteps: AgentStep[] = [];
  for (const s of textSegments.get(null) ?? []) {
    resultSteps.push(s);
  }
  for (const k of committedOrder) {
    const step = committedById.get(k);
    if (step) {
      resultSteps.push(step);
    }
    for (const s of textSegments.get(k) ?? []) {
      resultSteps.push(s);
    }
  }

  // 8. 计算 resolvedIds，清理 pending
  const resolvedIds = new Set<string>();
  resultSteps.forEach((s) => (s.toolResults ?? []).forEach((r) => resolvedIds.add(r.toolCallId)));
  (incoming.toolResults ?? []).forEach((r) => resolvedIds.add(r.toolCallId));

  return {
    ...base,
    steps: resultSteps,
    toolCalls: pendingPool.filter((c) => !resolvedIds.has(c.toolCallId)),
    status: incoming.status ?? base.status,
    text: incoming.text || base.text,
    // 顶层 reasoning 仅承担"尚未落入 step 的在途思考"语义，每帧都由 incoming 全量提供，直接覆盖即可；
    // 已经定型的 step 各自带 reasoning，不需要在这里拼接历史。
    reasoning: incoming.reasoning ?? []
  };
}

watch(
  () => props.part,
  (part) => {
    if (part.type !== "data-tool-agent") {
      baseline.value = null;
      accumulated.value = null;
      return;
    }
    const incoming = (part as StreamingPart).data;
    // 永远走 buildContinuation,完事再把 accumulated 提升为新 baseline。
    // 这样合成 step、已完成 tool step 都进入 baseline.steps,后续任何帧
    // (包括 data.id 非空的全量帧)都不会让它们丢位置或翻车成 pending。
    // 唯一例外:还没有 baseline 时(第一帧),直接用 incoming 初始化。
    if (!baseline.value) {
      baseline.value = incoming;
      accumulated.value = incoming;
    } else {
      accumulated.value = buildContinuation(baseline.value, incoming);
      baseline.value = accumulated.value;
    }
  },
  { immediate: true }
);

// ---- 计算属性 ----

const isStreaming = computed(() => props.part.type === "data-tool-agent");

const streamData = computed<AgentStreamData | null>(() => (isStreaming.value ? accumulated.value : null));

const historicalOutput = computed<SubAgentOutput | null>(() =>
  isStreaming.value ? null : ((props.part as HistoricalPart).output ?? null)
);

const isRunning = computed(() => {
  if (isStreaming.value) {
    return streamData.value?.status === "running";
  }
  return (props.part as HistoricalPart).state !== "output-available";
});

const agentDisplayName = computed(() => {
  let rawId: string;
  if (isStreaming.value) {
    rawId = streamData.value?.id ?? "";
  } else {
    const historical = props.part as HistoricalPart;
    rawId = (historical.toolName || historical.type.replace(/^tool-/, "")).replace(/^agent-/, "");
  }
  // "data-flow-verification-agent" → "Data Flow Verification Agent"
  const formatted = rawId
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
});

// 子 agent 每帧都全量重建 parts（全是新对象）。若直接交给内层 AssistantMessage，
// 等于告诉 Vue「所有历史步骤都变了」，其 v-memo 永远命中不了，逐帧重渲染全部步骤（含 markdown 重解析），
// 随步骤数线性增长、按帧数累加成平方级——这是子 agent 越跑越卡的根因。
// 这里做一次引用复用：本帧内容与上帧相同的 part 直接复用旧对象引用，只有真正变化的（流式文本尾部、
// 尚未定型的工具）才换新引用，从而让内层 v-memo 跳过已定型步骤。
let reconciledPartsCache: UIPart[] = [];

/**
 * 判断两个 part 内容是否等价（可安全复用旧引用）。
 * 文本/思考比较文本本身；工具仅在 toolCallId 与 state 相同、且已进入终态（内容已冻结）时判等。
 */
const isPartContentEqual = (a: UIPart, b: UIPart): boolean => {
  if (a.type !== b.type) {
    return false;
  }
  if (a.type === "text" || a.type === "reasoning") {
    return (a as { text: string }).text === (b as { text: string }).text;
  }
  const ta = a as V5ToolPart;
  const tb = b as V5ToolPart;
  if (ta.toolCallId !== tb.toolCallId || ta.state !== tb.state) {
    return false;
  }
  // 同一工具且已是终态：输入输出不再变化，复用旧引用以跳过重渲染
  return ta.state === "output-available" || ta.state === "output-error";
};

/**
 * 按位对齐复用上一帧未变 part 的引用，返回引用尽量稳定的新数组。
 * @param next - 本帧全量重建出的 parts
 */
const reconcileParts = (next: UIPart[]): UIPart[] => {
  const result = next.map((part, i) => {
    const prev = reconciledPartsCache[i];
    return prev && isPartContentEqual(prev, part) ? prev : part;
  });
  reconciledPartsCache = result;
  return result;
};

const syntheticParts = computed<UIPart[]>(() => {
  if (isStreaming.value && streamData.value) {
    const { steps, toolCalls, reasoning } = streamData.value;
    const parts: UIPart[] = [];

    // 各 step 自带 reasoning，渲染在该 step 的 tool calls 之前
    const stepList = steps ?? [];
    parts.push(...stepsToUIParts(stepList));

    // 顶层 reasoning 是全量累积（含已落入 step 的 tokens + 尾部还未成 step 的在途 tokens）。
    // 用「文本前缀差集」而非 token 数量切片：Mastra 可能给 step 填了 reasoningText
    // 却没填 reasoning[] token 数组,按 token 数量切片会把整段顶层 reasoning 误判为
    // trailing,导致"已经渲染过的思考又被合并到末尾再渲染一次"。
    // 只有当顶层文本以已 committed 文本为严格前缀时,后缀部分才是真正的"在途思考"。
    const committedReasoningText = stepList.map(getStepReasoningText).join("");
    const topLevelReasoningText = (reasoning ?? []).join("");
    let trailingText = "";
    if (committedReasoningText.length === 0) {
      trailingText = topLevelReasoningText;
    } else if (topLevelReasoningText.startsWith(committedReasoningText)) {
      trailingText = topLevelReasoningText.slice(committedReasoningText.length);
    }
    if (trailingText.trim().length > 0) {
      parts.push({ type: "reasoning", text: trailingText, state: "done" });
    }

    // 当前 pending 的 tool calls（还未出现在任何 step 中）
    const stepCallIds = new Set(stepList.flatMap((s) => s.toolCalls.map((tc) => tc.toolCallId)));
    for (const tc of toolCalls ?? []) {
      if (!stepCallIds.has(tc.toolCallId)) {
        parts.push({
          type: `tool-${tc.toolName}` as `tool-${string}`,
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          state: "input-available",
          input: tc.args,
          output: undefined
        } satisfies V5ToolPart);
      }
    }
    return reconcileParts(parts);
  }

  if (historicalOutput.value) {
    const { text, subAgentToolResults } = historicalOutput.value;
    const toolParts: UIPart[] = toolResultsToUIParts(subAgentToolResults ?? []);
    if (text) {
      toolParts.push({ type: "text", text });
    }
    return toolParts;
  }

  return [];
});

const syntheticMessage = computed<UIMessage>(() => ({
  id: `sub-agent-${isStreaming.value ? (streamData.value?.id ?? "unknown") : (props.part as HistoricalPart).toolCallId}`,
  role: "assistant",
  content: "",
  parts: syntheticParts.value as UIMessage["parts"]
}));
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.sub-agent-part {
  border: 1px solid $color-primary-40;
  border-radius: 8px;
  overflow: hidden;
  font-size: 12px;
  flex: 1;

  &__header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: $color-primary-10;
    border-bottom: 1px solid $color-primary-10;
    cursor: pointer;
    user-select: none;
  }

  &__indicator {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: $color-primary;
    flex-shrink: 0;
  }

  &__name {
    flex: 1;
    color: $color-primary-name;
    font-size: 12px;
    letter-spacing: 0.3px;
  }

  &__chevron {
    color: $color-primary-name;
    font-size: 11px;
    transition: transform 0.2s ease;

    &.is-collapsed {
      transform: rotate(-90deg);
    }
  }

  &__badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;
    white-space: nowrap;

    &.running {
      background: $color-pending-bg;
      color: $color-pending;
    }

    &.done {
      background: $color-primary-20;
      color: $color-primary-done;
    }
  }

  &__body {
    padding: 16px 8px 4px 16px;
    background: $color-primary-5;

    :deep(.content-msg) {
      margin: 0;
    }

    // 多加 .msg-timeline 使优先级高于外层 timeline-item--tool 规则
    :deep(.msg-timeline .timeline-item--text .el-timeline-item__node) {
      background: $color-text-dim !important;
      border: none !important;
    }

    // el-timeline-item__tail 的 height: 100% 只覆盖 li 的 content-box，
    // 不含 padding-bottom: 10px，导致每条线末端到下一个 dot 之间断 10px。
    // 把 tail 高度延长 10px 吞掉间距，让线视觉连续。
    :deep(.msg-timeline .el-timeline-item__tail) {
      height: calc(100%) !important;
    }

    // 最后一个 item 的 tail 不要显示（agent 结束后该 dot 是终点；流式期间也保持简洁）
    :deep(.msg-timeline .el-timeline-item:last-child .el-timeline-item__tail) {
      display: none !important;
    }

    // 最后一个 item 的 tail 不要显示（agent 结束后该 dot 是终点；流式期间也保持简洁）
    :deep(.msg-timeline .el-timeline-item .el-timeline-item__tail) {
      display: block !important;
    }
  }
}
</style>
