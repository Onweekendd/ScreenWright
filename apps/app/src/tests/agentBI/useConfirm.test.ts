import { beforeEach, describe, expect, it } from "vitest";

import { useConfirm } from "@/views/build/components/agentBI/hooks/useConfirm";

// createGlobalState 单例：取一次实例，用例间清理 dialogs
const confirmStore = useConfirm();

describe("useConfirm 按 sessionId 隔离", () => {
  beforeEach(() => {
    confirmStore.dialogs.value.clear();
  });

  it("两个不同 sessionId 各自 confirm 后，dialogs 同时持有两条且互不覆盖", () => {
    void confirmStore.confirm("session-a", "问题A");
    void confirmStore.confirm("session-b", "问题B");

    expect(confirmStore.dialogs.value.size).toBe(2);
    expect(confirmStore.dialogs.value.get("session-a")).toMatchObject({ type: "confirm", message: "问题A" });
    expect(confirmStore.dialogs.value.get("session-b")).toMatchObject({ type: "confirm", message: "问题B" });
  });

  it("resolveConfirm 只清除对应 sessionId 的条目，并以正确结果 resolve", async () => {
    const pa = confirmStore.confirm("session-a", "问题A");
    void confirmStore.confirm("session-b", "问题B");

    confirmStore.resolveConfirm("session-a", true);

    await expect(pa).resolves.toBe(true);
    expect(confirmStore.dialogs.value.has("session-a")).toBe(false);
    // 另一个 session 的审批仍在排队
    expect(confirmStore.dialogs.value.has("session-b")).toBe(true);
  });

  it("closeDialog 取消时也会 resolve 对应 session 的 promise（confirm → false）", async () => {
    const pa = confirmStore.confirm("session-a", "问题A");

    confirmStore.closeDialog("session-a");

    await expect(pa).resolves.toBe(false);
    expect(confirmStore.dialogs.value.has("session-a")).toBe(false);
  });

  it("askQuestion 与 confirm 在不同 session 下并存，resolveQuestion 不影响另一个", async () => {
    const pa = confirmStore.askQuestion("session-a", [{ question: "q", header: "h", options: [], multiSelect: false } as any]);
    void confirmStore.confirm("session-b", "问题B");

    confirmStore.resolveQuestion("session-a", { h: "x" });

    await expect(pa).resolves.toEqual({ h: "x" });
    expect(confirmStore.dialogs.value.has("session-a")).toBe(false);
    expect(confirmStore.dialogs.value.has("session-b")).toBe(true);
  });
});
