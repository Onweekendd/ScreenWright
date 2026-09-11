import { describe, expect, it, vi } from "vitest";

// router.push 用 spy，验证 execute 走全局 router 而非 useRouter()（setup 外会 undefined）
const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/router", () => ({ default: { push: pushMock } }));

// until 立即 resolve，避免等待真实页面加载（回归点在 router 调用，不在 until）
vi.mock("@vueuse/core", () => ({
  until: () => ({ toBe: () => Promise.resolve() })
}));

vi.mock("@/views/build/useLargeScreenInfo", () => ({
  useLargeScreenInfo: () => ({ navInfo: { value: { id: 123 } } })
}));

vi.mock("@/views/build/useInitLargeScreenData", () => ({
  useInitLargeScreenData: () => ({ isLoad: { value: false }, setIsLoad: vi.fn() })
}));

vi.mock("@/views/build/components/panelEditor/usePanelData", () => ({
  usePanelData: () => ({ isLoad: { value: false }, setIsLoad: vi.fn() })
}));

import { routeChange } from "@/views/build/components/agentBI/tools/routeChange";

// createTool 的 execute 类型为 (input, context) 且可选；测试按单参调用，统一强转
const runRouteChange = routeChange.execute as (input: unknown) => Promise<Record<string, unknown>>;

describe("routeChange tool", () => {
  it("root 跳转调用全局 router.push，不依赖 setup 上下文", async () => {
    const res = await runRouteChange({ targetType: "root" });

    expect(pushMock).toHaveBeenCalledWith("/build/123");
    expect(res).toEqual({ success: true, targetType: "root", targetId: undefined });
  });

  it("panel 跳转带 targetId 调用 router.push", async () => {
    const res = await runRouteChange({ targetType: "panel", targetId: 456 });

    expect(pushMock).toHaveBeenCalledWith({ name: "panel", params: { id: 123, cid: 456 } });
    expect(res).toEqual({ success: true, targetType: "panel", targetId: 456 });
  });

  it("panel/encode 未提供 targetId 返回失败", async () => {
    const res = await runRouteChange({ targetType: "panel" });

    expect(res).toEqual({ success: false, error: "panel 跳转必须提供 targetId" });
  });
});
