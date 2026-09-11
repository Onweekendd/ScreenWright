import { computed, ref, shallowRef } from "vue";

import type { CustomStorageThreadType } from "@screenwright/server/rpc";
import { apiClient } from "@screenwright/server/rpc";
import { type ComponentType } from "@screenwright/types";
import type { FileUIPart, UIMessage } from "ai";
import { ElMessage } from "element-plus";

import { mastraClient } from "@/api/mastra";
import { uuid } from "@/utils/utils";

import { useLargeScreenInfo } from "../../useLargeScreenInfo";
import { useAgentAttachment } from "./hooks/useAgentAttachment";
import { useAgentBIMemory } from "./hooks/useAgentBIMemory";
import { type StreamState, useAgentBIStream } from "./hooks/useAgentBIStream";
import { useAgentBISystemContext } from "./hooks/useAgentBISystemContext";
import { useAgentBIThreadList } from "./hooks/useAgentBIThreadList";
import { useAgentBIVersionHistory } from "./hooks/useAgentBIVersionHistory";
import { useBackgroundTask } from "./hooks/useBackgroundTask";
import { useChunkSideEffects } from "./hooks/useChunkSideEffects";
import { useContextWindow } from "./hooks/useContextWindow";
import { useGenerateTitle } from "./hooks/useGenerateTitle";
import { useWorkflowStreamUpdater } from "./hooks/useWorkflowStreamUpdater";
import { agentBITools } from "./tools";
import {
  extractPendingClientTools,
  extractUserText,
  mergeToolResultsIntoMessage,
  shouldContinueProcessing,
  stripExecuteFromTools,
  updateMessageById
} from "./utils";

/**
 * 创建一个独立的 agentBI 会话（一个对话 tab）。
 *
 * 原本是 createGlobalState 单例（一个抽屉只有一个会话），改为每次调用产生一个独立会话，
 * 由 useAgentBISessions 管理整组 tab。各会话各自持有 messages / activeThreadId / isStreaming /
 * abortController / 上下文窗口 / 后台任务，互相隔离、可同时独立流式。
 *
 * sessionId 独立于 activeThreadId：新对话在首次发消息前 activeThreadId 为空，需要一个稳定的
 * key 贯穿整个 tab 生命周期，用于 useConfirm（审批按 tab 隔离）与 useBackgroundTask 的隔离。
 */
export function createAgentBISession() {
  const sessionId = uuid();

  const messages = shallowRef<UIMessage[]>([]);

  const inputText = ref("");
  const isStreaming = ref(false);
  const isGeneratingTitle = ref(false);
  const { compacting, contextColor, contextPercentage, contextTooltip, lastUsage, requestCompact } = useContextWindow();
  const { navInfo } = useLargeScreenInfo();

  // 共享的历史线程列表（同一大屏所有 tab 共用一份）
  const { memoryThreads, queryMemory } = useAgentBIThreadList();

  // 大屏版本回退节点（同一大屏所有 tab 共用一份）：撤销某条提问时按 messageId 查锚点
  const { nodes: versionNodes, nodesByMessageId, refreshVersionNodes } = useAgentBIVersionHistory();

  const {
    addFiles,
    attachments,
    clearAttachments,

    removeAttachment,
    uploadAllAndGetParts
  } = useAgentAttachment();

  const { backgroundTasks, runningTaskCount, splitBackgroundTaskChunkFromMainStream } = useBackgroundTask(sessionId);

  const { buildSystemContext } = useAgentBISystemContext();
  useWorkflowStreamUpdater();
  const mentionedComponents = shallowRef<ComponentType[]>([]);

  const resourceId = computed(() => `${navInfo.value.id}`);
  const activeTab = ref<"chat" | "history">("chat");

  // 当前线程标题（每个 tab 各自展示自己线程的标题）
  const currentThreadTitle = computed(() => {
    if (!activeThreadId.value) {
      return "新对话";
    }
    const thread = memoryThreads.value.find((t) => t.id === activeThreadId.value);
    return thread?.title ?? "新对话";
  });

  const updateMessagesBy = (fn: () => UIMessage[]) => {
    messages.value = fn();
  };

  const {
    activeThreadId,
    applyLocalMode,
    currentMode,
    ensureActiveThread,
    hasMoreMessages,
    isLoadingMoreMessages,
    isLoadingThreadMessages,
    loadOlderMessages,
    loadThreadMessages,
    startNewChat,
    updateThreadMode
  } = useAgentBIMemory({
    lastUsage,
    memoryThreads,
    messages,
    resourceId,

    updateMessagesBy
  });

  const { consumeSSEResponse } = useAgentBIStream();
  const { createSideEffectTransform } = useChunkSideEffects({
    activeThreadId,
    applyLocalMode,
    lastUsage,
    sessionId,
    // 后端提交落地后顺流推 data-version-committed，收到即刷新回退列表（消除提交/刷新竞态）
    onVersionCommitted: refreshVersionNodes
  });

  const { callGenerateTitle } = useGenerateTitle({ activeThreadId, memoryThreads, queryMemory });

  let abortController: AbortController | null = null;

  const stopStreaming = () => {
    abortController?.abort();
    isStreaming.value = false;
  };

  /**
   * 构造当前用户消息（将系统上下文合并进用户消息，用 XML 标签区分）
   */
  const buildCurrentUserMessage = ({
    currentText,
    fileParts = [],
    systemContext,

    userInput
  }: {
    userInput: string | UIMessage | undefined;
    currentText: string;
    systemContext?: string;
    fileParts?: FileUIPart[];
  }): UIMessage => {
    if (typeof userInput === "object" && userInput !== null) {
      return userInput;
    }
    const content = systemContext ? `${systemContext}\n\n<user-message>\n${currentText}\n</user-message>` : currentText;
    return {
      content,
      id: uuid(),
      parts: [{ text: content, type: "text" }, ...fileParts],
      role: "user"
    } as UIMessage;
  };

  /**
   * 执行客户端工具
   */
  const executeClientTools = async (
    finalMessage: UIMessage
  ): Promise<{ toolResults: Array<{ toolCallId: string; result: unknown }>; pendingTools: any[] } | null> => {
    const toolNames = new Set(Object.keys(agentBITools));
    const pendingTools = extractPendingClientTools(finalMessage, toolNames);

    if (pendingTools.length === 0) {
      return null;
    }

    const toolResults = await Promise.all(
      pendingTools.map(async (p: any) => {
        const tool = agentBITools[p.toolName as keyof typeof agentBITools];
        let result: unknown = null;
        try {
          // @ts-expect-error 可以不入上下文的参数
          result = await tool.execute?.(p.input);
        } catch (error) {
          result = { error: String(error) };
        }
        return { result, toolCallId: p.toolCallId };
      })
    );

    return { pendingTools, toolResults };
  };

  /**
   * 处理错误状态
   */
  const handleSendError = (assistantId: string) => {
    // 确保流状态被重置，防止界面卡住无法发送下一条消息
    if (isStreaming.value) {
      isStreaming.value = false;
    }

    updateMessagesBy(() =>
      messages.value.map((m) => {
        if (m.id !== assistantId) {
          return m;
        }
        return { ...m, parts: [{ text: "请求失败，请稍后重试。", type: "text" }] };
      })
    );
  };

  /**
   * 处理 Agent 流和 clientTool 循环（内部函数）
   * @param mergeIntoId 若提供，将续流 parts 追加到该消息
   *
   * 注：suspend/resume 不再走本函数。suspend 时由 useChunkSideEffects 直接 fire-and-forget
   * 调 POST /bi-chat/resume，续接帧顺着同一条会话流回来，consumeSSEResponse 持续消费即可。
   */
  const processAgentStream = async (mergeIntoId?: string): Promise<void> => {
    if (!isStreaming.value) {
      return;
    }

    let streamState: StreamState = { currentMessageId: mergeIntoId ?? "", finalMessage: null };

    try {
      abortController = new AbortController();
      const signal = abortController.signal;

      // memory 已开启：只发送本轮新增的最后一条消息，完整历史由后端基于 threadId
      // 从 storage 经 lastMessages 加载，避免与 storage 历史重复。
      //   路径①新提问 → 最后一条是新用户消息；
      //   路径③clientTool 续流 → 最后一条是已合并 tool 结果的 assistant 消息。
      // 该「最后一条」与改动前发送的完整数组末项完全一致，仅去掉了与 storage 重复的历史。
      // （resume 不走这里——见 useChunkSideEffects 的 POST /bi-chat/resume）
      const lastMessage = messages.value[messages.value.length - 1];
      const response = await apiClient.customApi["bi-chat"].$post(
        {
          json: {
            clientTools: stripExecuteFromTools(agentBITools),
            messages: (lastMessage ? [lastMessage] : []) as UIMessage[],
            resourceId: resourceId.value,
            threadId: activeThreadId.value!
          }
        },
        { init: { signal } }
      );

      streamState = await consumeSSEResponse(
        response,
        messages.value,
        [splitBackgroundTaskChunkFromMainStream({ activeThreadId }), createSideEffectTransform],
        { messages, updateMessagesBy, mergeIntoId, signal }
      );

      // suspend/resume 由 useChunkSideEffects 在流内直接触发（POST /bi-chat/resume），
      // 续接帧顺同一条流回来，这里不再重发。本块只剩 clientTool 循环。
      if (streamState.finalMessage && isStreaming.value) {
        const toolExecution = await executeClientTools(streamState.finalMessage);

        if (toolExecution) {
          const assistantWithResults = mergeToolResultsIntoMessage(streamState.finalMessage, toolExecution.toolResults);
          updateMessagesBy(() =>
            updateMessageById(messages.value, streamState.currentMessageId, () => assistantWithResults)
          );

          // clientTool 循环：续流 parts 追加到同一条消息
          await processAgentStream(streamState.currentMessageId);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      console.error("[processAgentStream] error", { err, mergeIntoId });
      handleSendError(streamState.currentMessageId);
    }
  };

  /**
   * 发送消息给 AI Agent（带 clientTool 循环）
   *
   * 只发送当前用户消息，后端基于 threadId 获取完整历史记录。
   * 流结束后检测 input-available 状态的 clientTool parts，执行后递归重新请求。
   */
  const sendMessage = async (userMessageOrText?: string | UIMessage): Promise<void> => {
    const text = extractUserText(userMessageOrText, inputText.value);

    if (!text || !shouldContinueProcessing(isStreaming.value, false)) {
      return;
    }

    try {
      await ensureActiveThread();
    } catch (err) {
      console.error("Failed to ensure active thread:", err);
      ElMessage.error("创建对话失败，请稍后重试。");
      return;
    }

    // 先上传附件，拿到 FileUIPart 列表
    const fileParts = await uploadAllAndGetParts(activeThreadId.value ?? undefined);

    // 构造当前用户消息（含编辑器上下文）
    const systemContext = buildSystemContext(mentionedComponents.value);
    const userMessage = buildCurrentUserMessage({
      currentText: text,
      fileParts,
      systemContext,

      userInput: userMessageOrText
    });

    // 立即添加用户消息到 UI，清空附件
    updateMessagesBy(() => [...messages.value, userMessage]);
    clearAttachments();
    isStreaming.value = true;

    // 用户提问时立即触发标题生成（仅携带用户消息），与 assistant 流并行
    isGeneratingTitle.value = true;
    const titlePromise = callGenerateTitle([userMessage]).finally(() => {
      isGeneratingTitle.value = false;
    });

    try {
      await processAgentStream();
    } finally {
      isStreaming.value = false;
    }

    await titlePromise;

    // 主路径：后端提交落地后会顺流推 data-version-committed，由 onVersionCommitted 刷新（见上）。
    // 这里再刷一次仅作兜底——覆盖「提交事件因流已断/会话空闲关闭而没送达」的极端情况；
    // 与事件触发的刷新并发时会被 refreshVersionNodes 的 isLoading 守卫自然去重。
    void refreshVersionNodes();
  };

  const switchToNewChat = () => {
    stopStreaming();
    startNewChat();
    activeTab.value = "chat";
  };

  const switchToChatFromHistory = async (thread: CustomStorageThreadType) => {
    stopStreaming();
    // 消息（按线程）与版本节点（按大屏）并行拉：加载对话时一并拿到每条提问的撤销锚点
    await Promise.all([loadThreadMessages(thread), refreshVersionNodes()]);
    activeTab.value = "chat";
  };

  return {
    activeTab,
    activeThreadId,
    addFiles,
    attachments,
    backgroundTasks,
    compacting,
    contextColor,
    contextPercentage,
    contextTooltip,
    currentMode,
    currentThreadTitle,
    hasMoreMessages,
    inputText,
    isGeneratingTitle,
    isLoadingMoreMessages,
    isLoadingThreadMessages,
    isStreaming,
    lastUsage,
    loadOlderMessages,
    loadThreadMessages,
    mastraClient,
    mentionedComponents,

    messages,
    removeAttachment,
    requestCompact,
    resourceId,
    runningTaskCount,
    sendMessage,
    sessionId,
    startNewChat,
    stopStreaming,
    switchToChatFromHistory,
    switchToNewChat,
    updateThreadMode,
    versionNodes,
    nodesByMessageId,
    refreshVersionNodes
  };
}

export type AgentBISession = ReturnType<typeof createAgentBISession>;
