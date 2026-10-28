import { computed, type Ref, ref, watch } from "vue";

import { ElMessage } from "element-plus";

import {
  type AiModelVo,
  getAiModels,
  getThreadModels,
  setThreadModel,
  type ThreadModelRole,
  type ThreadModelSelection
} from "@/api/aiModel";

/** 全部模型配置：同一页面所有会话 tab 共用一份，打开模型选择器时刷新（设置页可能刚改过） */
const allModels = ref<AiModelVo[]>([]);

export const refreshAiModels = async (): Promise<void> => {
  try {
    allModels.value = await getAiModels();
  } catch (e) {
    ElMessage.error(`加载模型列表失败：${(e as Error).message}`);
  }
};

/**
 * 单个会话 tab 的模型选择。
 *
 * `selection` 只记覆盖了默认的角色；没记的角色用默认（设置页里标「默认」的那条）。
 * 选中默认那条等于「跟随默认」，存成删除覆盖——以后在设置页换默认，这个对话也跟着换。
 *
 * 对话还没创建时（新对话首条消息前）只改本地，`ensureActiveThread` 建对话时把 selection 一并带上；
 * 已有对话则立即写后端。切换对话时从后端重新拉；回到新对话时清空，新对话一律从默认开始。
 */
export function useThreadModels(activeThreadId: Ref<string | undefined>) {
  const selection = ref<ThreadModelSelection>({});

  const optionsOf = (role: ThreadModelRole) => allModels.value.filter((m) => m.role === role);

  const defaultOf = (role: ThreadModelRole) => optionsOf(role).find((m) => m.isDefault);

  /** 该角色实际生效的配置：覆盖指向的配置已被删时回退默认，与后端解析规则一致 */
  const effectiveModel = (role: ThreadModelRole): AiModelVo | undefined => {
    const id = selection.value[role];
    return optionsOf(role).find((m) => m.id === id) ?? defaultOf(role);
  };

  /** 当前推理模型的上下文窗口，供上下文进度条做分母；未配置返回 null */
  const reasoningContextLength = computed(() => effectiveModel("reasoning")?.contextLength ?? null);

  const selectModel = async (role: ThreadModelRole, aiModelId: string) => {
    const override = defaultOf(role)?.id === aiModelId ? null : aiModelId;
    const prev = selection.value;
    const next = { ...prev };
    if (override) {
      next[role] = override;
    } else {
      delete next[role];
    }
    selection.value = next;

    const threadId = activeThreadId.value;
    if (!threadId) {
      return;
    }
    try {
      selection.value = await setThreadModel(threadId, role, override);
    } catch (e) {
      selection.value = prev;
      ElMessage.error(`切换模型失败：${(e as Error).message}`);
    }
  };

  watch(
    activeThreadId,
    async (threadId) => {
      if (!threadId) {
        selection.value = {};
        return;
      }
      try {
        const remote = await getThreadModels(threadId);
        // 请求期间又切了对话：丢弃过期结果
        if (activeThreadId.value === threadId) {
          selection.value = remote;
        }
      } catch {
        // 拉不到就按默认展示；真正发消息时后端按库里的选择解析，不受前端展示影响
      }
    },
    { immediate: true }
  );

  if (allModels.value.length === 0) {
    void refreshAiModels();
  }

  return {
    effectiveModel,
    optionsOf,
    reasoningContextLength,
    refreshAiModels,
    selectModel,
    selection
  };
}
