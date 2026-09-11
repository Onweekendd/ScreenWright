import type { ComponentType, PanelState } from "@screenwright/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeletePanelStateCommand, type RecreatedPanelStateChild } from "../DeletePanelStateCommand";

/** 构造最小化的子组件（仅含命令关心的字段）。 */
const makeComponent = (id: number): ComponentType => ({ id, title: "图表" }) as unknown as ComponentType;

/** 构造状态容器元数据（PanelState 去掉 config）。 */
const stateMeta = { id: "state-1", title: "状态1", name: "状态1" } as unknown as Omit<PanelState, "config">;

/**
 * 重建假实现：模拟服务端“硬删除 + 新 id”——每次重建给组件 +1000 的新 id。
 */
const recreateWithNewIds = (children: ComponentType[]): RecreatedPanelStateChild[] =>
  children.map((component) => ({
    original: component,
    created: { ...component, id: (component.id as number) + 1000 } as ComponentType
  }));

describe("DeletePanelStateCommand（框架无关）", () => {
  let recreateChildrenFn: ReturnType<typeof vi.fn>;
  let deleteChildrenFn: ReturnType<typeof vi.fn>;
  let insertStateFn: ReturnType<typeof vi.fn>;
  let removeStateFn: ReturnType<typeof vi.fn>;
  let onAfterUndo: ReturnType<typeof vi.fn>;

  const createCommand = (statusIndex = 2, children = [makeComponent(1), makeComponent(2)]) =>
    new DeletePanelStateCommand({
      statusIndex,
      stateMeta,
      children,
      recreateChildrenFn: recreateChildrenFn as never,
      deleteChildrenFn: deleteChildrenFn as never,
      insertStateFn: insertStateFn as never,
      removeStateFn: removeStateFn as never,
      onAfterUndo: onAfterUndo as never
    });

  beforeEach(() => {
    recreateChildrenFn = vi.fn(async (children: ComponentType[]) => recreateWithNewIds(children));
    deleteChildrenFn = vi.fn(async () => {});
    insertStateFn = vi.fn(async () => {});
    removeStateFn = vi.fn(async () => {});
    onAfterUndo = vi.fn();
  });

  it("undo 重建子组件、用新组件拼出状态并插回原索引", async () => {
    const cmd = createCommand(2);

    const res = await cmd.undo();

    expect(res.success).toBe(true);
    // 用原始子组件（旧 id）发起重建
    expect(recreateChildrenFn).toHaveBeenCalledWith([makeComponent(1), makeComponent(2)]);
    // 插回原索引，且 config 是重建出的新组件
    expect(insertStateFn).toHaveBeenCalledTimes(1);
    expect(insertStateFn).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        id: "state-1",
        name: "状态1",
        config: [expect.objectContaining({ id: 1001 }), expect.objectContaining({ id: 1002 })]
      })
    );
    // 触发历史栈 id 重映射
    expect(onAfterUndo).toHaveBeenCalledTimes(1);
    expect(onAfterUndo).toHaveBeenCalledWith([
      { original: makeComponent(1), created: expect.objectContaining({ id: 1001 }) },
      { original: makeComponent(2), created: expect.objectContaining({ id: 1002 }) }
    ]);
  });

  it("redo 先摘除状态、再删除“当前(新) id”的子组件", async () => {
    const cmd = createCommand(2);
    await cmd.undo(); // 子组件已重建为 1001/1002

    const res = await cmd.redo();

    expect(res.success).toBe(true);
    expect(removeStateFn).toHaveBeenCalledWith(2);
    // 删除的是 undo 重建出的新 id，而不是最初的 1/2
    expect(deleteChildrenFn).toHaveBeenCalledWith(["1001", "1002"]);
  });

  it("undo→redo→undo 多周期：每轮重建产生新 id，redo 始终删除最新 id", async () => {
    const cmd = createCommand(0);

    await cmd.undo(); // 1,2 -> 1001,1002
    await cmd.redo(); // 删除 1001,1002
    await cmd.undo(); // 1001,1002 -> 2001,2002

    expect(recreateChildrenFn).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 1001 }),
      expect.objectContaining({ id: 1002 })
    ]);

    await cmd.redo(); // 删除 2001,2002
    expect(deleteChildrenFn).toHaveBeenLastCalledWith(["2001", "2002"]);
  });

  it("updateComponentId 改写命令内部持有的子组件 id（外部重映射时）", async () => {
    const cmd = createCommand(1);

    cmd.updateComponentId("1", "99");
    await cmd.redo(); // redo 删除当前 id

    expect(deleteChildrenFn).toHaveBeenCalledWith(["99", "2"]);
  });

  it("updateComponentId 对相同 id 是 no-op", async () => {
    const cmd = createCommand(1);

    cmd.updateComponentId("1", "1");
    await cmd.redo();

    expect(deleteChildrenFn).toHaveBeenCalledWith(["1", "2"]);
  });

  it("重建结果为空时 undo 失败，且不插回状态", async () => {
    recreateChildrenFn.mockResolvedValueOnce([]);
    const cmd = createCommand(2);

    const res = await cmd.undo();

    expect(res.success).toBe(false);
    expect(insertStateFn).not.toHaveBeenCalled();
    expect(onAfterUndo).not.toHaveBeenCalled();
  });
});
