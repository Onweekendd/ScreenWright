import type { ComponentType, PanelState, SystemComponentProps } from "@screenwright/types";
import { FolderEnum, PanelEnum } from "@screenwright/types";
import { existsSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { ScreenReader } from "@/mastra/services/bi-data-sync/screen-read";

// 在模块加载前设置 WORKSPACE_PATH，使 getScreenDirPath 指向测试输出目录
const OUTPUT_DIR = path.resolve(__dirname, "mock");
process.env.MASTRA_WORKSPACE_PATH = OUTPUT_DIR;

const readTopLevel = () => new ScreenReader({ id: "75_1" }).readComponents("");

const findById = (components: ComponentType[], id: number) => components.find((component) => component.id === id);

/** 取动态面板某个状态；config 落盘时是 basename 字符串，读回来应已还原成组件对象 */
const statesOf = (component: ComponentType | undefined): PanelState[] =>
  ((component as SystemComponentProps | undefined)?.panelData ?? []) as PanelState[];

const configOf = (state: PanelState | undefined) => (state?.config ?? []) as unknown as ComponentType[];

describe("工作区复用大屏数据", () => {
  /**
   * mock 工作区 screen_75_1 的组件结构（顶层按 zIndex 升序列出，与读取顺序一致）：
   * 4152 条形图                                                              z=0
   * 4153 条形图                                                              z=0
   * 4166 vue-part（Vue2 组件，模板/脚本/样式在伴生 4166_自定义组件.vue 里）    z=0
   * 4156 分组 ── 4154 条形图 / 4155 条形图                                    z=1
   * 4157 动态面板                                                            z=2
   *   ├─ 状态1 ── 4158 条形图
   *   ├─ 状态2 ── 4161 分组 ── 4159 排名图 / 4160 条形图
   *   └─ 状态3 ── 4162 面积折线图
   *              4163 动态面板 ── 状态1 ── 4164 条形图
   *                            └─ 状态2 ── 4165 面积折线图
   */
  describe("顶层组件", () => {
    it("按 zIndex 升序读出全部五个顶层组件", () => {
      const components = readTopLevel();

      // 目录列出的是文件名字典序（4152/4153/4156/4157/4166），叠放次序只由 zIndex 承载：
      // 4166 的 zIndex 为 0，应排在 4156(z=1)、4157(z=2) 之前
      expect(components.map((component) => [component.id, component.zIndex])).toEqual([
        [4152, 0],
        [4153, 0],
        [4166, 0],
        [4156, 1],
        [4157, 2]
      ]);
    });

    it("叶子组件不带 children 与 panelData", () => {
      const leaf = findById(readTopLevel(), 4152);

      expect(leaf?.component.prop).toBe("echartstripBar");
      expect(leaf?.children).toBeUndefined();
      expect(statesOf(leaf)).toEqual([]);
    });
  });

  describe("分组组件", () => {
    it("children 由 basename 还原成子组件对象", () => {
      const group = findById(readTopLevel(), 4156);

      expect(group?.component.prop).toBe(FolderEnum.group);
      expect(group?.children?.map((child) => child.id)).toEqual([4154, 4155]);
      // 还原成对象而非落盘时的 basename 字符串
      expect(group?.children?.every((child) => typeof child === "object")).toBe(true);
    });
  });

  describe("动态面板", () => {
    it("保留全部状态及其元信息", () => {
      const panel = findById(readTopLevel(), 4157);
      const states = statesOf(panel);

      expect(panel?.component.prop).toBe(PanelEnum.dynamicPanel);
      expect(states.map((state) => state.name)).toEqual(["状态1", "状态2", "状态3"]);
      expect(states[0].id).toBe("383e71a4-f5fb-4733-ada9-724718985971");
      expect(states[0].adaptationNorm).toBe("default");
    });

    it("每个状态的 config 由 basename 还原成组件对象", () => {
      const states = statesOf(findById(readTopLevel(), 4157));

      expect(configOf(states[0]).map((component) => component.id)).toEqual([4158]);
      expect(configOf(states[2]).map((component) => component.id)).toEqual([4162, 4163]);
      expect(configOf(states[0])[0].component.prop).toBe("echartstripBar");
    });

    it("状态内的分组组件继续递归展开", () => {
      const states = statesOf(findById(readTopLevel(), 4157));
      const groupInState = configOf(states[1])[0];

      expect(groupInState.id).toBe(4161);
      expect(groupInState.component.prop).toBe(FolderEnum.group);
      expect(groupInState.children?.map((child) => child.id)).toEqual([4159, 4160]);
    });

    it("状态内嵌套的动态面板继续递归展开", () => {
      const states = statesOf(findById(readTopLevel(), 4157));
      const nestedPanel = configOf(states[2]).find((component) => component.id === 4163);
      const nestedStates = statesOf(nestedPanel);

      expect(nestedPanel?.component.prop).toBe(PanelEnum.dynamicPanel);
      expect(nestedStates.map((state) => state.name)).toEqual(["状态1", "状态2"]);
      expect(configOf(nestedStates[0]).map((component) => component.id)).toEqual([4164]);
      expect(configOf(nestedStates[1]).map((component) => component.id)).toEqual([4165]);
    });
  });

  describe("整屏读取", () => {
    it("read 把工作区目录还原成 ParsedLargeScreenInfo", () => {
      const screen = new ScreenReader({ id: "75_1" }).read();

      expect(screen.id).toBe(75);
      expect(screen.versionCode).toBe("1");
      expect(screen.layers.map((component) => component.id)).toEqual([4152, 4153, 4166, 4156, 4157]);
      expect(screen.aniFrameSet).toBeTruthy();
      expect(screen.statusAnimation).toBeTruthy();
    });

    it("dataFilterArr 目录为空时返回空表", () => {
      const screen = new ScreenReader({ id: "75_1" }).read();

      expect(screen.dataFilterArr).toEqual({});
    });

    it("读取不存在的大屏时抛出带相对路径的错误", () => {
      expect(() => new ScreenReader({ id: "不存在_1" }).read()).toThrow(/Screen file not found: info\.json/);
    });
  });

  describe("vue-part（Vue2 组件）", () => {
    const optionOf = (component: ComponentType | undefined) =>
      ((component as { option?: Record<string, string> } | undefined)?.option ?? {}) as Record<string, string>;

    it("option 的三段由 .vue 指针还原成真实内容", () => {
      const option = optionOf(findById(readTopLevel(), 4166));

      // 落盘时三个字段存的都是 "4166_自定义组件.vue" 指针
      expect(option.template).toBe(`<template>\n  <div class="fun-card">{{ info.title }}</div>\n</template>`);
      expect(option.css).toBe(`.fun-card {\n  color: #fff;\n}`);
      expect(option.js).toContain("function generate(info)");
    });

    it("剥除落盘时注入的类型锚点", () => {
      const option = optionOf(findById(readTopLevel(), 4166));

      // 锚点是给 agent 做 vue-tsc 类型检查用的，后端只认纯 generate(info) 工厂字符串
      expect(option.js).not.toContain("@__vp_types__");
      expect(option.js).not.toContain("@__vp_anchor__");
      expect(option.js).not.toContain("export default generate");
      expect(option.js.startsWith("function generate(info)")).toBe(true);
    });

    it("option 的其余配置字段原样保留", () => {
      const option = optionOf(findById(readTopLevel(), 4166));

      expect(option.refresh).toBeDefined();
      expect(option.legendShow).toBeDefined();
    });

    it("非 vue-part 组件不受影响", () => {
      const option = optionOf(findById(readTopLevel(), 4152));

      // 同名 .vue 不存在，option 原样返回，不会凭空多出 template/js/css
      expect(option.template).toBeUndefined();
      expect(option.js).toBeUndefined();
    });
  });

  describe("非组件文件", () => {
    it("跳过 _layout.json 等下划线开头的元数据文件", () => {
      const components = readTopLevel();

      // _layout.json 若被当组件解析会直接抛 schema 校验错，能读到这里就说明已跳过
      expect(components.every((component) => typeof component.id === "number")).toBe(true);
    });

    it("读取不存在的目录返回空数组且不创建目录", () => {
      const reader = new ScreenReader({ id: "75_1" });

      expect(reader.readComponents("不存在的目录")).toEqual([]);
      expect(existsSync(path.join(OUTPUT_DIR, "screen_75_1", "component", "不存在的目录"))).toBe(false);
    });
  });
});
