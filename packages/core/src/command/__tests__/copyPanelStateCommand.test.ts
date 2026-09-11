import type { ComponentType, PanelState } from "@screenwright/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CopyPanelStateCommand, type RecreatedPanelStateCopy } from "../CopyPanelStateCommand";

const makeComponent = (id: number): ComponentType => ({ id, title: "图表" }) as unknown as ComponentType;

const sourceStatus = {
  id: "state-src",
  title: "状态1",
  name: "状态1",
  config: [makeComponent(1), makeComponent(2)]
} as unknown as PanelState;

const makeCopiedState = (idSuffix: number, offset: number): PanelState =>
  ({
    id: `state-copy-${idSuffix}`,
    title: "状态1-副本",
    name: "状态1-副本",
    config: [makeComponent(1 + offset), makeComponent(2 + offset)]
  }) as unknown as PanelState;

/** 重建假实现：模拟"复制"产生新 id——每次复制给组件 +offset 的新 id。 */
const rebuildWithOffset = (idSuffix: number, offset: number) => {
  const newState = makeCopiedState(idSuffix, offset);
  const pairs: RecreatedPanelStateCopy[] = sourceStatus.config.map((component, index) => ({
    original: component,
    created: newState.config[index]
  }));
  return { newState, pairs };
};

describe("CopyPanelStateCommand（框架无关，DeletePanelStateCommand 的镜像）", () => {
  let rebuildFn: ReturnType<typeof vi.fn>;
  let teardownFn: ReturnType<typeof vi.fn>;
  let onAfterRedo: ReturnType<typeof vi.fn>;

  const createCommand = () => {
    const initialCopy = rebuildWithOffset(1, 100);
    return {
      cmd: new CopyPanelStateCommand({
        sourceStatus,
        copiedState: initialCopy.newState,
        rebuildFn: rebuildFn as never,
        teardownFn: teardownFn as never,
        onAfterRedo: onAfterRedo as never
      }),
      initialCopy
    };
  };

  beforeEach(() => {
    rebuildFn = vi.fn();
    teardownFn = vi.fn(async () => {});
    onAfterRedo = vi.fn();
  });

  it("undo 摘除并硬删除当前复制出的状态（业务复制动作已先发生）", async () => {
    const { cmd, initialCopy } = createCommand();

    const res = await cmd.undo();

    expect(res.success).toBe(true);
    expect(teardownFn).toHaveBeenCalledWith(initialCopy.newState);
  });

  it("redo 重新复制源状态，产生新 id 并回调重映射", async () => {
    rebuildFn.mockResolvedValueOnce(rebuildWithOffset(2, 200));
    const { cmd } = createCommand();

    const res = await cmd.redo();

    expect(res.success).toBe(true);
    expect(rebuildFn).toHaveBeenCalledWith(sourceStatus);
    expect(onAfterRedo).toHaveBeenCalledWith([
      { original: makeComponent(1), created: expect.objectContaining({ id: 201 }) },
      { original: makeComponent(2), created: expect.objectContaining({ id: 202 }) }
    ]);
  });

  it("undo→redo→undo 多周期：每轮复制产生新状态，undo 始终摘除最新状态", async () => {
    rebuildFn.mockResolvedValueOnce(rebuildWithOffset(2, 200)).mockResolvedValueOnce(rebuildWithOffset(3, 300));
    const { cmd, initialCopy } = createCommand();

    await cmd.undo(); // 摘除初次复制出的状态
    expect(teardownFn).toHaveBeenLastCalledWith(initialCopy.newState);

    await cmd.redo(); // 重新复制 -> state-copy-2
    await cmd.undo(); // 摘除 state-copy-2
    expect(teardownFn).toHaveBeenLastCalledWith(expect.objectContaining({ id: "state-copy-2" }));

    await cmd.redo(); // 重新复制 -> state-copy-3
    expect(rebuildFn).toHaveBeenCalledTimes(2);
  });

  it("重做复制为空时 redo 失败", async () => {
    rebuildFn.mockResolvedValueOnce({ newState: { ...sourceStatus, config: [] }, pairs: [] });
    const { cmd } = createCommand();

    const res = await cmd.redo();

    expect(res.success).toBe(false);
    expect(onAfterRedo).not.toHaveBeenCalled();
  });

  it("updateComponentId 改写当前复制出的状态内子组件 id", async () => {
    const { cmd, initialCopy } = createCommand();

    cmd.updateComponentId("101", "999");
    await cmd.undo();

    expect(teardownFn).toHaveBeenCalledWith({
      ...initialCopy.newState,
      config: [expect.objectContaining({ id: 999 }), expect.objectContaining({ id: 102 })]
    });
  });
});
