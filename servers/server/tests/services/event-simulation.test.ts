/**
 * `simulateEvent` 服务：事件干跑的三段结论 + 全局状态恢复。
 *
 * 前身是一次性进程的脚本，全局单例写完就丢无所谓；现在跑在长驻进程里，**跑完必须还原**
 * `setActionExecutor` / `setCallbackArgsSource` / `setFilterResultSink`——否则下一个走 core 的
 * 调用（比如 `applyComponentEdit` 重算派生值）会拿到这里留下的录制版执行器。
 * 这条是本文件最要紧的断言，三段结论反而是顺带的。
 */
import { readFileSync, rmSync } from "fs";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const OUTPUT_DIR = path.resolve(__dirname, "output-event-simulation");
process.env.MASTRA_WORKSPACE_PATH = OUTPUT_DIR;

import {
  getActionExecutor,
  getFilterResultSink,
  getRuntimeCallbackArgs,
  setActionExecutor,
  setCallbackArgsSource
} from "@screenwright/core";
import { ActionTypeEnum, type ComponentType, EventTypeEnum, type ParsedLargeScreenInfo } from "@screenwright/types";
import { EventSchema } from "@screenwright/types/schemas";
import { buildActionFromTemplate, templateEvents } from "@screenwright/types/templates";

import { syncScreenData } from "@/mastra/services/bi-data-sync";
import { simulateEvent } from "@/mastra/services/event-simulation";
import { buildCallbackEntry } from "@/mastra/tools/configure-callback-args";

const SCREEN_ID = 9901;
const SCREEN_KEY = `${SCREEN_ID}_1`;
/** 源组件：fixture 里的「选项卡」#4182；靶组件：「条形图」#4183 */
const SOURCE_ID = 4182;
const TARGET_ID = 4183;

/**
 * 用 eval 的 event.json 当底——它是一块完整合法的屏（能过 ScreenReader 的 Zod 校验），
 * 只是 events / cbArgs / listenArgs 全空。手写一块最小屏反而过不了校验（info.json 缺一堆
 * 元字段），而校验规则是会演进的，跟着 fixture 走才不会无声腐化。
 */
const loadFixtureScreen = (): ParsedLargeScreenInfo => {
  const raw = JSON.parse(
    readFileSync(path.resolve(__dirname, "..", "..", "evals", "fixtures", "event.json"), "utf-8")
  ) as { screen: ParsedLargeScreenInfo };
  return raw.screen;
};

const findLayer = (screen: ParsedLargeScreenInfo, id: number): ComponentType => {
  const hit = screen.layers.find((c) => c.id === id);
  if (!hit) {
    throw new Error(`fixture 里没有组件 ${id}`);
  }
  return hit;
};

beforeAll(() => {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  const screen = loadFixtureScreen();

  // 选项卡：点击时隐藏条形图，同时把 value 抛成回调参数 tabCb。形状照 core 的 eventDispatch 测试
  const source = findLayer(screen, SOURCE_ID) as unknown as Record<string, unknown>;
  // 样板字段（id/name/type/method/displayName）由生产代码生成，手写一份迟早跟 schema 分叉
  source.cbArgs = [buildCallbackEntry("value", "tabCb")];
  // 事件与动作同样走生产模板生成，再过一遍 EventSchema——跟 createEventTemplate 同一条路
  const hideAction = buildActionFromTemplate({ componentId: [`${TARGET_ID}`], actionType: ActionTypeEnum.Hide });
  if ("error" in hideAction) {
    throw new Error(hideAction.error);
  }
  const {
    actions: _a,
    conditions: _c,
    ...eventRest
  } = templateEvents({ trigger: EventTypeEnum.Click, name: "点击切换" });
  source.events = [EventSchema.parse({ ...eventRest, conditions: [], actions: [hideAction] })];

  // 条形图：消费 tabCb 过滤自己的静态数据
  const target = findLayer(screen, TARGET_ID) as unknown as Record<string, unknown>;
  target.data = [
    { seriesName: "系列一", name: "A", value: 1 },
    { seriesName: "系列一", name: "B", value: 2 }
  ];
  target.openFilter = true;
  target.listenArgs = [{ filterName: "byTab", usageStatus: true, callbackFields: ["tabCb"] }];

  syncScreenData({
    id: SCREEN_KEY,
    cacheTime: Date.now(),
    parsedLargeScreenInfo: {
      ...screen,
      id: SCREEN_ID,
      versionCode: "1",
      dataFilterArr: {
        // 形状对齐 create-data-filter.ts 的 buildFilter
        byTab: {
          name: "byTab",
          callBack: ["tabCb"],
          callBackStatus: false,
          bindComponent: [{ id: TARGET_ID, label: "条形图" }],
          dataFormatter: "(data, args) => (args.tabCb ? data.filter((i) => i.value === args.tabCb) : data)",
          checked: true,
          notSaved: false,
          tempPool: { callBack: [], dataFormatter: "" },
          show: true
        }
      }
    } as unknown as ParsedLargeScreenInfo
  });
});

afterAll(() => {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
});

describe("simulateEvent", () => {
  it("三段结论：事件匹配、动作指向靶组件、回调驱动出真实过滤结果", async () => {
    const result = await simulateEvent({
      screenKey: SCREEN_KEY,
      componentId: SOURCE_ID,
      triggerType: EventTypeEnum.Click,
      throwValue: { label: "Tab A", value: 1 }
    });

    expect(result.source).toEqual({ id: SOURCE_ID, name: "选项卡" });
    expect(result.eventCount).toBe(1);
    expect(result.events).toEqual([{ name: "点击切换", conditionSatisfied: true, plannedActions: 1 }]);

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].actionType).toBe(ActionTypeEnum.Hide);
    expect(result.actions[0].targets).toEqual([{ id: TARGET_ID, name: "条形图" }]);

    // 过滤结果是真算出来的：tabCb=1 → 只剩 value 为 1 的那一行
    expect(result.callbacks).toHaveLength(1);
    expect(result.callbacks[0].callbackName).toBe("tabCb");
    expect(result.callbacks[0].consumer).toEqual({ id: TARGET_ID, name: "条形图" });
    expect(result.callbacks[0].rowCount).toBe(1);
    expect(result.callbacks[0].rows).toEqual([{ seriesName: "系列一", name: "A", value: 1 }]);

    // summary 是人话版，agent 直接读它
    expect(result.summary).toContain("✅ 条件满足");
    expect(result.summary).toContain(`${ActionTypeEnum.Hide} → 条形图 (${TARGET_ID})`);
    expect(result.summary).toContain(`tabCb → 条形图 (${TARGET_ID}): 过滤后 1 条`);
  });

  it("trigger 没配对时事件段为空，summary 直接点出原因", async () => {
    const result = await simulateEvent({
      screenKey: SCREEN_KEY,
      componentId: SOURCE_ID,
      triggerType: EventTypeEnum.DataChange,
      throwValue: { label: "Tab A", value: 1 }
    });

    expect(result.events).toEqual([]);
    expect(result.actions).toEqual([]);
    expect(result.summary).toContain('没有 trigger 为 "dataChange" 的事件');
  });

  it("组件不存在时报错，不吞", async () => {
    await expect(
      simulateEvent({ screenKey: SCREEN_KEY, componentId: 99999, triggerType: EventTypeEnum.Click, throwValue: {} })
    ).rejects.toThrow(/组件 99999 不存在/u);
  });

  // 本文件最要紧的一条
  it("跑完把 core 的三个全局单例还原成跑之前的样子", async () => {
    const executorBefore = () => undefined;
    const argsBefore = { marker: "before" };
    setActionExecutor(executorBefore);
    setCallbackArgsSource({ getCallbackArgs: () => argsBefore });
    const sinkBefore = getFilterResultSink();

    await simulateEvent({
      screenKey: SCREEN_KEY,
      componentId: SOURCE_ID,
      triggerType: EventTypeEnum.Click,
      throwValue: { label: "Tab A", value: 1 }
    });

    expect(getActionExecutor()).toBe(executorBefore);
    expect(getRuntimeCallbackArgs()).toEqual(argsBefore);
    expect(getFilterResultSink()).toBe(sinkBefore);
  });

  it("抛错的路径也还原全局状态", async () => {
    const executorBefore = () => undefined;
    setActionExecutor(executorBefore);

    await simulateEvent({
      screenKey: SCREEN_KEY,
      componentId: 99999,
      triggerType: EventTypeEnum.Click,
      throwValue: {}
    }).catch(() => undefined);

    expect(getActionExecutor()).toBe(executorBefore);
  });
});
