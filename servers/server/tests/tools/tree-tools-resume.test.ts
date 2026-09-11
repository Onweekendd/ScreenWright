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

/** 前端建好的分组容器：真实 id 来自业务接口，children 已装配 */
const builtGroup = (id: number, memberIds: number[]) => ({
  ...readJson(componentFile("4156_分组.json")),
  id,
  name: "新分组",
  title: "新分组",
  children: memberIds.map((memberId) => readJson(componentFile(`${memberId}_条形图.json`))),
  zIndex: 99
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
      const result = await run(moveComponentTool, input, { moved: true });

      expect(result.success).toBe(true);
      expect(result.movedComponents).toEqual([
        { componentId: 4152, filePath: `screen_${SCREEN_ID}/component/4156_分组/4152_条形图.json` }
      ]);
      expect(existsSync(componentFile("4156_分组", "4152_条形图.json"))).toBe(true);
      expect(existsSync(componentFile("4152_条形图.json"))).toBe(false);
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

    it("前端回传分组后由后端落盘，成员被收进分组目录", async () => {
      const result = await run(groupComponentTool, input, { component: builtGroup(9300, [4152, 4153]) });

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

      const result = await run(groupComponentTool, { componentIds: ["4154", "4155"] }, { component: nested });

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
      const broken = { ...builtGroup(9301, [4152]), zIndex: "not-a-number" };

      const result = await run(groupComponentTool, input, { component: broken });

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

    it("前端解散后由后端落盘，返回子组件提升后的新路径", async () => {
      const result = await run(ungroupComponentTool, input, { ungrouped: true });

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

    it("前端回传状态后由后端落盘，id 用前端那一个", async () => {
      const result = await run(addPanelStateTool, input, { state: builtState });

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

    it("前端回传副本后由后端落盘，落在 to 指定的容器里", async () => {
      const result = await run(copyComponentTool, input, { component: builtCopy() });

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
        { component: copiedGroup }
      );

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(`screen_${SCREEN_ID}/component/9401_分组副本.json`);
      expect(existsSync(componentFile("9401_分组副本", "9402_条形图.json"))).toBe(true);
    });

    it("回传的副本过不了校验时不落盘", async () => {
      const result = await run(copyComponentTool, input, { component: { ...builtCopy(), zIndex: "not-a-number" } });

      expect(result.success).toBe(false);
      expect(existsSync(componentFile("4156_分组", "9400_副本.json"))).toBe(false);
    });
  });
});
