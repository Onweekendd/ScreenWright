import { beforeEach, describe, expect, it, vi } from "vitest";

// 建会话只造 TransformStream / AbortController，不做 IO；但它的模块图会拉进整个 mastra 实例
// 与 git 操作，所以把这两条重依赖挡掉，让用例只跑注册表与会话生命周期本身。
vi.mock("@/mastra/services/chat/bi-chat-turn-stream", () => ({
  createBIChatTurnStream: vi.fn(),
  renameBackgroundChunk: vi.fn()
}));
vi.mock("@/mastra/services/version-history", () => ({
  commitScreenSnapshot: vi.fn().mockResolvedValue(undefined)
}));

import { SessionRegistry } from "@/mastra/services/chat/session-registry";

let registry: SessionRegistry;

beforeEach(() => {
  registry = new SessionRegistry();
});

describe("SessionRegistry.getOrCreate", () => {
  it("首次调用应建会话并登记", () => {
    const session = registry.getOrCreate("thread-1", "resource-1");

    expect(registry.find("thread-1")).toBe(session);
  });

  it("命中已有会话时应复用同一实例", () => {
    const first = registry.getOrCreate("thread-1", "resource-1");
    const second = registry.getOrCreate("thread-1", "resource-1");

    expect(second).toBe(first);
  });

  it("复用时不得绑上本次的 connectionSignal —— 短命请求结束不能拆掉长会话", () => {
    const initial = new AbortController();
    const shortLived = new AbortController();
    const session = registry.getOrCreate("thread-1", "resource-1", initial.signal);
    registry.getOrCreate("thread-1", "resource-1", shortLived.signal); // 例如一次 resume

    shortLived.abort();

    expect(registry.find("thread-1")).toBe(session);
  });

  it("初始连接断开时会话应自行摘除登记（onClosed 回路）", () => {
    const initial = new AbortController();
    registry.getOrCreate("thread-1", "resource-1", initial.signal);

    initial.abort();

    expect(registry.find("thread-1")).toBeUndefined();
  });

  it("不同 threadId 各自独立", () => {
    const a = registry.getOrCreate("thread-a", "resource-1");
    const b = registry.getOrCreate("thread-b", "resource-1");

    expect(a).not.toBe(b);
    expect(registry.find("thread-a")).toBe(a);
    expect(registry.find("thread-b")).toBe(b);
  });
});

describe("SessionRegistry.find", () => {
  it("查无此会话时返回 undefined（前端据此走重连兜底）", () => {
    expect(registry.find("thread-missing")).toBeUndefined();
  });
});

describe("SessionRegistry.drop", () => {
  it("摘除后同 threadId 再来应新建，而不是复用已收尾的会话", () => {
    const first = registry.getOrCreate("thread-1", "resource-1");

    registry.drop("thread-1", first);
    const second = registry.getOrCreate("thread-1", "resource-1");

    expect(second).not.toBe(first);
    expect(registry.find("thread-1")).toBe(second);
  });

  it("过期实例不得误删后来者用同一 threadId 注册的新会话", () => {
    const stale = registry.getOrCreate("thread-1", "resource-1");
    registry.drop("thread-1", stale);
    const fresh = registry.getOrCreate("thread-1", "resource-1");

    registry.drop("thread-1", stale); // 旧实例迟到的收尾

    expect(registry.find("thread-1")).toBe(fresh);
  });

  it("重复摘除同一会话是幂等的", () => {
    const session = registry.getOrCreate("thread-1", "resource-1");

    registry.drop("thread-1", session);
    registry.drop("thread-1", session);

    expect(registry.find("thread-1")).toBeUndefined();
  });
});

describe("SessionRegistry.reset", () => {
  it("应清空全部登记", () => {
    registry.getOrCreate("thread-a", "resource-1");
    registry.getOrCreate("thread-b", "resource-1");

    registry.reset();

    expect(registry.find("thread-a")).toBeUndefined();
    expect(registry.find("thread-b")).toBeUndefined();
  });
});
