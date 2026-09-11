import { cpSync, existsSync, readFileSync, rmSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// 在模块加载前设置 WORKSPACE_PATH：本用例会**写**工作区，不能直接用只读的 mock 目录
const OUTPUT_DIR = path.resolve(__dirname, "output-create");
process.env.MASTRA_WORKSPACE_PATH = OUTPUT_DIR;

import type { ComponentType } from "@screenwright/types";

import { applyComponentCreate } from "@/mastra/services/bi-data-sync/screen-mutation";
import { createScreenEditor } from "@/mastra/services/bi-data-sync/screen-read";

const SCREEN_ID = "75_1";
const FIXTURE = path.resolve(__dirname, "..", "data-read", "mock", `screen_${SCREEN_ID}`);
const screenDir = path.join(OUTPUT_DIR, `screen_${SCREEN_ID}`);

const GROUP_ID = 4156;
const PANEL_ID = 4157;
const PANEL_STATE_2 = "300675f8-766f-4033-89d0-8b318921b347";

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8")) as Record<string, any>;

/**
 * 模拟前端建好的组件：真实 id 已由业务接口分配，组件菜单默认值与位置尺寸也都算过了。
 *
 * 拿 fixture 里那个真实组件改 id/name/位置，而不是手搓一个最小对象——组件 json 是过 schema 的
 * （落盘后下一次 ScreenReader 读回来会校验），手搓的 prop 过不了，测出来的是 fixture 的问题不是逻辑的。
 */
const builtComponent = (id: number, name: string): ComponentType => {
  const template = readJson(path.join(FIXTURE, "component", "4152_条形图.json"));
  return { ...template, id, name, title: name, left: 10, top: 20 } as unknown as ComponentType;
};

/**
 * 前端建好组件之后，由**后端**过 core 放进树并整屏落盘，路径也由后端从自己的树推。
 *
 * 与 applyComponentEdit 的分工是刻意相反的：那条路 id 不在树上就返回 null（只管改不管建），
 * 这条路是唯一允许插入的入口，因此 placement 必须由调用方明确给出。
 */
describe("applyComponentCreate", () => {
  const copyFixture = () =>
    cpSync(FIXTURE, screenDir, { recursive: true, filter: (src) => !src.split(/[\\/]/).includes(".git") });
  const cleanOutput = () => rmSync(OUTPUT_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });

  beforeEach(() => {
    cleanOutput();
    copyFixture();
  });

  afterEach(cleanOutput);

  it("根级创建：落盘到 component/ 下，返回的 filePath 真实存在", async () => {
    const created = await applyComponentCreate(SCREEN_ID, builtComponent(9001, "新文本"));

    expect(created?.filePath).toBe(`screen_${SCREEN_ID}/component/9001_新文本.json`);
    expect(existsSync(path.join(OUTPUT_DIR, created!.filePath))).toBe(true);
    expect(readJson(path.join(OUTPUT_DIR, created!.filePath))).toMatchObject({ id: 9001, left: 10 });

    const layers = createScreenEditor(SCREEN_ID).component.getLayers();
    expect(layers.map((item) => item.id)).toContain(9001);
  });

  it("建进分组：文件落在分组子目录里，parent 由 core 记账，分组包围盒跟着重算", async () => {
    const groupBefore = readJson(path.join(screenDir, "component", "4156_分组.json"));
    expect(groupBefore.left).toBe(0);

    const created = await applyComponentCreate(SCREEN_ID, builtComponent(9002, "组内文本"), {
      parentId: GROUP_ID,
      parentType: "group"
    });

    expect(created?.filePath).toBe(`screen_${SCREEN_ID}/component/4156_分组/9002_组内文本.json`);
    expect(existsSync(path.join(OUTPUT_DIR, created!.filePath))).toBe(true);
    // parent 记账归 core（约定③之外的派生动作），前端传什么都不采信
    expect(readJson(path.join(OUTPUT_DIR, created!.filePath)).parent).toBe(GROUP_ID);
    // 新成员在 left=10，分组包围盒必须收到 10 之内——包围盒是成员位置的函数
    expect(readJson(path.join(screenDir, "component", "4156_分组.json")).left).toBeLessThanOrEqual(10);
  });

  it("建进动态面板的指定状态：文件落在该状态目录下", async () => {
    const created = await applyComponentCreate(SCREEN_ID, builtComponent(9003, "面板文本"), {
      parentId: PANEL_ID,
      parentType: "dynamicPanel",
      stateId: PANEL_STATE_2
    });

    expect(created?.filePath).toBe(
      `screen_${SCREEN_ID}/component/4157_动态面板/${PANEL_STATE_2}_状态2/9003_面板文本.json`
    );
    expect(existsSync(path.join(OUTPUT_DIR, created!.filePath))).toBe(true);
  });

  it("filePath 用的是磁盘上的真实文件名，不是拿组件名另拼的一份", async () => {
    // 名字里带非法字符且超长，写入侧的 buildIdNameBase 会白名单净化 + 截断到 10 字
    const created = await applyComponentCreate(SCREEN_ID, builtComponent(9004, "销售额/占比统计图表面板一二三"));

    expect(created?.filePath).toBe(`screen_${SCREEN_ID}/component/9004_销售额占比统计图表面.json`);
    expect(existsSync(path.join(OUTPUT_DIR, created!.filePath))).toBe(true);
  });

  it("目标容器不存在时抛错，工作区一个字节都没动", async () => {
    const before = readJson(path.join(screenDir, "component", "4152_条形图.json"));

    await expect(
      applyComponentCreate(SCREEN_ID, builtComponent(9005, "孤儿"), { parentId: 999999, parentType: "group" })
    ).rejects.toThrow("999999");

    // 整屏回写在 upsert 之后，容器定位一失败就抛，落盘那一步压根没跑到
    expect(readJson(path.join(screenDir, "component", "4152_条形图.json"))).toEqual(before);
    expect(createScreenEditor(SCREEN_ID).component.find(9005)).toBeNull();
  });

  it("目标是普通组件而不是分组时抛错", async () => {
    await expect(
      applyComponentCreate(SCREEN_ID, builtComponent(9006, "错位"), { parentId: 4152, parentType: "group" })
    ).rejects.toThrow("不是分组");
  });
});
