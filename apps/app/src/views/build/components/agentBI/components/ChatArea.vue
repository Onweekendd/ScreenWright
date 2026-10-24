<template>
  <div class="main-area">
    <div class="box-content" ref="msgLayout" @scroll.passive="handleScroll">
      <WelcomeScreen
        :is-visible="showWelcome"
        :examples="examples"
        :capabilities="capabilities"
        @select="handleExampleSelect"
      />
      <div v-if="isLoadingMoreMessages" class="load-more-indicator">
        <span>加载更多...</span>
      </div>
      <template v-for="(item, index) in displayMessages" :key="item.id">
        <UserMessage
          v-if="item.role === 'user'"
          :parts="item.parts"
          :can-undo="canUndoMessage(item.id)"
          @undo="handleUndo(item.id)"
        />
        <AssistantMessage v-else :message="item" :is-loading="isStreaming && index === displayMessages.length - 1" />
      </template>
      <!-- 已发送消息但首个 chunk 还未到达时，显示 loading 占位行 -->
      <AssistantMessage
        v-if="isStreaming && messages[messages.length - 1]?.role === 'user'"
        :message="placeholderMessage"
        :is-loading="true"
      />
    </div>
    <!-- 有审批/提问弹窗时弹窗顶替输入框（v-show 保留草稿），弹窗由 index.vue 排在本区域下方 -->
    <ChatInput v-show="!hasPendingDialog" v-model="inputText" @send="sendMessage()" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

import type { UIMessage } from "ai";
import { ElMessage, ElMessageBox } from "element-plus";

import { useActiveAgentBISession } from "../agentBISessionContext";
import { createAssistantMessageGrouper } from "../hooks/groupAssistantMessages";
import { useAgentBIVersionHistory } from "../hooks/useAgentBIVersionHistory";
import { useConfirm } from "../hooks/useConfirm";
import { useRollbackExecutor } from "../hooks/useRollbackExecutor";
import { useWelcomeScreen } from "../hooks/useWelcomeScreen";
import { useAgentBISessions } from "../useAgentBISessions";
import AssistantMessage from "./AssistantMessage.vue";
import ChatInput from "./ChatInput.vue";
import UserMessage from "./UserMessage.vue";
import WelcomeScreen from "./WelcomeScreen.vue";

// ChatArea 由 index.vue 以 v-if="activeSession" + :key="sessionId" 包裹，切 tab 时整体重挂载，
// 故 setup 阶段激活会话必定存在；直接内联 useAgentBISessions 取用，不再经父层逐层 prop 透传。
const { activeSession } = useAgentBISessions();
const session = activeSession.value;
if (!session) {
  throw new Error("ChatArea 必须在激活会话存在时渲染");
}
const { messages, inputText, isStreaming, hasMoreMessages, isLoadingMoreMessages, loadOlderMessages, sendMessage } =
  session;

const groupMessages = createAssistantMessageGrouper();
const displayMessages = computed(() => groupMessages(messages.value));

// 回退是「当前大屏」级操作，不属于某个会话：版本历史是全局单例，执行器直接操作画布，
// 故直接消费全局 hook，而非经 session 转发。
const { canUndoMessage, fetchRollbackPlan } = useAgentBIVersionHistory();
const { executeRollbackPlan, describeRollbackOps } = useRollbackExecutor();

// 撤销清单里组件标题可能含 < > &，拼进 HTML 前转义，避免破坏结构
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const { isVisible: showWelcome, examples, capabilities } = useWelcomeScreen(messages);

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
watch(hasPendingDialog, async (pending) => {
  if (!pending) {
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
  background-color: $color-primary-5;
  border-top-left-radius: 10px;
  box-shadow: inset -8px 0 12px -6px rgba(0, 0, 0, 0.5);
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
</style>
