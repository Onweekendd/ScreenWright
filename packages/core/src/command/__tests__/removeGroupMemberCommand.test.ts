import type { ComponentType } from "@screenwright/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RemoveGroupMemberCommand } from "../RemoveGroupMemberCommand";

const makeMember = (id: number): ComponentType => ({ id, title: "图表" }) as unknown as ComponentType;

describe("RemoveGroupMemberCommand（框架无关）", () => {
  let recreateMemberFn: ReturnType<typeof vi.fn>;
  let removeMemberFn: ReturnType<typeof vi.fn>;
  let onAfterUndo: ReturnType<typeof vi.fn>;

  const createCommand = (member = makeMember(5)) =>
    new RemoveGroupMemberCommand({
      groupId: "group-1",
      member,
      recreateMemberFn: recreateMemberFn as never,
      removeMemberFn: removeMemberFn as never,
      onAfterUndo: onAfterUndo as never
    });

  beforeEach(() => {
    recreateMemberFn = vi.fn(async (_groupId: string, member: ComponentType) => ({
      ...member,
      id: (member.id as number) + 1000
    }));
    removeMemberFn = vi.fn(async () => {});
    onAfterUndo = vi.fn();
  });

  it("undo 重建成员并回调 id 重映射", async () => {
    const cmd = createCommand();

    const res = await cmd.undo();

    expect(res.success).toBe(true);
    expect(recreateMemberFn).toHaveBeenCalledWith("group-1", makeMember(5));
    expect(onAfterUndo).toHaveBeenCalledWith("5", expect.objectContaining({ id: 1005 }));
  });

  it("redo 删除当前(可能是重建出的新) id 的成员", async () => {
    const cmd = createCommand();
    await cmd.undo(); // 5 -> 1005

    const res = await cmd.redo();

    expect(res.success).toBe(true);
    expect(removeMemberFn).toHaveBeenCalledWith("group-1", "1005");
  });

  it("undo→redo→undo 多周期：每轮重建产生新 id", async () => {
    const cmd = createCommand();

    await cmd.undo(); // 5 -> 1005
    await cmd.redo(); // 删除 1005
    await cmd.undo(); // 1005 -> 2005

    expect(recreateMemberFn).toHaveBeenLastCalledWith("group-1", expect.objectContaining({ id: 1005 }));

    await cmd.redo();
    expect(removeMemberFn).toHaveBeenLastCalledWith("group-1", "2005");
  });

  it("updateComponentId 改写分组 id 与成员 id", async () => {
    const cmd = createCommand();

    cmd.updateComponentId("group-1", "group-9");
    cmd.updateComponentId("5", "55");

    await cmd.redo();
    expect(removeMemberFn).toHaveBeenCalledWith("group-9", "55");
  });
});
