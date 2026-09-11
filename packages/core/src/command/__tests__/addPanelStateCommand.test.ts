import type { PanelState } from "@screenwright/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddPanelStateCommand } from "../AddPanelStateCommand";

const state = { id: "state-1", title: "状态1", name: "状态1", config: [] } as unknown as PanelState;

describe("AddPanelStateCommand（框架无关）", () => {
  let insertStateFn: ReturnType<typeof vi.fn>;
  let removeStateFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    insertStateFn = vi.fn(async () => {});
    removeStateFn = vi.fn(async () => {});
  });

  const createCommand = () =>
    new AddPanelStateCommand({
      stateIndex: 1,
      state,
      insertStateFn: insertStateFn as never,
      removeStateFn: removeStateFn as never
    });

  it("redo 把状态插回指定索引", async () => {
    const cmd = createCommand();

    const res = await cmd.redo();

    expect(res.success).toBe(true);
    expect(insertStateFn).toHaveBeenCalledWith(1, state);
  });

  it("undo 从指定索引摘除状态", async () => {
    const cmd = createCommand();

    const res = await cmd.undo();

    expect(res.success).toBe(true);
    expect(removeStateFn).toHaveBeenCalledWith(1);
  });

  it("状态 id 不变，updateComponentId 是 no-op", async () => {
    const cmd = createCommand();

    expect(() => cmd.updateComponentId("state-1", "state-2")).not.toThrow();
  });
});
