import { cpSync, readFileSync, rmSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// 在模块加载前设置 WORKSPACE_PATH：本用例会**写**工作区，不能直接用只读的 mock 目录
const OUTPUT_DIR = path.resolve(__dirname, "output");
process.env.MASTRA_WORKSPACE_PATH = OUTPUT_DIR;

import { applyComponentEdit } from "@/mastra/services/bi-data-sync/component-edit";
import { createScreenEditor } from "@/mastra/services/bi-data-sync/screen-read";

const SCREEN_ID = "75_1";
const FIXTURE = path.resolve(__dirname, "..", "data-read", "mock", `screen_${SCREEN_ID}`);
const screenDir = path.join(OUTPUT_DIR, `screen_${SCREEN_ID}`);
const componentDir = path.join(screenDir, "component");

const GROUP_FILE = path.join(componentDir, "4156_分组.json");
const MEMBER_FILE = path.join(componentDir, "4156_分组", "4155_条形图.json");
const TOP_LEVEL_FILE = path.join(componentDir, "4152_条形图.json");
const VUE_PART_FILE = path.join(componentDir, "4166_自定义组件.json");
const VUE_SFC_FILE = path.join(componentDir, "4166_自定义组件.vue");

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8")) as Record<string, any>;

/**
 * 模拟 agent 的一次编辑：拿磁盘上那份、改几个字段、序列化回文本——**刻意不落盘**。
 * applyComponentEdit 的入参就是这段文本，落盘完全交给它内部的整屏回写。
 */
const editedContent = (file: string, mutate: (json: Record<string, any>) => void): string => {
  const json = readJson(file);
  mutate(json);
  return JSON.stringify(json, null, 2);
};

const boxOf = (json: Record<string, any>) => ({
  left: json.left,
  top: json.top,
  width: json.component.width,
  height: json.component.height
});

/**
 * 组件被编辑之后，把这次改动合进内存中的整屏树、让 core 重算派生值，再整屏回写工作区。
 *
 * 用 data-read 的 mock 工作区（拷一份出来改，原目录是只读 fixture）：
 *   4156 分组  left=0 top=13 1200×300     ← 恰是两个成员的并集
 *     ├─ 4154  left=0   top=13 600×300
 *     └─ 4155  left=600 top=13 600×300
 */
describe("applyComponentEdit", () => {
  // fixture 目录里带着 .git（它在仓库里是个 gitlink），拷进来会让 Windows 上的清理撞 EBUSY，
  // 而且它跟本用例毫无关系
  const copyFixture = () =>
    cpSync(FIXTURE, screenDir, { recursive: true, filter: (src) => !src.split(/[\\/]/).includes(".git") });
  const cleanOutput = () => rmSync(OUTPUT_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });

  beforeEach(() => {
    cleanOutput();
    copyFixture();
  });

  afterEach(cleanOutput);

  it("改动分组成员的位置后，父分组的包围盒被重算并写回磁盘", async () => {
    expect(boxOf(readJson(GROUP_FILE))).toEqual({ left: 0, top: 13, width: 1200, height: 300 });

    // 模拟 agent 编辑：把 4155 从 left=600 挪到 left=100
    const outcome = await applyComponentEdit(
      MEMBER_FILE,
      editedContent(MEMBER_FILE, (member) => {
        member.left = 100;
      })
    );

    // 编辑本身落了盘——落盘的唯一途径就是 applyComponentEdit 内部的整屏回写
    expect(readJson(MEMBER_FILE).left).toBe(100);
    // 并集变成 [0, 700]，分组的 json 里也是这个值——不是等前端回写才对
    expect(boxOf(readJson(GROUP_FILE))).toEqual({ left: 0, top: 13, width: 700, height: 300 });
    expect(outcome?.notice).toContain("父分组 4156");
  });

  it("agent 直接写分组的尺寸时被按成员重算覆盖，磁盘与返回对象都被改正", async () => {
    // 模拟 agent 编辑：把分组的尺寸/位置直接写成自己想要的值
    const outcome = await applyComponentEdit(
      GROUP_FILE,
      editedContent(GROUP_FILE, (group) => {
        group.left = 500;
        group.component.width = 9999;
      })
    );

    // 返回的那份（调用方拿去推前端）已被 core 改正，磁盘上也被覆盖
    expect(boxOf(outcome!.component as unknown as Record<string, any>)).toEqual({
      left: 0,
      top: 13,
      width: 1200,
      height: 300
    });
    expect(boxOf(readJson(GROUP_FILE))).toEqual({ left: 0, top: 13, width: 1200, height: 300 });
    expect(outcome?.notice).toContain("分组 4156");
  });

  it("改动顶层组件时没有派生值要算，不产生提示", async () => {
    const outcome = await applyComponentEdit(
      TOP_LEVEL_FILE,
      editedContent(TOP_LEVEL_FILE, (component) => {
        component.left = 42;
      })
    );

    expect(outcome?.notice).toBeUndefined();
    expect(outcome?.component.left).toBe(42);
    expect(readJson(TOP_LEVEL_FILE).left).toBe(42);
  });

  it("agent 删掉的字段真的会消失，不是只做覆盖", async () => {
    expect(readJson(TOP_LEVEL_FILE).openFilter).toBeDefined();

    await applyComponentEdit(
      TOP_LEVEL_FILE,
      editedContent(TOP_LEVEL_FILE, (component) => {
        delete component.openFilter;
      })
    );

    expect(readJson(TOP_LEVEL_FILE).openFilter).toBeUndefined();
  });

  it("组件不在树上时返回 null，工作区一个字节都没动", async () => {
    const before = readJson(TOP_LEVEL_FILE);

    const outcome = await applyComponentEdit(
      TOP_LEVEL_FILE,
      editedContent(TOP_LEVEL_FILE, (component) => {
        component.id = 999999;
        component.left = 42;
      })
    );

    expect(outcome).toBeNull();
    // 落盘只有整屏回写这一条路，接不上 core 就等于什么都没发生——不留半截编辑
    expect(readJson(TOP_LEVEL_FILE)).toEqual(before);
    // 这条路只管「改」；真把它 upsert 进去，顶层就会多出一个谁都没建过的组件
    const layers = createScreenEditor(SCREEN_ID).component.getLayers();
    expect(layers.map((item) => item.id)).toEqual([4152, 4153, 4166, 4156, 4157]);
  });

  it("路径不在工作区内时返回 null，不抛错", async () => {
    const outside = path.resolve(OUTPUT_DIR, "..", "somewhere-else.json");

    await expect(applyComponentEdit(outside, JSON.stringify({ id: 4152 }))).resolves.toBeNull();
  });

  it("返回的组件是内联好的：分组带真实子组件对象，不是 basename 字符串", async () => {
    const outcome = await applyComponentEdit(GROUP_FILE, readFileSync(GROUP_FILE, "utf8"));

    // 磁盘上 children 存的是 ["4155_条形图", "4154_条形图"]，回来必须已经换成对象
    const children = (outcome!.component.children ?? []) as Array<{ id: number }>;
    expect(children.map((child) => child.id)).toEqual([4154, 4155]);
  });

  it("编辑 vue-part 的 json 不会把 option 里的 .vue 指针当内容写坏伴生文件", async () => {
    // 磁盘形态下这三个字段存的是文件名，真内容在同名 .vue 里
    expect(readJson(VUE_PART_FILE).option.template).toBe("4166_自定义组件.vue");
    const sfcBefore = readFileSync(VUE_SFC_FILE, "utf8");

    const outcome = await applyComponentEdit(
      VUE_PART_FILE,
      editedContent(VUE_PART_FILE, (component) => {
        component.left = 999;
      })
    );

    // 返回给前端的是真模板内容，不是文件名
    expect(outcome!.component.option?.template).toContain("<template>");
    // 伴生 .vue 原样不动：内联没做好的话，"4166_自定义组件.vue" 这个字符串会被当模板写进去
    expect(readFileSync(VUE_SFC_FILE, "utf8")).toBe(sfcBefore);
    // json 里仍是指针，且这次编辑生效了
    expect(readJson(VUE_PART_FILE).option.template).toBe("4166_自定义组件.vue");
    expect(readJson(VUE_PART_FILE).left).toBe(999);
  });
});
