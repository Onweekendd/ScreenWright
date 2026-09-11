import { computed, ref } from "vue";

import { apiClient, type ModelCapability } from "@screenwright/server/rpc";

import type { UsageInfo } from "../type";

/**
 * 模型上限与压缩配置由后端 /customApi/model-capability 提供，
 * 事实来源是 servers/server/src/mastra/config/model-capability.ts。
 *
 * 这里刻意不保留任何本地副本：历史上前端按 20 万、后端按 100 万各算各的，
 * 同一段对话进度条虚高 5 倍，就是「前端说满了、后端说还能继续」的来源。
 */

/** 拉不到配置时的保守兜底：宁可显示得偏满，也不要让用户以为还很空 */
const FALLBACK_CAPABILITY: ModelCapability = {
  modelId: "unknown",
  contextLimit: 20_0000,
  compaction: { l1Enabled: false, l3Enabled: false, l3TriggerTokens: 20_0000 }
};

/** 全局只拉一次：能力配置进程内不变，多会话/多 tab 共享同一份 */
const capability = ref<ModelCapability | null>(null);
let capabilityPromise: Promise<void> | null = null;

const ensureCapability = (): Promise<void> => {
  if (!capabilityPromise) {
    // try 包住同步调用：测试或异常环境下 RPC 客户端可能没有这个路径，
    // 取不到配置只该退化成兜底值，不该让整个 composable 构造失败。
    try {
      capabilityPromise = apiClient.customApi["model-capability"]
        .$get()
        .then(async (res) => {
          if (res.ok) {
            capability.value = await res.json();
          }
        })
        .catch(() => {
          // 拉取失败就一直走兜底值；不 reset promise，避免每次渲染都重试打爆后端
        });
    } catch {
      capabilityPromise = Promise.resolve();
    }
  }
  return capabilityPromise;
};

const EMPTY_USAGE: UsageInfo = { inputTokens: 0, outputTokens: 0, reasoningTokens: 0, totalTokens: 0 };

/**
 * 上下文窗口 store（每个会话 session 各自实例化一份）
 *
 * 内部持有最近一次的 token 用量 `lastUsage`，并基于后端下发的模型上下文窗口
 * 派生出占用百分比、进度条颜色与提示文案。多 tab 下每个会话独立持有自己的用量状态。
 */
export function useContextWindow() {
  /** 最近一次的 token 用量 */
  const lastUsage = ref<UsageInfo | null>(null);

  const compacting = ref(false);

  void ensureCapability();

  const modelCapability = computed(() => capability.value ?? FALLBACK_CAPABILITY);
  const maxContextTokens = computed(() => modelCapability.value.contextLimit);

  /** 写入用量（如流式结束、加载线程时） */
  const setUsage = (usage: UsageInfo | null) => {
    lastUsage.value = usage;
  };

  /** 重置用量为 0（如新建对话时） */
  const resetUsage = () => {
    lastUsage.value = { ...EMPTY_USAGE };
  };

  const usedTokens = computed(() => lastUsage.value?.inputTokens ?? 0);

  /** 上下文占用百分比（0 ~ 100），分母是模型真实上限 */
  const contextPercentage = computed(() => {
    if (!lastUsage.value) {
      return 0;
    }
    return Math.min(Math.round((usedTokens.value / maxContextTokens.value) * 100), 100);
  });

  const requestCompact = async ({ resourceId, threadId }: { threadId: string; resourceId: string }) => {
    if (compacting.value) {
      throw new Error("上下文压缩中，请稍后重试。");
    }

    compacting.value = true;
    try {
      const res = await apiClient.customApi["bi-chat"]["compact-thread"].$post({
        json: {
          resourceId,
          threadId
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const result = await res.json();

      if (!result.compacted) {
        throw new Error(result.reason);
      }

      // 手动压缩不走 stream,不会有 data-usage chunk 回填,需主动把进度条归零,
      // 与后端清零(applyCompaction 里清空 metadata.lastUsage)保持一致。
      // 真实的压缩后用量会在下一轮对话的流式结束时重新写入。
      resetUsage();

      return {
        messageCountBefore: result.messageCountBefore,
        messageCountAfter: result.messageCountAfter
      };
    } finally {
      compacting.value = false;
    }
  };

  /**
   * 告警的参照点：
   * - L3 开启时用真实压缩触发点。上限 100 万而压缩在 15 万就触发，
   *   按上限的百分比来配色的话进度条永远不会变黄变红，预警形同虚设。
   * - L3 关闭时才退回按模型上限算。
   */
  const warningCeiling = computed(() => {
    const { compaction, contextLimit } = modelCapability.value;
    return compaction.l3Enabled ? compaction.l3TriggerTokens : contextLimit;
  });

  /** 距离告警参照点的占比（可超过 100） */
  const ceilingRatio = computed(() => (warningCeiling.value > 0 ? (usedTokens.value / warningCeiling.value) * 100 : 0));

  /** 进度条颜色：接近参照点转黄，触及转红 */
  const contextColor = computed(() => {
    const r = ceilingRatio.value;
    if (r >= 100) {
      return "#f56c6c";
    }
    if (r >= 70) {
      return "#ffb400";
    }
    return "#7c4dff";
  });

  /** 悬浮提示文案：展示剩余上下文百分比，L3 开启时额外说明会自动压缩 */
  const contextTooltip = computed(() => {
    if (!lastUsage.value) {
      return "上下文：剩余 100%";
    }
    const base = `剩余 ${100 - contextPercentage.value}%`;
    return modelCapability.value.compaction.l3Enabled && ceilingRatio.value >= 70
      ? `${base}（接近自动压缩阈值）`
      : base;
  });

  return {
    compacting,
    contextColor,
    contextPercentage,
    contextTooltip,
    lastUsage,
    maxContextTokens,
    modelCapability,
    requestCompact,
    resetUsage,
    setUsage
  };
}
