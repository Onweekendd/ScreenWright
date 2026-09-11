import type { ComponentType } from "@screenwright/types";
import path from "path";
import { describe, expect, it } from "vitest";

import { createScreenEditor, ScreenReader } from "@/mastra/services/bi-data-sync/screen-read";

// 与 data-read.test.ts 同一套：让 getScreenDirPath 指向测试 mock 工作区
process.env.MASTRA_WORKSPACE_PATH = path.resolve(__dirname, "mock");

const idsOf = (components: ComponentType[]) => components.map((component) => component.id);

/** 组件的包围盒：位置在节点上、宽高在 component 上，取值口径与 core 的 assignComponentAttrs 一致 */
const boxOf = (component: ComponentType | null) => ({
  left: component?.left,
  top: component?.top,
  width: component?.component.width,
  height: component?.component.height
});

/**
 * 后端把工作区读成 EditorState 之后，跑的就是前端那一套 core 管理器。
 *
 * mock 工作区 screen_75_1 的相关部分（详见 data-read.test.ts 顶部的完整结构）：
 *   4156 分组 z=1  left=0 top=13 1200×300
 *     ├─ 4154 条形图 z=1  left=0   top=13 600×300
 *     └─ 4155 条形图 z=2  left=600 top=13 600×300
 * 分组的包围盒正好是两个成员的并集——这让「少一个成员就该收紧」可以直接验出来。
 */
describe("工作区驱动 core 编辑器", () => {
  describe("ScreenReader 作为 EditorState", () => {
    it("getState 返回 reader 自身，四个字段即 EditorCoreState", () => {
      const reader = new ScreenReader({ id: "75_1" });
      const state = reader.getState();

      expect(state).toBe(reader);
      expect(idsOf(state.layers)).toEqual([4152, 4153, 4166, 4156, 4157]);
      expect(state.targetChart).toEqual({ hoverId: undefined, selectId: [] });
      expect(state.navInfo.id).toBe(75);
      // navInfo 是整屏信息去掉 layers，不该把组件树再带一份
      expect(state.navInfo).not.toHaveProperty("layers");
    });

    it("componentList 与 layers 是同一个数组，不是副本", () => {
      const reader = new ScreenReader({ id: "75_1" });

      expect(reader.componentList).toBe(reader.layers);
    });

    it("setState 就地合并，reader 引用不会变成过期快照", () => {
      const reader = new ScreenReader({ id: "75_1" });

      reader.setState({ targetChart: { hoverId: undefined, selectId: ["4152"] } });

      // 换新对象的实现会让手里这个 reader 看不到更新
      expect(reader.targetChart.selectId).toEqual(["4152"]);
      expect(reader.getState().targetChart.selectId).toEqual(["4152"]);
    });
  });

  describe("createScreenEditor", () => {
    it("editor 看到的树就是磁盘上的树", () => {
      const editor = createScreenEditor("75_1");

      expect(idsOf(editor.component.getLayers())).toEqual([4152, 4153, 4166, 4156, 4157]);
      expect(idsOf(editor.component.find(4156)?.children ?? [])).toEqual([4154, 4155]);
    });

    it("删掉分组成员后，分组包围盒按剩下的成员收紧", () => {
      const editor = createScreenEditor("75_1");

      expect(boxOf(editor.component.find(4156))).toEqual({ left: 0, top: 13, width: 1200, height: 300 });

      editor.component.delete(4155);

      expect(idsOf(editor.component.find(4156)?.children ?? [])).toEqual([4154]);
      // 收紧成 4154 自己的盒子——这一步没人在后端手写过，跑的是 core 的 reflowGroup
      expect(boxOf(editor.component.find(4156))).toEqual({ left: 0, top: 13, width: 600, height: 300 });
    });

    it("成员只剩一个时分组自动解散，成员升到顶层并继承分组层级", () => {
      const editor = createScreenEditor("75_1");
      const groupZIndex = editor.component.find(4156)!.zIndex;

      editor.component.delete(4155);
      const promoted = editor.component.dissolveIfUnderfilled(4156);

      expect(idsOf(promoted ?? [])).toEqual([4154]);
      expect(editor.component.find(4156)).toBeNull();
      // 解组保留原来的数组位置，4154 顶替了 4156 那一格
      expect(idsOf(editor.component.getLayers())).toEqual([4152, 4153, 4166, 4154, 4157]);
      expect(editor.component.find(4154)?.zIndex).toBe(groupZIndex);
    });

    it("两个 editor 各读各的，改一个不会污染另一个", () => {
      const a = createScreenEditor("75_1");
      const b = createScreenEditor("75_1");

      a.component.delete(4155);

      expect(idsOf(a.component.find(4156)?.children ?? [])).toEqual([4154]);
      expect(idsOf(b.component.find(4156)?.children ?? [])).toEqual([4154, 4155]);
    });

    it("大屏不存在时立刻抛错，而不是拿到一个空编辑器", () => {
      expect(() => createScreenEditor("不存在_1")).toThrow(/Screen file not found: info\.json/);
    });
  });
});
