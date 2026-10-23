import { cpSync, existsSync, readFileSync, rmSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// 在模块加载前设置 WORKSPACE_PATH：这些用例会**写**工作区，不能直接用只读的 mock 目录
const OUTPUT_DIR = path.resolve(__dirname, "output-tree-tools");
process.env.MASTRA_WORKSPACE_PATH = OUTPUT_DIR;

import { createPanelState } from "@screenwright/core";

import { createScreenEditor } from "@/mastra/services/bi-data-sync/screen-read";
import { addPanelStateTool } from "@/mastra/tools/add-panel-state";
import { copyComponentTool } from "@/mastra/tools/copy-component";
import { groupComponentTool } from "@/mastra/tools/group-component";
import { moveComponentTool } from "@/mastra/tools/move-component";
import { ungroupComponentTool } from "@/mastra/tools/ungroup-component";

const SCREEN_ID = "75_1";
const FIXTURE = path.resolve(__dirname, "..", "data-read", "mock", `screen_${SCREEN_ID}`);
const screenDir = path.join(OUTPUT_DIR, `screen_${SCREEN_ID}`);
const GROUP_ID = 4156;
const PANEL_ID = 4157;

interface ToolResult {
  success: boolean;
  message: string;
  filePath?: string;
  stateId?: string;
  movedComponents?: Array<{ componentId: number; filePath: string }>;
}

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
const componentFile = (...segments: string[]) => path.join(screenDir, "component", ...segments);
const panelStates = () => readJson(componentFile("4157_动态面板.json")).panelData as Array<Record<string, unknown>>;

const run = (
  tool: { execute?: unknown },
  input: Record<string, unknown>,
  resumeData?: Record<string, unknown>
): Promise<ToolResult> => {
  const execute = tool.execute as (i: Record<string, unknown>, c: Record<string, unknown>) => Promise<ToolResult>;
  return execute(input, {
    requestContext: { get: () => undefined },
    // suspend 的返回值被工具直接 return 出去；首次执行的用例只关心它有没有动磁盘
    agent: { resumeData, suspend: async () => undefined }
  });
};

/** 首次执行：收下工具挂起时发给前端的载荷。mode 不传就是自动模式 */
const suspendedPayload = async (
  tool: { execute?: unknown },
  input: Record<string, unknown>,
  mode?: string
): Promise<Record<string, unknown>> => {
  const execute = tool.execute as (i: Record<string, unknown>, c: Record<string, unknown>) => Promise<unknown>;
  let payload: Record<string, unknown> | undefined;
  await execute(input, {
    requestContext: { get: (key: string) => (key === "mode" ? mode : undefined) },
    agent: {
      suspend: async (p: Record<string, unknown>) => {
        payload = p;
      }
    }
  });
  return payload!;
};

/** 前端对 ops 的回执（canvas_ops 的 resume 形状：results 与 ops 按下标对应） */
const replied = (...results: Array<Record<string, unknown>>) => ({ results });
const done = (extra: Record<string, unknown> = {}) => ({ ok: true, ...extra });

/** 前端建好的分组容器：真实 id 来自业务接口，children 已装配 */
const builtGroup = (id: number, memberIds: number[]) => ({
  ...readJson(componentFile("4156_分组.json")),
  id,
  name: "新分组",
  title: "新分组",
  children: memberIds.map((memberId) => readJson(componentFile(`${memberId}_条形图.json`))),
  zIndex: "b2f"
});

/**
 * 树操作类工具的 resume 分支：**前端改画布、后端过 core 落盘**。
 *
 * 每条都钉两件事——首次执行只挂起（磁盘一个字节没动），以及 resume 之后工作区确实跟上了。
 * 返给 agent 的路径一律由后端改完自己的树再扫盘推，不由前端拼。
 */
describe("树操作工具的 resume", () => {
  const copyFixture = () =>
    cpSync(FIXTURE, screenDir, { recursive: true, filter: (src) => !src.split(/[\\/]/).includes(".git") });
  const cleanOutput = () => rmSync(OUTPUT_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });

  beforeEach(() => {
    cleanOutput();
    copyFixture();
  });

  afterEach(cleanOutput);

  describe("move_component", () => {
    const input = { componentIds: ["4152"], target: { parentId: "4156" } };

    it("首次执行只挂起，组件还在原路径", async () => {
      await run(moveComponentTool, input);

      expect(existsSync(componentFile("4152_条形图.json"))).toBe(true);
    });

    it("前端挪完之后由后端落盘，返回的新路径真实存在", async () => {
      const result = await run(moveComponentTool, input, replied(done()));

      expect(result.success).toBe(true);
      expect(result.movedComponents).toEqual([
        { componentId: 4152, filePath: `screen_${SCREEN_ID}/component/4156_分组/4152_条形图.json` }
      ]);
      expect(existsSync(componentFile("4156_分组", "4152_条形图.json"))).toBe(true);
      expect(existsSync(componentFile("4152_条形图.json"))).toBe(false);
    });

    it("入参带大屏前缀（75_1/4152）时，交给前端的是纯数字 id，不是原样的字符串", async () => {
      const payload = await suspendedPayload(moveComponentTool, {
        componentIds: [`${SCREEN_ID}/4152`],
        target: { parentId: `${SCREEN_ID}/${GROUP_ID}` }
      });

      expect(payload).toEqual({
        type: "canvas_ops",
        ops: [{ op: "move_components", componentIds: [4152], target: { parentId: GROUP_ID, parentType: "group" } }]
      });
    });

    it("ASK 模式：同一个 canvas_ops 带上 approval，前端先问用户", async () => {
      const payload = await suspendedPayload(moveComponentTool, input, "ask_before_edit");

      expect(payload.type).toBe("canvas_ops");
      expect(payload.approval).toEqual({ purpose: "移动选中的组件" });
    });

    it("前端回执 ok:false 时报前端的错误，不落盘", async () => {
      const result = await run(moveComponentTool, input, replied({ ok: false, error: "找不到组件 4152" }));

      expect(result.success).toBe(false);
      expect(result.message).toContain("找不到组件 4152");
      expect(existsSync(componentFile("4152_条形图.json"))).toBe(true);
    });

    it("回执数量和发出去的 op 数对不上时拒绝，不落盘", async () => {
      const result = await run(moveComponentTool, input, replied(done(), done()));

      expect(result.success).toBe(false);
      expect(result.message).toContain("回执数量");
      expect(existsSync(componentFile("4152_条形图.json"))).toBe(true);
    });

    it("parentType 由磁盘反推：目标是动态面板却没给 stateId 时当场报错", async () => {
      const result = await run(moveComponentTool, { componentIds: ["4152"], target: { parentId: `${PANEL_ID}` } });

      expect(result.success).toBe(false);
      expect(result.message).toContain("stateId");
    });

    it("用户拒绝时不落盘", async () => {
      const result = await run(moveComponentTool, input, { approved: false });

      expect(result.success).toBe(false);
      expect(existsSync(componentFile("4152_条形图.json"))).toBe(true);
    });
  });

  describe("group_component", () => {
    const input = { componentIds: ["4152", "4153"] };

    it("首次执行只挂起，成员还在原路径", async () => {
      await run(groupComponentTool, input);

      expect(existsSync(componentFile("4152_条形图.json"))).toBe(true);
    });

    it("入参带大屏前缀（75_1/4152）时，交给前端的是纯数字 id", async () => {
      const payload = await suspendedPayload(groupComponentTool, {
        componentIds: [`${SCREEN_ID}/4152`, `${SCREEN_ID}/4153`]
      });

      expect(payload).toEqual({ type: "canvas_ops", ops: [{ op: "group_components", componentIds: [4152, 4153] }] });
    });

    it("ASK 模式：带 approval", async () => {
      const payload = await suspendedPayload(groupComponentTool, input, "ask_before_edit");

      expect(payload.approval).toEqual({ purpose: "组合选中的组件为一个分组" });
    });

    it("前端回传分组后由后端落盘，成员被收进分组目录", async () => {
      const result = await run(groupComponentTool, input, replied(done({ component: builtGroup(9300, [4152, 4153]) })));

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(`screen_${SCREEN_ID}/component/9300_新分组.json`);
      expect(existsSync(componentFile("9300_新分组", "4152_条形图.json"))).toBe(true);
      expect(existsSync(componentFile("4152_条形图.json"))).toBe(false);
    });

    it("新分组落在成员原来所在的容器里，不是一律挂到根级", async () => {
      // 4154 / 4155 都住在 4156_分组 里，把它俩再组一层，新分组也该在 4156 下面
      const nested = {
        ...readJson(componentFile("4156_分组.json")),
        id: 9302,
        name: "内层分组",
        title: "内层分组",
        children: [
          readJson(componentFile("4156_分组", "4154_条形图.json")),
          readJson(componentFile("4156_分组", "4155_条形图.json"))
        ]
      };

      const result = await run(
        groupComponentTool,
        { componentIds: ["4154", "4155"] },
        replied(done({ component: nested }))
      );

      expect(result.filePath).toBe(`screen_${SCREEN_ID}/component/4156_分组/9302_内层分组.json`);
      expect(existsSync(componentFile("4156_分组", "9302_内层分组", "4154_条形图.json"))).toBe(true);
    });

    it("成员不在同一个父级下时首次执行就拒绝", async () => {
      // 4152 在根级、4154 在分组里
      const result = await run(groupComponentTool, { componentIds: ["4152", "4154"] });

      expect(result.success).toBe(false);
      expect(result.message).toContain("同一容器");
    });

    it("回传的分组结构过不了校验时不落盘", async () => {
      const broken = { ...builtGroup(9301, [4152]), zIndex: 5 };

      const result = await run(groupComponentTool, input, replied(done({ component: broken })));

      expect(result.success).toBe(false);
      expect(result.message).toContain("校验");
      expect(existsSync(componentFile("4152_条形图.json"))).toBe(true);
      expect(createScreenEditor(SCREEN_ID).component.find(9301)).toBeNull();
    });
  });

  describe("ungroup_component", () => {
    const input = { groupIds: [`${GROUP_ID}`] };

    it("首次执行只挂起，分组还在", async () => {
      await run(ungroupComponentTool, input);

      expect(existsSync(componentFile("4156_分组.json"))).toBe(true);
    });

    it("入参带大屏前缀（75_1/4156）时，交给前端的是纯数字 id", async () => {
      const payload = await suspendedPayload(ungroupComponentTool, { groupIds: [`${SCREEN_ID}/${GROUP_ID}`] });

      expect(payload).toEqual({ type: "canvas_ops", ops: [{ op: "ungroup", groupIds: [GROUP_ID] }] });
    });

    it("ASK 模式：带 approval", async () => {
      const payload = await suspendedPayload(ungroupComponentTool, input, "ask_before_edit");

      expect(payload.approval).toEqual({ purpose: "解散选中的分组" });
    });

    it("前端解散后由后端落盘，返回子组件提升后的新路径", async () => {
      const result = await run(ungroupComponentTool, input, replied(done()));

      expect(result.success).toBe(true);
      expect(result.movedComponents?.map((item) => item.componentId).sort()).toEqual([4154, 4155]);
      expect(existsSync(componentFile("4154_条形图.json"))).toBe(true);
      expect(existsSync(componentFile("4156_分组.json"))).toBe(false);
    });

    it("目标不是分组时首次执行就拒绝", async () => {
      const result = await run(ungroupComponentTool, { groupIds: ["4152"] });

      expect(result.success).toBe(false);
      expect(result.message).toContain("不是分组");
    });
  });

  describe("add_panel_state", () => {
    const input = { panelId: `${PANEL_ID}`, stateName: "状态4" };
    const builtState = { ...createPanelState(3), id: "state-from-frontend", name: "状态4", title: "状态4" };

    it("首次执行只挂起，panelData 没变", async () => {
      const before = panelStates().length;

      await run(addPanelStateTool, input);

      expect(panelStates()).toHaveLength(before);
    });

    it("入参带大屏前缀（75_1/4157）时，交给前端的是纯数字 id", async () => {
      const payload = await suspendedPayload(addPanelStateTool, {
        panelId: `${SCREEN_ID}/${PANEL_ID}`,
        stateName: "状态4"
      });

      expect(payload).toEqual({
        type: "canvas_ops",
        ops: [{ op: "add_panel_state", panelId: PANEL_ID, stateName: "状态4" }]
      });
    });

    it("ASK 模式：带 approval", async () => {
      const payload = await suspendedPayload(addPanelStateTool, input, "ask_before_edit");

      expect(payload.approval).toEqual({ purpose: "给动态面板新增一个状态" });
    });

    it("前端回传状态后由后端落盘，id 用前端那一个", async () => {
      const result = await run(addPanelStateTool, input, replied(done({ state: builtState })));

      expect(result.success).toBe(true);
      expect(result.stateId).toBe("state-from-frontend");
      expect(panelStates().at(-1)).toMatchObject({ id: "state-from-frontend", name: "状态4" });
    });

    it("目标不是动态面板时首次执行就拒绝", async () => {
      const result = await run(addPanelStateTool, { panelId: "4152", stateName: "状态4" });

      expect(result.success).toBe(false);
      expect(result.message).toContain("不是动态面板");
    });
  });

  describe("copy_component", () => {
    const input = {
      from: `screen_${SCREEN_ID}/component/4152_条形图.json`,
      to: `screen_${SCREEN_ID}/component/4156_分组/`
    };
    const builtCopy = () => ({ ...readJson(componentFile("4152_条形图.json")), id: 9400, name: "副本", title: "副本" });

    it("首次执行只挂起，不产生副本文件", async () => {
      await run(copyComponentTool, input);

      expect(existsSync(componentFile("4156_分组", "9400_副本.json"))).toBe(false);
    });

    it("挂起载荷：copy_component op 带源组件和目标容器；ASK 模式带 approval", async () => {
      const auto = await suspendedPayload(copyComponentTool, input);
      const ask = await suspendedPayload(copyComponentTool, input, "ask_before_edit");

      expect(auto).toMatchObject({
        type: "canvas_ops",
        ops: [{ op: "copy_component", component: { id: 4152 }, placement: { parentId: GROUP_ID, parentType: "group" } }]
      });
      expect(auto.approval).toBeUndefined();
      expect(ask.approval).toEqual({ purpose: "复制组件到前端" });
    });

    it("前端回传副本后由后端落盘，落在 to 指定的容器里", async () => {
      const result = await run(copyComponentTool, input, replied(done({ component: builtCopy() })));

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(`screen_${SCREEN_ID}/component/4156_分组/9400_副本.json`);
      expect(existsSync(componentFile("4156_分组", "9400_副本.json"))).toBe(true);
      // 源组件原样留着，复制不是移动
      expect(existsSync(componentFile("4152_条形图.json"))).toBe(true);
    });

    it("复制分组：回传的副本 children 是内联的完整子组件，照样过得了校验", async () => {
      // 前端的 createComponentFromConfig 是递归建的，返回的那一份 children 装的是真实对象而非 id
      const copiedGroup = {
        ...readJson(componentFile("4156_分组.json")),
        id: 9401,
        name: "分组副本",
        title: "分组副本",
        children: [
          { ...readJson(componentFile("4156_分组", "4154_条形图.json")), id: 9402 },
          { ...readJson(componentFile("4156_分组", "4155_条形图.json")), id: 9403 }
        ]
      };

      const result = await run(
        copyComponentTool,
        { from: input.from, to: `screen_${SCREEN_ID}/component/` },
        replied(done({ component: copiedGroup }))
      );

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(`screen_${SCREEN_ID}/component/9401_分组副本.json`);
      expect(existsSync(componentFile("9401_分组副本", "9402_条形图.json"))).toBe(true);
    });

    it("回传的副本过不了校验时不落盘", async () => {
      const result = await run(copyComponentTool, input, replied(done({ component: { ...builtCopy(), zIndex: 5 } })));

      expect(result.success).toBe(false);
      expect(existsSync(componentFile("4156_分组", "9400_副本.json"))).toBe(false);
    });
  });
});
