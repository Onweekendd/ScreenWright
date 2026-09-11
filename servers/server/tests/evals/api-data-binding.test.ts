import type { ComponentType, Filter, ParsedLargeScreenInfo } from "@screenwright/types";
import { DataType } from "@screenwright/types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyProductionBinding } from "../../evals/harness/api-data-binding";
import fixture from "../../evals/fixtures/three-components.json";

const rows = [
  { name: "产线 A", output: 5280 },
  { name: "备用线", output: 0 }
];

const makeScreen = () => {
  const screen = structuredClone(fixture.screen) as unknown as ParsedLargeScreenInfo;
  const target = screen.layers[0] as ComponentType;
  const source = structuredClone(target);
  Object.assign(source, {
    id: 900001,
    component: { ...source.component, prop: "sw-dataContainer" },
    dataType: DataType.API,
    openFilter: true,
    dataRemark: [],
    cbArgs: [
      {
        id: "callback_rows",
        name: "回调",
        type: "object",
        method: "default",
        value: {
          origin: { displayName: "字段值", type: "input", value: "rows" },
          target: { displayName: "变量名", type: "input", value: "production" }
        }
      }
    ],
    listenArgs: [{ filterName: "source", usageStatus: true, callbackFields: [] }]
  });
  Object.assign(target, {
    openFilter: true,
    dataRemark: [],
    listenArgs: [{ filterName: "target", usageStatus: true, callbackFields: ["production"] }]
  });
  const filter = (name: string, component: ComponentType, callBack: string[], dataFormatter: string): Filter =>
    ({
      name,
      bindComponent: [{ label: component.name, id: component.id }],
      callBack,
      dataFormatter,
      callBackStatus: false,
      checked: true,
      notSaved: false,
      show: true,
      tempPool: { callBack: [], dataFormatter: "" }
    }) as Filter;
  screen.layers.push(source);
  screen.dataFilterArr = {
    source: filter("source", source, [], "(data) => [{ rows: data.data }]"),
    target: filter(
      "target",
      target,
      ["production"],
      "(data, args) => (args.production ?? []).map(row => ({ name: row.name, value: row.output, seriesName: '当日产量' }))"
    )
  };
  return { screen, source, target };
};

afterEach(() => vi.unstubAllGlobals());

describe("API 绑定离线验证", () => {
  it("完整响应经过容器和回调映射，保留零产量，且不发请求或改写起点", async () => {
    const { screen, source, target } = makeScreen();
    const before = structuredClone(screen);
    const fetch = vi.fn(() => {
      throw new Error("离线验证禁止网络请求");
    });
    vi.stubGlobal("fetch", fetch);

    const result = await verifyProductionBinding(screen, source.id, target.id, rows);

    expect(result.map(({ passed }) => passed)).toEqual([true, true]);
    expect(screen).toEqual(before);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("容器直接返回列表而未包装整份数组时失败", async () => {
    const { screen, source, target } = makeScreen();
    screen.dataFilterArr.source.dataFormatter = "(data) => data.data";

    const result = await verifyProductionBinding(screen, source.id, target.id, rows);

    expect(result.at(-1)?.passed).toBe(false);
  });

  it("图表读取错误的产量字段时失败", async () => {
    const { screen, source, target } = makeScreen();
    screen.dataFilterArr.target.dataFormatter =
      "(data, args) => (args.production ?? []).map(row => ({ name: row.name, value: row.target, seriesName: '产量' }))";

    const result = await verifyProductionBinding(screen, source.id, target.id, rows);

    expect(result.at(-1)?.passed).toBe(false);
  });

  it("未订阅回调时，不能仅凭过滤器文件存在而通过", async () => {
    const { screen, source, target } = makeScreen();
    target.listenArgs[0].callbackFields = [];

    const result = await verifyProductionBinding(screen, source.id, target.id, rows);

    expect(result.at(-1)).toMatchObject({ passed: false, detail: "没有回调触发目标图表重算" });
  });

  it("上游尚无数据时的异常单独报告", async () => {
    const { screen, source, target } = makeScreen();
    screen.dataFilterArr.target.dataFormatter =
      "(data, args) => args.production.map(row => ({ name: row.name, value: row.output, seriesName: '产量' }))";

    const result = await verifyProductionBinding(screen, source.id, target.id, rows);

    expect(result.map(({ passed }) => passed)).toEqual([false, true]);
  });

  it.each(["source", "target"] as const)("%s 关闭过滤器时失败", async (side) => {
    const setup = makeScreen();
    setup[side].openFilter = false;

    const result = await verifyProductionBinding(setup.screen, setup.source.id, setup.target.id, rows);

    expect(result.at(-1)?.passed).toBe(false);
  });
});
