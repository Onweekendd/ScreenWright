import { describe, expect, it, vi } from "vitest";

import { ActionEventRegistry } from "../ActionEventRegistry";

describe("ActionEventRegistry（框架无关）", () => {
  it("addEvent 合并多组事件，保留已有 key", () => {
    const registry = new ActionEventRegistry();
    const h1 = () => {};
    const h2 = () => {};

    registry.addEvent({ "A-1": { fn: h1 } });
    registry.addEvent({ "B-2": { fn: h2 } });

    const list = registry.getEventList();
    expect(list["A-1"].fn).toBe(h1);
    expect(list["B-2"].fn).toBe(h2);
  });

  it("addEventHandler 新增 key/函数名", () => {
    const registry = new ActionEventRegistry();
    const handler = () => {};
    registry.addEventHandler("A-1", "onClick", handler);
    expect(registry.getEventList()["A-1"].onClick).toBe(handler);
  });

  it("addEventHandler 同名函数合并：先原后新", async () => {
    const registry = new ActionEventRegistry();
    const calls: string[] = [];
    registry.addEventHandler("A-1", "onClick", () => {
      calls.push("first");
    });
    registry.addEventHandler("A-1", "onClick", () => {
      calls.push("second");
    });

    await registry.getEventList()["A-1"].onClick();
    expect(calls).toEqual(["first", "second"]);
  });

  it("getEventList 在变化后返回新对象引用（便于响应式追踪）", () => {
    const registry = new ActionEventRegistry();
    const before = registry.getEventList();
    registry.addEvent({ "A-1": { fn: () => {} } });
    expect(registry.getEventList()).not.toBe(before);
  });

  it("subscribe 在 addEvent/addEventHandler 时通知；取消订阅后不再通知", () => {
    const registry = new ActionEventRegistry();
    const listener = vi.fn();
    const unsubscribe = registry.subscribe(listener);

    registry.addEvent({ "A-1": { fn: () => {} } });
    registry.addEventHandler("A-1", "onClick", () => {});
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    registry.addEvent({ "B-2": { fn: () => {} } });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
