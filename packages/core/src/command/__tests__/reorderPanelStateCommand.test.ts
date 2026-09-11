import type { PanelState } from "@screenwright/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReorderPanelStateCommand } from "../ReorderPanelStateCommand";

const makeState = (id: string): PanelState => ({ id, title: id, name: id, config: [] }) as unknown as PanelState;

describe("ReorderPanelStateCommand（框架无关）", () => {
  let applyOrderFn: ReturnType<typeof vi.fn>;
  const oldOrder = [makeState("a"), makeState("b"), makeState("c")];
  const newOrder = [makeState("b"), makeState("a"), makeState("c")];

  beforeEach(() => {
    applyOrderFn = vi.fn(async () => {});
  });

  const createCommand = () =>
    new ReorderPanelStateCommand({
      oldOrder,
      newOrder,
      applyOrderFn: applyOrderFn as never
    });

  it("redo 应用排序后的顺序", async () => {
    const cmd = createCommand();

    const res = await cmd.redo();

    expect(res.success).toBe(true);
    expect(applyOrderFn).toHaveBeenCalledWith(newOrder);
  });

  it("undo 恢复排序前的顺序", async () => {
    const cmd = createCommand();

    const res = await cmd.undo();

    expect(res.success).toBe(true);
    expect(applyOrderFn).toHaveBeenCalledWith(oldOrder);
  });

  it("排序不产生新组件 id，updateComponentId 是 no-op", async () => {
    const cmd = createCommand();

    expect(() => cmd.updateComponentId("a", "z")).not.toThrow();
  });
});
