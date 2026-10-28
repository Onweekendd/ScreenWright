<template>
  <div class="main-area">
    <div
      v-show="showMessages"
      class="box-content"
      :class="{ 'is-transitioning': welcomeTransitioning }"
      :aria-hidden="welcomeTransitioning || undefined"
      ref="msgLayout"
      @scroll.passive="handleScroll"
    >
      <div v-if="isLoadingMoreMessages" class="load-more-indicator">
        <span>加载更多...</span>
      </div>
      <template v-for="(item, index) in displayMessages" :key="item.id">
        <CompactionSummary
          v-if="isCompactionSummary(item)"
          :message="item"
          :class="{ 'is-compacted': compactedIds.has(item.id) }"
        />
        <UserMessage
          v-else-if="item.role === 'user'"
          :parts="item.parts"
          :can-undo="canUndoMessage(item.id)"
          :class="{ 'is-compacted': compactedIds.has(item.id) }"
          @undo="handleUndo(item.id)"
        />
        <AssistantMessage
          v-else
          :message="item"
          :is-loading="isStreaming && index === displayMessages.length - 1"
          :class="{ 'is-compacted': compactedIds.has(item.id) }"
        />
      </template>
      <!-- 压缩上下文期间对话冻结（输入框同步锁住），完成后摘要插到这里、上文淡化 -->
      <div v-if="compacting" class="compacting-row" role="status">
        <span class="compacting-spinner" />
        <span>正在压缩上下文：较早的对话会整理成一份摘要，完成后继续</span>
      </div>
      <!-- 已发送消息但首个 chunk 还未到达时，显示 loading 占位行 -->
      <AssistantMessage
        v-else-if="isStreaming && messages[messages.length - 1]?.role === 'user'"
        :message="placeholderMessage"
        :is-loading="true"
      />
    </div>
    <!-- 有审批/提问弹窗时弹窗顶替输入框（v-show 保留草稿），弹窗由 index.vue 排在本区域下方 -->
    <WelcomeScreen
      :is-visible="showWelcome"
      :examples="examples"
      :capabilities="capabilities"
      @select="handleExampleSelect"
      @transition-start="welcomeTransitioning = true"
      @layout-change="showMessages = !$event"
      @transition-end="welcomeTransitioning = false"
    >
      <ChatInput v-show="!hasPendingDialog" v-model="inputText" @send="sendMessage()" />
    </WelcomeScreen>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import type { UIMessage } from "ai";
import { ElMessage, ElMessageBox } from "element-plus";

import { useActiveAgentBISession } from "../agentBISessionContext";
import { useRollbackExecutor } from "../hooks/canvas/useRollbackExecutor";
import { compactedMessageIds, isCompactionSummary } from "../hooks/message/compactionSummary";
import { createAssistantMessageGrouper } from "../hooks/message/groupAssistantMessages";
import { useAgentBIVersionHistory } from "../hooks/session/useAgentBIVersionHistory";
import { useConfirm } from "../hooks/ui/useConfirm";
import { useWelcomeScreen } from "../hooks/ui/useWelcomeScreen";
import { useAgentBISessions } from "../useAgentBISessions";
import AssistantMessage from "./AssistantMessage.vue";
import ChatInput from "./ChatInput.vue";
import CompactionSummary from "./CompactionSummary.vue";
import UserMessage from "./UserMessage.vue";
import WelcomeScreen from "./WelcomeScreen.vue";

// ChatArea 由 index.vue 以 v-if="activeSession" + :key="sessionId" 包裹，切 tab 时整体重挂载，
// 故 setup 阶段激活会话必定存在；直接内联 useAgentBISessions 取用，不再经父层逐层 prop 透传。
const { activeSession } = useAgentBISessions();
const session = activeSession.value;
if (!session) {
  throw new Error("ChatArea 必须在激活会话存在时渲染");
}
const {
  messages,
  inputText,
  isStreaming,
  compacting,
  hasMoreMessages,
  isLoadingMoreMessages,
  loadOlderMessages,
  sendMessage
} = session;

const groupMessages = createAssistantMessageGrouper();
const displayMessages = computed(() => groupMessages(messages.value));
/** 已被压缩摘要替代的消息（AI 已看不到原文），淡化显示；合并后的展示行沿用首条消息的 id */
const compactedIds = computed(() => compactedMessageIds(messages.value));

// 回退是「当前大屏」级操作，不属于某个会话：版本历史是全局单例，执行器直接操作画布，
// 故直接消费全局 hook，而非经 session 转发。
const { canUndoMessage, fetchRollbackPlan } = useAgentBIVersionHistory();
const { executeRollbackPlan, describeRollbackOps } = useRollbackExecutor();

// 撤销清单里组件标题可能含 < > &，拼进 HTML 前转义，避免破坏结构
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const { isVisible: showWelcome, examples, capabilities } = useWelcomeScreen(messages);
const showMessages = ref(!showWelcome.value);
const welcomeTransitioning = ref(false);

// 欢迎页示例点击发出的消息包一层 <welcome> 标签，供 agent 识别为
// “从零创建大屏”意图，UserMessage.vue 展示时会提炼出标签内的纯文本
const handleExampleSelect = (prompt: string) => {
  sendMessage(`<welcome>${prompt}</welcome>`);
};

// 点击用户消息上的「撤销到此处」：取回退计划 → 二次确认 → 执行 → 反馈结果
const handleUndo = async (messageId: string) => {
  let plan: Awaited<ReturnType<typeof fetchRollbackPlan>>;
  try {
    plan = await fetchRollbackPlan(messageId);
  } catch {
    ElMessage.error("获取回退计划失败，请重试");
    return;
  }
  if (!plan) {
    return;
  }

  const opLabels = describeRollbackOps(plan);
  if (opLabels.length === 0) {
    ElMessage.info("该提问未产生可回退的改动");
    return;
  }

  // 只列「支持回退」的操作（暂不支持项不展示）；每项形如「xxx 组件 新增 / 更新」
  const listHtml = `
    <div style="margin-bottom:8px">将撤销到此提问前的状态，回退以下 ${opLabels.length} 项改动：</div>
    <ul style="margin:0;padding-left:18px;max-height:220px;overflow:auto">
      ${opLabels.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}
    </ul>`;
  try {
    await ElMessageBox.confirm(listHtml, "撤销到此处", {
      type: "warning",
      dangerouslyUseHTMLString: true,
      confirmButtonText: "撤销",
      cancelButtonText: "取消",
      customClass: "sw-message-box"
    });
  } catch {
    return; // 用户取消
  }

  const result = await executeRollbackPlan(plan);
  if (result.skipped.length > 0) {
    console.warn("[版本回退] 跳过项", result.skipped);
    ElMessage.warning(`已回退 ${result.appliedCount} 项，${result.skipped.length} 项跳过（详见控制台）`);
  } else {
    ElMessage.success(`已回退 ${result.appliedCount} 项改动`);
  }
};

const msgLayout = ref<HTMLDivElement | null>(null);

const placeholderMessage = {
  id: "__loading__",
  role: "assistant" as const,
  content: "",
  parts: [] as UIMessage["parts"]
};

// 弹窗出现时消息区被挤短，滚到底让引出这次提问/审批的那条消息露出来
const { dialogs } = useConfirm();
const { sessionId } = useActiveAgentBISession();
const hasPendingDialog = computed(() => dialogs.value.has(sessionId));
// 压缩提示出现时同样滚到底，让「正在压缩」露出来
watch([hasPendingDialog, compacting], async ([pending, isCompacting]) => {
  if (!pending && !isCompacting) {
    return;
  }
  await nextTick();
  if (msgLayout.value) {
    msgLayout.value.scrollTop = msgLayout.value.scrollHeight;
  }
});

const handleScroll = async () => {
  if (!msgLayout.value || !hasMoreMessages.value || isLoadingMoreMessages.value) {
    return;
  }
  if (msgLayout.value.scrollTop < 80) {
    const prevScrollHeight = msgLayout.value.scrollHeight;
    await loadOlderMessages();
    await nextTick();
    if (msgLayout.value) {
      msgLayout.value.scrollTop = msgLayout.value.scrollHeight - prevScrollHeight;
    }
  }
};
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-width: 0;
  background-color: $color-bg-drawer;
  border-top-left-radius: 10px;
}

// 被压缩掉的上文：仍可查看，但淡化，表明 AI 已经看不到它们；悬停时恢复一些便于阅读
.is-compacted {
  opacity: 0.45;
  filter: saturate(0.6);
  transition:
    opacity $transition-base,
    filter $transition-base;

  &:hover {
    opacity: 0.8;
    filter: none;
  }
}

.compacting-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
  padding: 6px 10px;
  border: 1px dashed $color-primary-25;
  border-radius: 6px;
  background: $color-primary-5;
  font-size: 12px;
  color: $color-text-muted;
}

.compacting-spinner {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border: 1.5px solid $color-primary-20;
  border-top-color: $color-primary-60;
  border-radius: 50%;
  animation: compacting-spin 0.9s linear infinite;
}

@keyframes compacting-spin {
  to {
    transform: rotate(360deg);
  }
}

.load-more-indicator {
  text-align: center;
  padding: 8px 0;
  font-size: 12px;
  color: $color-primary-35;
}

.box-content {
  flex: 1;
  padding: 12px 16px;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;

  &.is-transitioning {
    opacity: 0;
    transform: translateY(6px);
    pointer-events: none;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-primary-20;
    border-radius: 2px;

    &:hover {
      background: $color-primary-35;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .box-content {
    transition: none;
  }

  .compacting-spinner {
    animation: none;
  }
}
</style>
