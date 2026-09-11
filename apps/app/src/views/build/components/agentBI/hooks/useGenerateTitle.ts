import type { Ref } from "vue";

import type { CustomStorageThreadType } from "@screenwright/server/rpc";
import { apiClient } from "@screenwright/server/rpc";
import type { UIMessage } from "ai";
import { readUIMessageStream } from "ai";

import { parseChatSseStream } from "../utils";

export function useGenerateTitle(deps: {
  activeThreadId: Ref<string | undefined>;
  memoryThreads: Ref<CustomStorageThreadType[]>;
  queryMemory: () => void;
}) {
  const { activeThreadId, memoryThreads, queryMemory } = deps;

  const isNewConversation = (): boolean => {
    if (!activeThreadId.value) {
      return false;
    }
    const thread = memoryThreads.value.find((t) => t.id === activeThreadId.value);
    return !thread || thread.title === "新对话";
  };

  /**
   * 调用后端标题生成接口，为新对话自动生成标题并更新 memoryThreads
   * @param currentMessages - 当前对话的所有消息，用于传给后端生成标题
   */
  const callGenerateTitle = async (currentMessages: UIMessage[]) => {
    if (!isNewConversation()) {
      return;
    }

    const threadId = activeThreadId.value!;
    try {
      const response = await apiClient.customApi["bi-chat"]["generate-title"].$post({
        json: { messages: currentMessages as any, threadId }
      });

      for await (const msg of readUIMessageStream({ stream: parseChatSseStream(response) as any })) {
        const textPart = msg.parts?.findLast((p: { type: string }) => p.type === "text");
        if (!textPart || !("text" in textPart)) {
          continue;
        }
        const title = (textPart as { text: string }).text;
        const idx = memoryThreads.value.findIndex((t) => t.id === threadId);
        if (idx !== -1) {
          memoryThreads.value.splice(idx, 1, { ...memoryThreads.value[idx], title });
        }
      }
      queryMemory();
    } catch (_err) {
      // 标题生成失败不影响主流程
    }
  };

  return { callGenerateTitle };
}
