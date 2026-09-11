import { beforeEach, describe, expect, it, vi } from "vitest";

import { nextTick } from "vue";

// --- Mocks ---

// 用轻量假会话替代真实 createAgentBISession，避免拉起整条依赖链
vi.mock("@/views/build/components/agentBI/useAgentBI", () => {
  let n = 0;
  return {
    createAgentBISession: vi.fn(() => ({
      sessionId: `s-${++n}`,
      stopStreaming: vi.fn(),
      messages: { value: [] }
    }))
  };
});

vi.mock("@/views/build/components/agentBI/hooks/useAgentBIThreadList", () => ({
  useAgentBIThreadList: () => ({ reset: vi.fn() })
}));

// navInfo 用真实 ref，便于在用例里改 id 触发「切大屏」watch
vi.mock("@/views/build/useLargeScreenInfo", async () => {
  const { ref } = await import("vue");
  const navInfo = ref({ id: 23595, versionCode: "v1" });
  return { useLargeScreenInfo: () => ({ navInfo }) };
});

// --- 被测模块 ---
import { useAgentBISessions } from "@/views/build/components/agentBI/useAgentBISessions";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

const store = useAgentBISessions();
const { navInfo } = useLargeScreenInfo();

/** 回到「单 tab」基线（不触发 navInfo watch） */
const resetToSingleTab = () => {
  store.sessions.value = [];
  store.addTab();
};

describe("useAgentBISessions addTab / closeTab", () => {
  beforeEach(() => {
    resetToSingleTab();
  });

  it("addTab，新增一个 tab 并将其激活", () => {
    const before = store.sessions.value.length;

    const session = store.addTab();

    expect(store.sessions.value.length).toBe(before + 1);
    expect(store.activeSessionId.value).toBe(session.sessionId);
  });

  it("closeTab，关闭非激活 tab 不影响 activeSessionId，并停掉其流", () => {
    const first = store.sessions.value[0];
    const second = store.addTab(); // 激活 second

    store.closeTab(first.sessionId);

    expect(store.sessions.value.find((s) => s.sessionId === first.sessionId)).toBeUndefined();
    expect(store.activeSessionId.value).toBe(second.sessionId);
    expect(first.stopStreaming).toHaveBeenCalled();
  });

  it("closeTab，关闭激活 tab 后自动切到相邻 tab", () => {
    const first = store.sessions.value[0];
    const second = store.addTab(); // [first, second]
    store.activeSessionId.value = first.sessionId; // 激活 first

    store.closeTab(first.sessionId);

    expect(store.activeSessionId.value).toBe(second.sessionId);
  });

  it("closeTab，关闭最后一个 tab 后自动新建一个空白 tab", () => {
    store.sessions.value = [];
    const only = store.addTab();

    store.closeTab(only.sessionId);

    expect(store.sessions.value.length).toBe(1);
    expect(store.sessions.value[0].sessionId).not.toBe(only.sessionId);
  });
});

describe("useAgentBISessions 切大屏重置", () => {
  it("navInfo.id 变化时清空所有 tab，只保留一个新建 tab", async () => {
    // 准备多个 tab
    store.sessions.value = [];
    store.addTab();
    store.addTab();
    expect(store.sessions.value.length).toBe(2);

    // 切换大屏（直接改 id 触发 watch）
    navInfo.value.id = 88888;
    await nextTick();

    expect(store.sessions.value.length).toBe(1);
  });
});
