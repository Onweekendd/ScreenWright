import { describe, expect, it, vi } from "vitest";

import type { CanvasOp } from "@screenwright/server/rpc";
import type { ComponentType } from "@screenwright/types";

import {
  type CanvasOpsDeps,
  createCanvasOpsHandler,
  createdComponentResult
} from "@/views/build/components/agentBI/hooks/canvasOps";

const comp = (id: number, extra: Record<string, unknown> = {}) => ({ id, ...extra }) as unknown as ComponentType;

/** 画布上有 1..9 号组件；其余能力默认成功 */
const makeDeps = (overrides: Partial<CanvasOpsDeps> = {}): CanvasOpsDeps => {
  const onCanvas = new Map(Array.from({ length: 9 }, (_, i) => [i + 1, comp(i + 1)]));
  return {
    getComponent: (id) => onCanvas.get(id),
    confirm: vi.fn().mockResolvedValue(true),
    moveComponents: vi.fn().mockResolvedValue({ success: true, message: "" }),
    groupComponents: vi.fn().mockResolvedValue(comp(100, { name: "分组" })),
    ungroupComponents: vi.fn().mockResolvedValue(undefined),
    addPanelState: vi.fn().mockResolvedValue({ id: "state-1", name: "状态2" }),
    ...overrides
  };
};

const run = (deps: CanvasOpsDeps, ops: CanvasOp[], extra: Record<string, unknown> = {}) =>
  createCanvasOpsHandler(deps)({
    runId: "r",
    toolCallId: "t",
    toolName: "x",
    suspendPayload: { type: "canvas_ops", ops, ...extra }
  } as never);

describe("canvas_ops 执行器", () => {
  describe("审批", () => {
    it("带 approval：先弹一次确认，用户拒绝就整批不执行", async () => {
      const deps = makeDeps({ confirm: vi.fn().mockResolvedValue(false) });

      const reply = await run(deps, [{ op: "move_components", componentIds: [1] }], {
        approval: { purpose: "移动组件" }
      });

      expect(reply).toEqual({ approved: false });
      expect(deps.confirm).toHaveBeenCalledWith("是否允许：移动组件？");
      expect(deps.moveComponents).not.toHaveBeenCalled();
    });

    it("带 approval 且同意：执行，整批只问一次", async () => {
      const deps = makeDeps();

      const reply = await run(
        deps,
        [
          { op: "move_components", componentIds: [1] },
          { op: "move_components", componentIds: [2] }
        ],
        { approval: { purpose: "移动组件" } }
      );

      expect(deps.confirm).toHaveBeenCalledTimes(1);
      expect(reply).toEqual({ results: [{ ok: true }, { ok: true }] });
    });

    it("不带 approval：直接执行，不弹确认", async () => {
      const deps = makeDeps();

      await run(deps, [{ op: "move_components", componentIds: [1] }]);

      expect(deps.confirm).not.toHaveBeenCalled();
      expect(deps.moveComponents).toHaveBeenCalled();
    });

    it("批次字段原样带回（拒绝和成功两条路都要）", async () => {
      const batch = { batchId: "b1", operationId: "o1" };

      const rejected = await run(
        makeDeps({ confirm: vi.fn().mockResolvedValue(false) }),
        [{ op: "ungroup", groupIds: [1] }],
        { approval: { purpose: "解散" }, ...batch }
      );
      const done = await run(makeDeps(), [{ op: "ungroup", groupIds: [1] }], batch);

      expect(rejected).toEqual({ approved: false, ...batch });
      expect(done).toMatchObject(batch);
    });
  });

  describe("回执", () => {
    it("results 与 ops 按下标一一对应，单项失败不中断后面的", async () => {
      const deps = makeDeps({
        moveComponents: vi
          .fn()
          .mockResolvedValueOnce({ success: false, message: "找不到组件 1" })
          .mockResolvedValueOnce({ success: true, message: "" })
      });

      const reply = await run(deps, [
        { op: "move_components", componentIds: [1] },
        { op: "move_components", componentIds: [2] }
      ]);

      expect(reply).toEqual({ results: [{ ok: false, error: "找不到组件 1" }, { ok: true }] });
    });

    it("某个 op 抛异常，记成自己那一项的 error，后面的照常执行", async () => {
      const deps = makeDeps({
        ungroupComponents: vi.fn().mockRejectedValue(new Error("接口超时"))
      });

      const reply = await run(deps, [
        { op: "ungroup", groupIds: [1] },
        { op: "move_components", componentIds: [2] }
      ]);

      expect(reply).toEqual({ results: [{ ok: false, error: "接口超时" }, { ok: true }] });
    });
  });

  describe("move_components", () => {
    it("交给画布的是数字 id 和目标容器，不是字符串", async () => {
      const deps = makeDeps();
      const target = { parentId: 7, parentType: "dynamicPanel" as const, stateId: "s1" };

      await run(deps, [{ op: "move_components", componentIds: [4152, 4153], target }]);

      expect(deps.moveComponents).toHaveBeenCalledWith([4152, 4153], target);
    });
  });

  describe("group_components", () => {
    it("成功：回传画布上建好的分组（深拷贝，不带响应式代理）", async () => {
      const container = comp(100, { name: "分组", children: [comp(1)] });
      const deps = makeDeps({ groupComponents: vi.fn().mockResolvedValue(container) });

      const reply = await run(deps, [{ op: "group_components", componentIds: [1, 2] }]);

      expect(deps.groupComponents).toHaveBeenCalledWith([comp(1), comp(2)]);
      const result = (reply as { results: Array<{ ok: true; component: unknown }> }).results[0];
      expect(result.component).toEqual(container);
      expect(result.component).not.toBe(container);
    });

    it("有成员在画布上找不到：回 error，不动手", async () => {
      const deps = makeDeps();

      const reply = await run(deps, [{ op: "group_components", componentIds: [1, 999] }]);

      expect(reply).toEqual({ results: [{ ok: false, error: "部分组件未找到" }] });
      expect(deps.groupComponents).not.toHaveBeenCalled();
    });

    it("画布没能建出分组：回 error", async () => {
      const deps = makeDeps({ groupComponents: vi.fn().mockResolvedValue(null) });

      const reply = await run(deps, [{ op: "group_components", componentIds: [1, 2] }]);

      expect(reply).toEqual({ results: [{ ok: false, error: "分组失败" }] });
    });
  });

  describe("ungroup", () => {
    it("成功只回「干完了」，不回路径", async () => {
      const deps = makeDeps();

      const reply = await run(deps, [{ op: "ungroup", groupIds: [3] }]);

      expect(deps.ungroupComponents).toHaveBeenCalledWith([comp(3)]);
      expect(reply).toEqual({ results: [{ ok: true }] });
    });

    it("有分组找不到：回 error", async () => {
      const reply = await run(makeDeps(), [{ op: "ungroup", groupIds: [3, 999] }]);

      expect(reply).toEqual({ results: [{ ok: false, error: "部分分组未找到" }] });
    });
  });

  describe("add_panel_state", () => {
    it("回传画布上已经在用的那个状态", async () => {
      const deps = makeDeps();

      const reply = await run(deps, [{ op: "add_panel_state", panelId: 5, stateName: "状态2" }]);

      expect(deps.addPanelState).toHaveBeenCalledWith(comp(5), "状态2");
      expect(reply).toEqual({ results: [{ ok: true, state: { id: "state-1", name: "状态2" } }] });
    });

    it("面板找不到：回 error", async () => {
      const reply = await run(makeDeps(), [{ op: "add_panel_state", panelId: 999, stateName: "x" }]);

      expect(reply).toEqual({ results: [{ ok: false, error: "找不到动态面板 999" }] });
    });
  });

  it("整批在同一次画布写入里串行执行：后一个 op 等前一个完成", async () => {
    const order: string[] = [];
    const deps = makeDeps({
      moveComponents: vi.fn(async (ids: number[]) => {
        order.push(`start ${ids[0]}`);
        await new Promise((resolve) => setTimeout(resolve, 5));
        order.push(`end ${ids[0]}`);
        return { success: true, message: "" };
      })
    });

    await run(deps, [
      { op: "move_components", componentIds: [1] },
      { op: "move_components", componentIds: [2] }
    ]);

    expect(order).toEqual(["start 1", "end 1", "start 2", "end 2"]);
  });
});

describe("createdComponentResult", () => {
  it("拿不到实例时回 error，带上调用方给的描述", () => {
    expect(createdComponentResult(undefined, "分组创建成功")).toEqual({
      ok: false,
      error: "分组创建成功但找不到对应实例"
    });
  });
});
