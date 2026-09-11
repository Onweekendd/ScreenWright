import type { LargeScreeInfo } from "@screenwright/types";
import { describe, expect, it } from "vitest";

import { MemoryEditorState } from "../../state/MemoryEditorState";
import { ScreenManager } from "../ScreenManager";

/**
 * 注意：本测试不引入任何 Vue/UI 框架，直接用 MemoryEditorState 驱动 core，
 * 以此证明 @screenwright/core 框架无关。
 */
function createRawScreen(overrides: Partial<LargeScreeInfo> = {}): LargeScreeInfo {
  return {
    layers: [],
    config: JSON.stringify(["a", "b"]),
    name: "测试大屏",
    detail: JSON.stringify({ width: "1920" }),
    backgroundUrl: "",
    id: 1,
    invitationCode: "",
    status: true,
    type: 1,
    versionCode: "v1",
    versionDesc: null,
    dataFilterArr: JSON.stringify({ f1: { name: "filter1" } }),
    userId: 100,
    updatedBy: "blue",
    updatedTime: "",
    encodedControl: JSON.stringify(["e1"]),
    aniFrameSet: JSON.stringify({ animationList: [{ id: "a1" }] }),
    statusAnimation: JSON.stringify({ animations: { x: 1 } }),
    ...overrides
  } as LargeScreeInfo;
}

describe("ScreenManager", () => {
  it("setNavInfo 应把 JSON 字符串字段解析为对象/数组", () => {
    const manager = new ScreenManager(new MemoryEditorState());
    manager.setNavInfo(createRawScreen());

    const nav = manager.getNavInfo();
    expect(nav.config).toEqual(["a", "b"]);
    expect(nav.encodedControl).toEqual(["e1"]);
    expect(nav.dataFilterArr).toEqual({ f1: { name: "filter1" } });
    expect(nav.aniFrameSet).toEqual({ animationList: [{ id: "a1" }] });
    expect(nav.statusAnimation).toEqual({ animations: { x: 1 } });
    expect(nav.name).toBe("测试大屏");
    expect(nav.id).toBe(1);
  });

  it("已是对象的字段保持原样（parseIfNeeded 容错）", () => {
    const manager = new ScreenManager(new MemoryEditorState());
    manager.setNavInfo(
      createRawScreen({
        config: ["x"],
        dataFilterArr: { k: { name: "n" } } as unknown as LargeScreeInfo["dataFilterArr"]
      })
    );

    const nav = manager.getNavInfo();
    expect(nav.config).toEqual(["x"]);
    expect(nav.dataFilterArr).toEqual({ k: { name: "n" } });
  });

  it("isMultiPerson 仅在 type===2 时为 true", () => {
    const manager = new ScreenManager(new MemoryEditorState());

    manager.setNavInfo(createRawScreen({ type: 2 }));
    expect(manager.isMultiPerson()).toBe(true);

    manager.setNavInfo(createRawScreen({ type: 1 }));
    expect(manager.isMultiPerson()).toBe(false);
  });

  it("replaceNavInfo 是整份替换：少给的字段真的消失，不被旧值补回来", () => {
    const manager = new ScreenManager(new MemoryEditorState());
    manager.setNavInfo(createRawScreen({ sceneId: 42 }));
    // 必填字段少一个都过不了类型；这里删的是可选的 sceneId
    const { dataFilterArr, aniFrameSet, statusAnimation, sceneId: _dropped, ...rest } = manager.getNavInfo();

    manager.replaceNavInfo({ ...rest, name: "改过的名字" });

    const nav = manager.getNavInfo();
    expect(nav.name).toBe("改过的名字");
    // 合并语义下这里会是 42——调用方删掉的字段被旧值静默补回来，正是本方法要避免的
    expect(nav).not.toHaveProperty("sceneId");
    // 三个各自独立管理、独立落盘的字段不在这份元信息里，必须原样留下
    expect(nav.dataFilterArr).toEqual(dataFilterArr);
    expect(nav.aniFrameSet).toEqual(aniFrameSet);
    expect(nav.statusAnimation).toEqual(statusAnimation);
  });

  it("setVersionCode / resetNavInfo 行为正确", () => {
    const manager = new ScreenManager(new MemoryEditorState());
    manager.setNavInfo(createRawScreen({ versionCode: "v1" }));

    manager.setVersionCode("v2");
    expect(manager.getNavInfo().versionCode).toBe("v2");

    manager.resetNavInfo();
    expect(manager.getNavInfo().id).toBe(-1);
    expect(manager.getNavInfo().config).toEqual([]);
  });
});
