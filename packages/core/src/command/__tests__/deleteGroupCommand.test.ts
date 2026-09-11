import type { ComponentType } from "@screenwright/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeleteGroupCommand, type RecreatedGroup } from "../DeleteGroupCommand";

const makeComponent = (id: number, extra: Partial<ComponentType> = {}): ComponentType =>
  ({ id, title: "图表", ...extra }) as unknown as ComponentType;

const groupMeta = makeComponent(10, { title: "分组" });

/** 重建假实现：分组容器 +1000、成员 +1000，模拟服务端硬删除后重建产生新 id。 */
const recreateWithNewIds = (meta: ComponentType, members: ComponentType[]): RecreatedGroup => ({
  group: { ...meta, id: (meta.id as number) + 1000 } as ComponentType,
  members: members.map((component) => ({
    original: component,
    created: { ...component, id: (component.id as number) + 1000 } as ComponentType
  }))
});

describe("DeleteGroupCommand（框架无关）", () => {
  let recreateFn: ReturnType<typeof vi.fn>;
  let deleteFn: ReturnType<typeof vi.fn>;
  let onAfterUndo: ReturnType<typeof vi.fn>;

  const createCommand = (members = [makeComponent(1), makeComponent(2)]) =>
    new DeleteGroupCommand({
      groupMeta,
      members,
      recreateFn: recreateFn as never,
      deleteFn: deleteFn as never,
      onAfterUndo: onAfterUndo as never
    });

  beforeEach(() => {
    recreateFn = vi.fn(async (meta: ComponentType, members: ComponentType[]) => recreateWithNewIds(meta, members));
    deleteFn = vi.fn(async () => {});
    onAfterUndo = vi.fn();
  });

  it("undo 重建分组容器与全部成员，并整体重映射 id", async () => {
    const cmd = createCommand();

    const res = await cmd.undo();

    expect(res.success).toBe(true);
    expect(recreateFn).toHaveBeenCalledWith(groupMeta, [makeComponent(1), makeComponent(2)]);
    expect(onAfterUndo).toHaveBeenCalledWith([
      { original: groupMeta, created: expect.objectContaining({ id: 1010 }) },
      { original: makeComponent(1), created: expect.objectContaining({ id: 1001 }) },
      { original: makeComponent(2), created: expect.objectContaining({ id: 1002 }) }
    ]);
  });

  it("redo 级联硬删除当前(可能是重建出的新)分组与成员 id", async () => {
    const cmd = createCommand();
    await cmd.undo(); // 10 -> 1010, 1/2 -> 1001/1002

    const res = await cmd.redo();

    expect(res.success).toBe(true);
    expect(deleteFn).toHaveBeenCalledWith("1010", ["1001", "1002"]);
  });

  it("undo→redo→undo 多周期：每轮重建产生新 id", async () => {
    const cmd = createCommand();

    await cmd.undo(); // 10 -> 1010
    await cmd.redo(); // 删除 1010
    await cmd.undo(); // 1010 -> 2010

    expect(recreateFn).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 1010 }),
      expect.arrayContaining([expect.objectContaining({ id: 1001 }), expect.objectContaining({ id: 1002 })])
    );
  });

  it("成员重建全部失败时 undo 失败", async () => {
    recreateFn.mockResolvedValueOnce({
      group: { ...groupMeta, id: 1010 } as ComponentType,
      members: []
    });
    const cmd = createCommand();

    const res = await cmd.undo();

    expect(res.success).toBe(false);
    expect(onAfterUndo).not.toHaveBeenCalled();
  });

  it("updateComponentId 改写分组与成员 id", async () => {
    const cmd = createCommand();

    cmd.updateComponentId("10", "99");
    cmd.updateComponentId("1", "88");

    await cmd.redo();
    expect(deleteFn).toHaveBeenCalledWith("99", ["88", "2"]);
  });
});
