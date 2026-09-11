import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock 函数声明（hoisted）---
const { mockListThreads, mockUpdateThread } = vi.hoisted(() => ({
  mockListThreads: vi.fn(),
  mockUpdateThread: vi.fn()
}));

// --- Mocks ---

vi.mock("@screenwright/server/rpc", () => ({
  apiClient: {
    customApi: {
      "bi-chat": {
        "list-threads": { $post: mockListThreads },
        "update-thread": { $post: mockUpdateThread }
      }
    }
  }
}));

vi.mock("@/views/build/useLargeScreenInfo", () => ({
  useLargeScreenInfo: () => ({
    navInfo: { value: { id: 23595, versionCode: "v1" } }
  })
}));

vi.mock("element-plus", () => ({
  ElMessage: { error: vi.fn() }
}));

// --- 被测模块 ---
import { useAgentBIThreadList } from "@/views/build/components/agentBI/hooks/useAgentBIThreadList";

// createGlobalState 单例：取一次实例，各用例间用 reset / 重设 mock 隔离
const list = useAgentBIThreadList();

// ---------------------------------------------------------------------------
// queryMemory
// ---------------------------------------------------------------------------

describe("queryMemory", () => {
  beforeEach(() => {
    list.reset();
    mockListThreads.mockReset();
  });

  it("queryMemory，API 返回两个 thread，memoryThreads 更新为这两个", async () => {
    const threads = [
      { id: "t-1", title: "对话1" },
      { id: "t-2", title: "对话2" }
    ];
    mockListThreads.mockResolvedValue({ json: () => Promise.resolve({ threads }) });

    await list.queryMemory();

    expect(mockListThreads).toHaveBeenCalledWith({ json: { resourceId: "23595" } });
    expect(list.memoryThreads.value).toEqual(threads);
  });

  it("queryMemory，API 抛出异常，memoryThreads 清空为空数组", async () => {
    list.memoryThreads.value = [
      { id: "t-1", title: "旧数据", createdAt: new Date(), updatedAt: new Date(), resourceId: "", metadata: {} }
    ];
    mockListThreads.mockRejectedValue(new Error("fail"));

    await list.queryMemory();

    expect(list.memoryThreads.value).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// updateThreadTitle
// ---------------------------------------------------------------------------

describe("updateThreadTitle", () => {
  beforeEach(() => {
    list.reset();
    mockUpdateThread.mockReset().mockResolvedValue({ json: () => Promise.resolve({}) });
  });

  it("updateThreadTitle，调用后端并就地更新对应线程标题", async () => {
    list.memoryThreads.value = [
      { id: "t-1", title: "旧标题", createdAt: new Date(), updatedAt: new Date(), resourceId: "", metadata: {} }
    ];

    await list.updateThreadTitle("t-1", "新标题");

    expect(mockUpdateThread).toHaveBeenCalledWith({
      json: { threadId: "t-1", title: "新标题", metadata: {} }
    });
    expect(list.memoryThreads.value[0].title).toBe("新标题");
  });
});
