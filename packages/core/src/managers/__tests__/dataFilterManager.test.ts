import type { ComponentType, Filter, LargeScreeInfo } from "@screenwright/types";
import { beforeEach, describe, expect, it } from "vitest";

import { ScreenEditor } from "../../ScreenEditor";
import { MemoryEditorState } from "../../state/MemoryEditorState";

/**
 * saveFilterWithBindings：「保存一个过滤器」的完整内存语义。
 *
 * 前端保存弹窗与后端 agent 编辑 dataFilterArr/*.json 走的都是这一个方法，
 * 所以改名解绑这类容易各写一遍、写着写着就分叉的规则必须钉在这里。
 *
 * 不引入任何 Vue/UI 框架，直接用 MemoryEditorState 驱动 core。
 */
const makeFilter = (overrides: Partial<Filter> = {}): Filter =>
  ({
    name: "销售额",
    callBack: ["region"],
    callBackStatus: false,
    dataFormatter: "return data;",
    bindComponent: [{ label: "条形图", id: 11 }],
    checked: true,
    notSaved: true,
    tempPool: { callBack: [], dataFormatter: "" },
    show: true,
    ...overrides
  }) as Filter;

const makeEditor = () => {
  const editor = ScreenEditor.create(new MemoryEditorState());
  const bound = { id: 11, name: "条形图", component: { prop: "text" }, listenArgs: [], cbArgs: [] };
  editor.component.setLayers({ layers: [bound] } as unknown as LargeScreeInfo);
  return { editor, bound: bound as unknown as ComponentType };
};

describe("DataFilterManager.saveFilterWithBindings", () => {
  let editor: ReturnType<typeof makeEditor>["editor"];
  let bound: ComponentType;

  beforeEach(() => {
    ({ editor, bound } = makeEditor());
  });

  it("保存后过滤器进全局表，绑定组件挂上 listenArgs 并对齐回调字段", async () => {
    const { filter, boundComponents } = await editor.dataFilter.saveFilterWithBindings(makeFilter());

    expect(editor.dataFilter.getDataFilter()["销售额"]).toBeDefined();
    expect(filter.notSaved).toBe(false);
    expect(boundComponents.map((item) => item.id)).toEqual([11]);
    expect(bound.listenArgs).toEqual([{ filterName: "销售额", usageStatus: true, callbackFields: ["region"] }]);
  });

  // openFilter 为 false 时整条消费链路静默跳过（BaseFilter 不跑过滤、CallbackArguments
  // 不登记消费方），画布上不报错、图表空着。绑定即生效，这一脚不能漏。
  it("绑定组件的 openFilter 被打开，过滤器绑上即生效", async () => {
    expect(bound.openFilter).toBeFalsy();

    await editor.dataFilter.saveFilterWithBindings(makeFilter());

    expect(bound.openFilter).toBe(true);
  });

  it("重复保存是幂等的，不会给同一个组件挂第二条 listenArgs", async () => {
    await editor.dataFilter.saveFilterWithBindings(makeFilter());
    await editor.dataFilter.saveFilterWithBindings(makeFilter({ notSaved: false }));

    expect(bound.listenArgs).toHaveLength(1);
  });

  it("再存时过滤器少了一个回调字段，组件上的 callbackFields 跟着删", async () => {
    await editor.dataFilter.saveFilterWithBindings(makeFilter({ callBack: ["region", "year"] }));
    expect(bound.listenArgs[0].callbackFields).toEqual(["region", "year"]);

    await editor.dataFilter.saveFilterWithBindings(makeFilter({ callBack: ["region"], notSaved: false }));

    expect(bound.listenArgs[0].callbackFields).toEqual(["region"]);
  });

  it("改名时旧名被摘干净：全局表只剩新名，组件上不留指向旧名的 listenArgs", async () => {
    await editor.dataFilter.saveFilterWithBindings(makeFilter());

    await editor.dataFilter.saveFilterWithBindings(makeFilter({ name: "销售额（新）", notSaved: false }), "销售额");

    const dataFilter = editor.dataFilter.getDataFilter();
    expect(Object.keys(dataFilter)).toEqual(["销售额（新）"]);
    // 不解绑的话这里会剩两条：一条指向已经不存在的「销售额」，一条是新名
    expect(bound.listenArgs).toEqual([{ filterName: "销售额（新）", usageStatus: true, callbackFields: ["region"] }]);
  });

  it("originalName 与新名相同时不当改名处理，绑定关系原样保留", async () => {
    await editor.dataFilter.saveFilterWithBindings(makeFilter());

    await editor.dataFilter.saveFilterWithBindings(makeFilter({ notSaved: false }), "销售额");

    expect(Object.keys(editor.dataFilter.getDataFilter())).toEqual(["销售额"]);
    expect(bound.listenArgs).toHaveLength(1);
  });

  it("绑定的组件已不在树上时跳过，不影响过滤器本身入表", async () => {
    const { filter, boundComponents } = await editor.dataFilter.saveFilterWithBindings(
      makeFilter({ bindComponent: [{ label: "已删除", id: 999 }] })
    );

    expect(filter.name).toBe("销售额");
    expect(boundComponents).toEqual([]);
    expect(editor.dataFilter.getDataFilter()["销售额"]).toBeDefined();
  });
});
