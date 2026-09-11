import { describe, expect, it, vi } from "vitest";

import type { CommandResult, ICommand } from "../BaseCommand";
import { CommandManager } from "../CommandManager";

/**
 * 简易测试命令：记录 undo/redo 调用，可配置成功/失败。
 * 用于在 node 环境（不引入任何 UI 框架）验证 CommandManager 行为。
 */
class FakeCommand implements ICommand {
  undoCalls = 0;
  redoCalls = 0;

  constructor(
    private readonly description: string,
    private readonly succeed = true
  ) {}

  async undo(): Promise<CommandResult> {
    this.undoCalls++;
    return this.succeed ? { success: true } : { success: false, error: "fail" };
  }

  async redo(): Promise<CommandResult> {
    this.redoCalls++;
    return this.succeed ? { success: true } : { success: false, error: "fail" };
  }

  getDescription(): string {
    return this.description;
  }

  updateComponentId(): void {
    // no-op
  }
}

describe("CommandManager（框架无关）", () => {
  it("addCommand 后可撤销、不可重做，并清空重做栈", () => {
    const cm = new CommandManager();
    expect(cm.canUndo()).toBe(false);

    cm.addCommand(new FakeCommand("a"));
    expect(cm.canUndo()).toBe(true);
    expect(cm.canRedo()).toBe(false);
    expect(cm.getUndoStackSize()).toBe(1);
    expect(cm.getLastCommandDescription()).toBe("a");
  });

  it("undo 成功后命令移入重做栈，redo 成功后移回撤销栈", async () => {
    const cm = new CommandManager();
    const cmd = new FakeCommand("a");
    cm.addCommand(cmd);

    const undoRes = await cm.undo();
    expect(undoRes.success).toBe(true);
    expect(cmd.undoCalls).toBe(1);
    expect(cm.canUndo()).toBe(false);
    expect(cm.canRedo()).toBe(true);

    const redoRes = await cm.redo();
    expect(redoRes.success).toBe(true);
    expect(cmd.redoCalls).toBe(1);
    expect(cm.canUndo()).toBe(true);
    expect(cm.canRedo()).toBe(false);
  });

  it("空栈 undo/redo 返回失败且不抛错", async () => {
    const cm = new CommandManager();
    expect((await cm.undo()).success).toBe(false);
    expect((await cm.redo()).success).toBe(false);
  });

  it("命令 undo 失败时不移动栈", async () => {
    const cm = new CommandManager();
    cm.addCommand(new FakeCommand("a", false));

    const res = await cm.undo();
    expect(res.success).toBe(false);
    // 失败不应把命令移入重做栈
    expect(cm.canUndo()).toBe(true);
    expect(cm.canRedo()).toBe(false);
  });

  it("maxHistorySize 限制撤销栈长度", () => {
    const cm = new CommandManager(2);
    cm.addCommand(new FakeCommand("a"));
    cm.addCommand(new FakeCommand("b"));
    cm.addCommand(new FakeCommand("c"));

    expect(cm.getUndoStackSize()).toBe(2);
    expect(cm.getHistorySummary().undoStack).toEqual(["b", "c"]);
  });

  it("subscribe 在栈变化时通知，取消订阅后不再通知", async () => {
    const cm = new CommandManager();
    const listener = vi.fn();
    const unsubscribe = cm.subscribe(listener);

    cm.addCommand(new FakeCommand("a")); // +1
    await cm.undo(); // +1
    await cm.redo(); // +1
    cm.clearHistory(); // +1
    expect(listener).toHaveBeenCalledTimes(4);

    unsubscribe();
    cm.addCommand(new FakeCommand("b"));
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it("updateComponentIdInHistory 调用栈内每个命令的 updateComponentId", () => {
    const cm = new CommandManager();
    const cmd = new FakeCommand("a");
    const spy = vi.spyOn(cmd, "updateComponentId");
    cm.addCommand(cmd);

    cm.updateComponentIdInHistory("1", "2");
    expect(spy).toHaveBeenCalledWith("1", "2");

    // 相同 id 不触发
    cm.updateComponentIdInHistory("3", "3");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
