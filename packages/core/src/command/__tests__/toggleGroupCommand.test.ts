import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToggleGroupCommand } from "../ToggleGroupCommand";

describe("ToggleGroupCommand（框架无关）", () => {
  let buildGroupFn: ReturnType<typeof vi.fn>;
  let dissolveGroupFn: ReturnType<typeof vi.fn>;
  let onAfterBuild: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    buildGroupFn = vi.fn(async () => ({ groupId: "group-2" }));
    dissolveGroupFn = vi.fn(async () => ({ memberIds: ["1", "2"] }));
    onAfterBuild = vi.fn();
  });

  it("direction=create: redo 建组产生新 id 并回调重映射, undo 解组", async () => {
    const cmd = new ToggleGroupCommand({
      direction: "create",
      groupId: "group-1",
      memberIds: ["1", "2"],
      buildGroupFn: buildGroupFn as never,
      dissolveGroupFn: dissolveGroupFn as never,
      onAfterBuild: onAfterBuild as never
    });

    const redoRes = await cmd.redo();
    expect(redoRes.success).toBe(true);
    expect(buildGroupFn).toHaveBeenCalledWith(["1", "2"]);
    expect(onAfterBuild).toHaveBeenCalledWith("group-1", "group-2");

    const undoRes = await cmd.undo();
    expect(undoRes.success).toBe(true);
    expect(dissolveGroupFn).toHaveBeenCalledWith("group-2");
  });

  it("direction=dissolve: redo 解组, undo 建组产生新 id 并回调重映射", async () => {
    const cmd = new ToggleGroupCommand({
      direction: "dissolve",
      groupId: "group-1",
      memberIds: ["1", "2"],
      buildGroupFn: buildGroupFn as never,
      dissolveGroupFn: dissolveGroupFn as never,
      onAfterBuild: onAfterBuild as never
    });

    const redoRes = await cmd.redo();
    expect(redoRes.success).toBe(true);
    expect(dissolveGroupFn).toHaveBeenCalledWith("group-1");

    const undoRes = await cmd.undo();
    expect(undoRes.success).toBe(true);
    expect(buildGroupFn).toHaveBeenCalledWith(["1", "2"]);
    expect(onAfterBuild).toHaveBeenCalledWith("group-1", "group-2");
  });

  it("多周期建组每次都产生新 id 并各自重映射", async () => {
    buildGroupFn.mockResolvedValueOnce({ groupId: "group-2" }).mockResolvedValueOnce({ groupId: "group-3" });

    const cmd = new ToggleGroupCommand({
      direction: "create",
      groupId: "group-1",
      memberIds: ["1", "2"],
      buildGroupFn: buildGroupFn as never,
      dissolveGroupFn: dissolveGroupFn as never,
      onAfterBuild: onAfterBuild as never
    });

    await cmd.redo(); // group-1 -> group-2
    await cmd.undo(); // 解组 group-2
    await cmd.redo(); // group-2 -> group-3

    expect(onAfterBuild).toHaveBeenNthCalledWith(1, "group-1", "group-2");
    expect(onAfterBuild).toHaveBeenNthCalledWith(2, "group-2", "group-3");
    expect(dissolveGroupFn).toHaveBeenCalledWith("group-2");
  });

  it("updateComponentId 改写分组 id 与成员 id", async () => {
    const cmd = new ToggleGroupCommand({
      direction: "create",
      groupId: "group-1",
      memberIds: ["1", "2"],
      buildGroupFn: buildGroupFn as never,
      dissolveGroupFn: dissolveGroupFn as never,
      onAfterBuild: onAfterBuild as never
    });

    // 成员 id 重映射：build 直接使用 memberIds，未经过 dissolve 覆盖
    cmd.updateComponentId("1", "99");
    await cmd.redo();
    expect(buildGroupFn).toHaveBeenCalledWith(["99", "2"]);

    // 分组 id 重映射：dissolve 使用 groupId（build 产生的新 id 是 "group-2"）
    cmd.updateComponentId("group-2", "group-9");
    await cmd.undo();
    expect(dissolveGroupFn).toHaveBeenCalledWith("group-9");
  });
});
