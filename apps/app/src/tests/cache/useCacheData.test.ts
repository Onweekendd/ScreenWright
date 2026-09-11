import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("useCacheData", () => {
  it("should have Vue lifecycle mocks", () => {
    expect(mockOnBeforeMount).toBeDefined();
    expect(mockOnMounted).toBeDefined();
    expect(mockOnUnmounted).toBeDefined();
    expect(mockInject).toBeDefined();
  });
});
