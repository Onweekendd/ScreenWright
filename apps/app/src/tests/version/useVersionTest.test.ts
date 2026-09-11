import { describe, expect, it, vi } from "vitest";

import { getLargeScreenInfo } from "@/api/build";
import { getVersionCode, setVersionCode } from "@/utils/version";
import { useBuildVersion } from "@/views/build/components/buildNav/buildVersion/useBuildVersion";

// 模拟Vue的组件生命周期
const mockOnBeforeMount = vi.fn();
const mockOnMounted = vi.fn();
const mockOnUnmounted = vi.fn();
const mockInject = vi.fn();

vi.mock("vue", async () => ({
  ...((await vi.importActual("vue")) as any),
  onBeforeMount: (fn: Function) => mockOnBeforeMount(fn),
  onMounted: (fn: Function) => mockOnMounted(fn),
  onUnmounted: (fn: Function) => mockOnUnmounted(fn),
  inject: (key: any, defaultValue?: any) => mockInject(key, defaultValue)
}));

vi.mock("@/api/build", () => ({
  getLargeScreenInfo: vi.fn().mockImplementation(() => {
    const versionCode = getVersionCode();
    return {
      result: {
        versionCode
      }
    };
  })
}));

describe("useVersionTest", () => {
  it("should be true", () => {
    setVersionCode("1");
    expect(getLargeScreenInfo(123)).toEqual({
      result: {
        versionCode: "1"
      }
    });
  });
});
