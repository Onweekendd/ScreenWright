import { cpSync, existsSync, readFileSync, rmSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// 在模块加载前设置 WORKSPACE_PATH：这些用例都会**写**工作区，不能直接用只读的 mock 目录
const OUTPUT_DIR = path.resolve(__dirname, "output-mutation");
process.env.MASTRA_WORKSPACE_PATH = OUTPUT_DIR;

import { createPanelState } from "@screenwright/core";
import type { ComponentType, Filter, PanelState } from "@screenwright/types";

import {
  applyComponentDelete,
  applyComponentGroup,
  applyComponentMove,
  applyComponentUngroup,
  applyFilterDelete,
  applyFilterSave,
  applyPanelStateAdd
} from "@/mastra/services/bi-data-sync/screen-mutation";
import { createScreenEditor } from "@/mastra/services/bi-data-sync/screen-read";

const SCREEN_ID = "75_1";
const FIXTURE = path.resolve(__dirname, "..", "data-read", "mock", `screen_${SCREEN_ID}`);
const screenDir = path.join(OUTPUT_DIR, `screen_${SCREEN_ID}`);

const GROUP_ID = 4156;
const PANEL_ID = 4157;
const PANEL_STATE_2 = "300675f8-766f-4033-89d0-8b318921b347";

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8")) as Record<string, any>;
const inWorkspace = (relPath: string) => path.join(OUTPUT_DIR, relPath);
const componentFile = (...segments: string[]) => path.join(screenDir, "component", ...segments);

/**
 * 前端建好的分组容器：children 已装配（core 会直接采用，成员旧副本由 upsert 的「先摘再放」带走）。
 *
 * 拿 fixture 里那个真实分组改 id/name，而不是手搓一个最小对象——落盘后下一次 ScreenReader 读回来
 * 会过 schema，手搓的过不了，测出来的是 fixture 的问题不是逻辑的。
 */
const builtGroup = (id: number, memberIds: number[]): ComponentType =>
  ({
    ...readJson(componentFile("4156_分组.json")),
    id,
    name: "新分组",
    title: "新分组",
    children: memberIds.map((memberId) => readJson(componentFile(`${memberId}_条形图.json`))),
    zIndex: 99
  }) as unknown as ComponentType;

const filterOf = (name: string, bindComponent: Array<{ label: string; id: number }>): Filter =>
  ({
    name,
    callBack: [],
    callBackStatus: false,
    dataFormatter: "(data) => data.slice(0, 3)",
    bindComponent,
    checked: true,
    notSaved: false,
    tempPool: { callBack: [], dataFormatter: "" },
    show: true
  }) as Filter;

/** 建一条**双向完整**的绑定：过滤器的 bindComponent 与组件的 listenArgs 都写上 */
const bindFilter = (name: string, bindComponent: Array<{ label: string; id: number }>) =>
  applyFilterSave(SCREEN_ID, filterOf(name, bindComponent));

/**
 * 「前端确认之后由后端过 core 落盘」那批入口的行为。
 *
 * 它们的共同形状是：整屏读 → core 改 → 一次整屏回写。所以每条都要钉两件事——
 * **树改对了**（core 的语义），以及**磁盘跟着对了**（旧路径清掉、新路径出现、孤儿清掉）。
 * 前端跑的是同一批 core 方法，两边因此不会分叉。
 */
describe("screen-mutation", () => {
  const copyFixture = () =>
    cpSync(FIXTURE, screenDir, { recursive: true, filter: (src) => !src.split(/[\\/]/).includes(".git") });
  const cleanOutput = () => rmSync(OUTPUT_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });

  beforeEach(() => {
    cleanOutput();
    copyFixture();
  });

  afterEach(cleanOutput);

  describe("applyComponentMove", () => {
    it("移动到分组后旧路径消失、新路径出现，返回的就是新路径", async () => {
      expect(existsSync(componentFile("4152_条形图.json"))).toBe(true);

      const moved = await applyComponentMove(SCREEN_ID, [4152], { parentId: GROUP_ID, parentType: "group" });

      expect(moved).toEqual([
        { componentId: 4152, filePath: `screen_${SCREEN_ID}/component/4156_分组/4152_条形图.json` }
      ]);
      expect(existsSync(inWorkspace(moved[0].filePath))).toBe(true);
      // 组件不重建、id 不变，所以磁盘上不能新旧并存
      expect(existsSync(componentFile("4152_条形图.json"))).toBe(false);
      expect(readJson(inWorkspace(moved[0].filePath)).parent).toBe(GROUP_ID);
    });

    it("移动到根级时清掉 parent 记账，文件回到 component/ 顶层", async () => {
      const moved = await applyComponentMove(SCREEN_ID, [4154]);

      expect(moved[0].filePath).toBe(`screen_${SCREEN_ID}/component/4154_条形图.json`);
      expect(readJson(inWorkspace(moved[0].filePath)).parent).toBeUndefined();
      expect(existsSync(componentFile("4156_分组", "4154_条形图.json"))).toBe(false);
    });

    it("移进分组后分组包围盒随成员重算", async () => {
      // 4152 在 left=0 之外的位置，进组后分组框必须把它括进去
      const before = readJson(componentFile("4156_分组.json"));
      const moving = readJson(componentFile("4152_条形图.json"));

      await applyComponentMove(SCREEN_ID, [4152], { parentId: GROUP_ID, parentType: "group" });

      const after = readJson(componentFile("4156_分组.json"));
      expect(after.left).toBeLessThanOrEqual(Math.min(before.left, moving.left));
    });

    it("组件不在树上时抛错，工作区一个字节都没动", async () => {
      const before = readJson(componentFile("4152_条形图.json"));

      await expect(applyComponentMove(SCREEN_ID, [999999])).rejects.toThrow("999999");

      expect(readJson(componentFile("4152_条形图.json"))).toEqual(before);
    });
  });

  describe("applyComponentGroup", () => {
    it("成员被收进新分组：文件挪到分组目录下，parent 记账、包围盒都由 core 算", async () => {
      const created = await applyComponentGroup(SCREEN_ID, builtGroup(9200, [4152, 4153]), [4152, 4153]);

      expect(created?.filePath).toBe(`screen_${SCREEN_ID}/component/9200_新分组.json`);
      expect(existsSync(componentFile("9200_新分组", "4152_条形图.json"))).toBe(true);
      expect(existsSync(componentFile("9200_新分组", "4153_条形图.json"))).toBe(true);
      // 成员原来在根级，旧文件不能留下
      expect(existsSync(componentFile("4152_条形图.json"))).toBe(false);
      expect(readJson(componentFile("9200_新分组", "4152_条形图.json")).parent).toBe(9200);

      const group = readJson(componentFile("9200_新分组.json"));
      // 落盘时分组自身的 children 退化成 basename 列表
      expect(group.children).toEqual(["4152_条形图", "4153_条形图"]);
    });

    it("分组自身按 placement 落进动态面板状态", async () => {
      const created = await applyComponentGroup(SCREEN_ID, builtGroup(9201, [4152]), [4152], {
        parentId: PANEL_ID,
        parentType: "dynamicPanel",
        stateId: PANEL_STATE_2
      });

      expect(created?.filePath).toBe(
        `screen_${SCREEN_ID}/component/4157_动态面板/${PANEL_STATE_2}_状态2/9201_新分组.json`
      );
      expect(existsSync(inWorkspace(created!.filePath))).toBe(true);
    });
  });

  describe("applyComponentUngroup", () => {
    it("子组件提升到分组原来那一层，分组容器与其目录一并消失", async () => {
      const moved = await applyComponentUngroup(SCREEN_ID, [GROUP_ID]);

      expect(moved.map((item) => item.componentId).sort()).toEqual([4154, 4155]);
      expect(moved.map((item) => item.filePath).sort()).toEqual([
        `screen_${SCREEN_ID}/component/4154_条形图.json`,
        `screen_${SCREEN_ID}/component/4155_条形图.json`
      ]);
      for (const item of moved) {
        expect(existsSync(inWorkspace(item.filePath))).toBe(true);
        expect(readJson(inWorkspace(item.filePath)).parent).toBeUndefined();
      }
      // 分组节点被 core 整个摘掉，孤儿文件与子目录由整屏回写清掉
      expect(existsSync(componentFile("4156_分组.json"))).toBe(false);
      expect(existsSync(componentFile("4156_分组"))).toBe(false);
      expect(createScreenEditor(SCREEN_ID).component.find(GROUP_ID)).toBeNull();
    });
  });

  describe("applyComponentDelete", () => {
    it("删掉的组件文件与它的子目录都消失", async () => {
      expect(existsSync(componentFile("4156_分组", "4154_条形图.json"))).toBe(true);

      await expect(applyComponentDelete(SCREEN_ID, GROUP_ID)).resolves.toBe(true);

      expect(existsSync(componentFile("4156_分组.json"))).toBe(false);
      expect(existsSync(componentFile("4156_分组"))).toBe(false);
      // 分组连整棵子树一起走
      expect(createScreenEditor(SCREEN_ID).component.find(4154)).toBeNull();
    });

    it("组件本来就不在树上时返回 false，其余文件除死键外原样保留", async () => {
      const before = readJson(componentFile("4152_条形图.json"));
      // fixture 是从真实导出来的，带着后端组件模板塞进来的 callbackArgs 死键
      expect(before).toHaveProperty("callbackArgs");

      await expect(applyComponentDelete(SCREEN_ID, 999999)).resolves.toBe(false);

      const after = readJson(componentFile("4152_条形图.json"));

      // ScreenReader 在读取时剥掉 callbackArgs（screen-read.ts 的 stripDeadKeys）：它不在
      // ComponentFlatSchema 里、前端也没有任何一处读它，留着只会把 agent 引向错误的字段名。
      // 剥在读取侧是为了顺带清存量——整屏回写用的就是读出来的树，碰一次就干净一次，
      // 本例里那次「失败的删除」同样触发了整屏回写，于是死键在这里消失。
      expect(after).not.toHaveProperty("callbackArgs");

      const { callbackArgs: _dead, ...expected } = before;
      expect(after).toEqual(expected);
    });

    it("删组件时把它从过滤器的 bindComponent 里摘掉", async () => {
      // 用 applyFilterSave 建绑定而不是手写文件：core 认的是组件上的 listenArgs，
      // 只往过滤器里塞一条 bindComponent 是半截绑定，删组件时反查不到
      await bindFilter("我的过滤器", [
        { label: "条形图", id: 4152 },
        { label: "条形图", id: 4153 }
      ]);

      await applyComponentDelete(SCREEN_ID, 4152);

      const filter = readJson(path.join(screenDir, "dataFilterArr", "我的过滤器.json"));
      expect(filter.bindComponent.map((item: { id: number }) => item.id)).toEqual([4153]);
    });
  });

  describe("applyPanelStateAdd", () => {
    it("状态原样追加进 panelData，id 用前端给的那一个", async () => {
      // 前端建状态用的就是 core 这个 createPanelState（app 侧 createLocalPanelStatus 即它的别名）
      const state: PanelState = { ...createPanelState(3), id: "state-from-frontend", name: "状态4", title: "状态4" };

      await applyPanelStateAdd(SCREEN_ID, `${PANEL_ID}`, state);

      const panel = readJson(componentFile("4157_动态面板.json"));
      expect(panel.panelData.at(-1)).toMatchObject({ id: "state-from-frontend", name: "状态4" });
    });

    it("同 id 的状态再追加一次是替换而不是重复插入（幂等）", async () => {
      // 前端建状态用的就是 core 这个 createPanelState（app 侧 createLocalPanelStatus 即它的别名）
      const state: PanelState = { ...createPanelState(3), id: "state-from-frontend", name: "状态4", title: "状态4" };

      await applyPanelStateAdd(SCREEN_ID, `${PANEL_ID}`, state);
      await applyPanelStateAdd(SCREEN_ID, `${PANEL_ID}`, { ...state, name: "改名了" });

      const panelData = readJson(componentFile("4157_动态面板.json")).panelData as Array<{ id: string; name: string }>;
      expect(panelData.filter((item) => item.id === "state-from-frontend")).toHaveLength(1);
      expect(panelData.at(-1)?.name).toBe("改名了");
    });

    it("目标不是动态面板时抛错", async () => {
      await expect(applyPanelStateAdd(SCREEN_ID, "4152", createPanelState(0))).rejects.toThrow();
    });
  });

  describe("过滤器", () => {
    it("保存后 {name}.json 与 {name}.js 一并写出，函数体落在 .js 里", async () => {
      await applyFilterSave(SCREEN_ID, filterOf("销售额", [{ label: "条形图", id: 4152 }]));

      const filterDir = path.join(screenDir, "dataFilterArr");
      expect(readJson(path.join(filterDir, "销售额.json"))).toMatchObject({
        name: "销售额",
        // 落盘时 json 里存的是指向伴生 .js 的指针，不是函数体本身
        dataFormatter: "销售额.js"
      });
      expect(readFileSync(path.join(filterDir, "销售额.js"), "utf8")).toBe("(data) => data.slice(0, 3)");
    });

    it("保存时把绑定关系同步到组件的 listenArgs 上", async () => {
      await applyFilterSave(SCREEN_ID, filterOf("销售额", [{ label: "条形图", id: 4152 }]));

      const listenArgs = readJson(componentFile("4152_条形图.json")).listenArgs as Array<{ filterName: string }>;
      expect(listenArgs.map((item) => item.filterName)).toContain("销售额");
    });

    it("删除时两个文件一起消失，组件上的 listenArgs 也被摘干净", async () => {
      await applyFilterSave(SCREEN_ID, filterOf("销售额", [{ label: "条形图", id: 4152 }]));

      await expect(applyFilterDelete(SCREEN_ID, "销售额")).resolves.toBe(true);

      const filterDir = path.join(screenDir, "dataFilterArr");
      expect(existsSync(path.join(filterDir, "销售额.json"))).toBe(false);
      expect(existsSync(path.join(filterDir, "销售额.js"))).toBe(false);
      // 少了这一步，组件上会留一条指向已不存在过滤器的 listenArgs
      const listenArgs = readJson(componentFile("4152_条形图.json")).listenArgs as Array<{ filterName: string }>;
      expect(listenArgs.map((item) => item.filterName)).not.toContain("销售额");
    });
  });
});
