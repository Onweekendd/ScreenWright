import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  initActionStrategyExecutor,
  initFilterDataApi,
  initRouter,
  initStatusAnimationTrigger
} from "@screenwright/composables";
import {
  ActionTypeEnum,
  ComponentScopeEnum,
  type ComponentType,
  ConditionLogicTypeEnum,
  type Event as ScreenwrightEvent,
  type LargeScreeInfo
} from "@screenwright/types";
import dayjs from "dayjs";
import { isNumber, isString } from "lodash-es";

import { getLargeScreenInfo } from "@/api/build";
import { queryAPIData } from "@/api/dataSource";
import type { mediaEnum } from "@/components/componentEntry/type";
import { useRegisterFilter } from "@/components/componentEntry/useRegisterFilter";
import { useIframe } from "@/components/ScreenwrightMedia/components/ftiframe/useIframe";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useEventHandling } from "@/hooks/eventHandling/useEventHandling";
import { templateEvents } from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/options";
import { EventTypeEnum } from "@/views/build/components/buildConfig/constants/event";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useCacheTime } from "@/views/build/useCacheTime";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useDataFilter } from "../../views/build/useDataFilter";
import { useLargeScreenInfo } from "../../views/build/useLargeScreenInfo";
// 面板外组件向面板内组件传递回调参数
import mockDetail from "./iframeRefenence.mock.json";

// 模拟Vue的组件生命周期
const mockOnBeforeMount = vi.fn();
const mockOnMounted = vi.fn();
const mockOnUnmounted = vi.fn();
const mockInject = vi.fn();

vi.stubGlobal("CSS", {
  escape: (value: string) => value
});

vi.mock("vue", async () => ({
  ...((await vi.importActual("vue")) as any),
  onBeforeMount: (fn: () => void) => mockOnBeforeMount(fn),
  onMounted: (fn: () => void) => mockOnMounted(fn),
  onUnmounted: (fn: () => void) => mockOnUnmounted(fn),
  inject: (key: any, defaultValue?: any) => mockInject(key, defaultValue)
}));

// 固定化 uuid，避免用例受随机值影响；同时提供 extractComponentId（buildEventMapping 会用到）
vi.mock("@/utils/utils", () => ({
  uuid: vi.fn(() => "mock-uuid-1234"),
  extractComponentId: vi.fn((component: string | number): number => {
    if (isNumber(component)) {
      return component;
    }
    if (isString(component)) {
      if (!component.includes("$component")) {
        return Number(component);
      }
      const match = component.match(/\$component\((\d+)\)/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
    return Number(component);
  })
}));

// mock 数据源请求：数据容器 dataType=2(API)、crossOrigin=true，会经此方法发起请求
vi.mock("@/api/dataSource", () => ({
  queryAPIData: vi.fn()
}));

// apiFilter（@screenwright/composables）通过端口调用 queryAPIData；本文件用 mock 后的引用注入。
initFilterDataApi({ executeSql: vi.fn(), queryAPIData, getCsvData: vi.fn() });

// useEventHandling（@screenwright/composables）的 handleEvents 无条件读取 resolveEditMode()，不注入会直接抛错；
// 本文件只测数据流转（回调参数/过滤器），不需要真实的动作策略/UE4/状态动画实现，注入空实现即可。
// 与 main.ts 的实现不同：那里注入的是 ActionStrategyFactory/useStatusAnimation 等真实实现，
// 但那些模块会间接触发 window.webconfig 依赖，放在这个纯数据流测试里没必要引入。
initActionStrategyExecutor(() => {});
initStatusAnimationTrigger(async () => {});
// resolveEditMode（@screenwright/composables）现在由注入的 router + useEditStore 派生，不再通过闭包注入；
// 这里注入最小 router 桩，使其派生结果与本测试原先固定注入的全 false 一致。
initRouter({
  currentRoute: {
    value: { name: undefined, path: "/", query: {} }
  }
} as any);

// mock 获取大屏详情接口，每次返回 mockDetail 的深拷贝
vi.mock("@/api/build", () => ({
  getLargeScreenInfo: vi
    .fn()
    .mockImplementation(() => Promise.resolve({ result: JSON.parse(JSON.stringify(mockDetail)) }))
}));

vi.mock("@/api/library", () => ({
  updateLargeScreen: vi.fn(),

  // 更新组件数据接口 mock每次成功
  updateLayersAgg: vi.fn().mockResolvedValue({ success: true }),

  delLayersAgg: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock("@/api/visual", () => ({
  getScreenMeta: vi.fn().mockResolvedValue({
    result: {
      updatedTime: "2025-08-26 10:00:00"
    }
  })
}));

vi.mock("@/utils/service", () => ({
  createRequest: vi.fn()
}));

vi.mock("@/utils/cacheService", () => ({
  createRequest: vi.fn()
}));

vi.mock("@/utils/config", () => ({
  BaseName: {
    Online: "online",
    System: "system"
  },
  setMinioUrl: vi.fn()
}));

// 在这里 mock 一个可以检查调用次数的函数
// 使用 Vitest 的 vi.fn() 实现，并导出以便测试中使用
export const mockFnWithCallCount = vi.fn();
export const mockFnWithCallCount2 = vi.fn();

const makeIframeWithNestedPanels = (): LargeScreeInfo => {
  const nestedPanelChild = { id: 301, component: { prop: "text" }, name: "nestedPanelChild" };
  const nestedPanelSibling = { id: 302, component: { prop: "text" }, name: "nestedPanelSibling" };
  const nestedPanel = {
    id: 300,
    component: { prop: "sw-panel" },
    name: "nestedPanel",
    panelData: [{ id: "nested-status", config: [nestedPanelChild, nestedPanelSibling] }]
  };
  const terminalChild = { id: 201, component: { prop: "text" }, name: "terminalChild" };
  const terminalPanel = {
    id: 200,
    component: { prop: "terminal-control" },
    name: "terminalPanel",
    panelData: [{ id: "terminal-status", config: [terminalChild, nestedPanel] }]
  };
  const iframe = {
    id: 100,
    component: { prop: "swiframe" },
    name: "iframe",
    option: {
      quoteInfo: {
        component: [terminalPanel]
      }
    }
  };

  return { layers: [iframe] } as unknown as LargeScreeInfo;
};

const makeScopedEvent = (targetComponentId: number, componentScope: ComponentScopeEnum): ScreenwrightEvent => ({
  id: "scoped-event",
  name: "scoped event",
  trigger: EventTypeEnum.Click,
  conditionType: ConditionLogicTypeEnum.All,
  conditions: [],
  btnObjs: [],
  actions: [
    {
      id: "scoped-action",
      name: "show target",
      action: ActionTypeEnum.Show,
      component: [`$component(${targetComponentId})`],
      componentScope,
      customActionType: "component"
    }
  ]
});

describe("useDataFilter - 面板外组件向面板内组件传递回调参数", () => {
  beforeEach(async () => {
    // 清理 queryAPIData spy 计数（数据容器 API 请求用例依赖）
    (queryAPIData as any).mockClear();

    const { resetNavInfo, setNavInfo } = useLargeScreenInfo();
    const { setGroupData, groupData, resetGroupData } = useGlobalComponentData();
    const { initCallbackArguments, onClear } = useCallbackArguments();
    const { setDetail2Config, resetEditStore } = useEditStore();
    const { resetDataFilter, cloneDataFilterOnInit } = useDataFilter();
    const { lastCacheTime } = useCacheTime();
    onClear();
    resetEditStore();
    resetNavInfo();
    resetGroupData();
    resetDataFilter();

    // 通过 mock 接口返回的数据进行初始化
    const res = await getLargeScreenInfo(23595);
    setNavInfo(res.result);
    setGroupData(res.result);
    setDetail2Config(res.result);
    initCallbackArguments(groupData.value);
    cloneDataFilterOnInit();
    lastCacheTime.value = dayjs("2025-08-26 10:00:00").valueOf();
  });

  afterEach(async () => {
    // 重置 mockFnWithCallCount
    mockFnWithCallCount.mockReset();
    initActionStrategyExecutor(() => {});
    document.body.innerHTML = "";

    // 等待所有pending的微任务完成，确保Vue组件完全卸载
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it("iframe 组件初始化成功", () => {
    const { allComponentMap, iframeComponentMap } = useGlobalComponentData();

    expect(allComponentMap.value.size, "全局只有一个iframe组件 内部组件不进入大屏的Map").toBe(1);
    // 引用大屏内部：交互组件(3233888) + 文本框(3231695) + 数据容器(3231694)
    expect(iframeComponentMap.value.size, "iframe组件进入自身的Map").toBe(3);
    expect(iframeComponentMap.value.has("3233888"), "交互组件进入 iframe Map").toBe(true);
    expect(iframeComponentMap.value.has("3231695"), "文本框进入 iframe Map").toBe(true);
    expect(iframeComponentMap.value.has("3231694"), "数据容器进入 iframe Map").toBe(true);
  });

  it.each([
    ["iframe 内终端面板状态", ComponentScopeEnum.Current, 201, ["201", "300", "301", "302"]],
    ["终端面板内嵌动态面板状态", ComponentScopeEnum.Current, 301, ["301", "302"]],
    ["iframe 内组件的全局作用域", ComponentScopeEnum.All, 201, ["100", "200", "201", "300", "301", "302"]]
  ])(
    "%s触发动作时 globalComponentMap 包含正确的组件列表",
    async (_scenario, componentScope, sourceComponentId, expectedIds) => {
      const { setGroupData } = useGlobalComponentData();
      setGroupData(makeIframeWithNestedPanels());

      let scopedComponentMap: Map<string, ComponentType> | undefined;
      let rootDoms: NodeListOf<HTMLElement> | undefined;
      initActionStrategyExecutor((_actionType, { globalComponentMap, componentRootDoms }) => {
        scopedComponentMap = globalComponentMap;
        rootDoms = componentRootDoms;
      });

      const targetElement = document.createElement("div");
      targetElement.id = `${sourceComponentId}`;
      document.body.appendChild(targetElement);

      const { handleEvents } = useEventHandling();
      await handleEvents({
        id: sourceComponentId,
        triggerType: EventTypeEnum.Click,
        events: [makeScopedEvent(sourceComponentId, componentScope)],
        throwValue: {},
        throwCallback: false,
        isExecuteOnlyInViewMod: false
      });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect([...scopedComponentMap!.keys()]).toEqual(expectedIds);
      // 动作策略普遍直接 componentRootDoms.forEach，缺了它整类组件动作会在运行时炸
      expect(Array.from(rootDoms!).map((el) => el.id)).toEqual([`${sourceComponentId}`]);
    }
  );

  it("iframe 引用 终端组件 回调关系建立成功", async () => {
    const { groupData } = useGlobalComponentData();
    const iframeComponent = groupData.value[0] as ComponentType<mediaEnum.SwIframe>;

    const { initIframe } = useIframe({ element: iframeComponent });

    await initIframe();

    const { dataFilter } = useDataFilter();

    // dataFilterArr 里有 3 个过滤器（新建过滤器 / 新建过滤器2 / 数据容器回调过滤器），均带前缀注册
    expect(Object.keys(dataFilter.value).length, "iframe 应用组件的三个数据过滤器被注册").toBe(3);

    const filter1 = dataFilter.value["3229456_26054_新建过滤器"];
    const filter2 = dataFilter.value["3229456_26054_新建过滤器2"];

    expect(filter1.name).toBe("3229456_26054_新建过滤器");
    expect(filter2.name).toBe("3229456_26054_新建过滤器2");

    const { callbackArgumentsManager } = useCallbackArguments();

    const manager = callbackArgumentsManager.value;

    expect(manager, "回调参数管理器存在").toBeDefined();

    /**
     * 数据过滤器抛出了一个 name/cbName
     * filter2进行了监听 查看关系是否建立
     */
    const cbNameRelation = manager["cbName"];
    expect(cbNameRelation, "cbName 回调关系已建立").toBeDefined();
    expect(
      cbNameRelation!.source.some((s) => s.id === 3231694),
      "数据容器(3231694) 作为 source 抛出 cbName"
    ).toBe(true);
    expect(
      cbNameRelation!.target.some((t) => t.id === 3231695 && t.filterName === "3229456_26054_新建过滤器2"),
      "文本框(3231695) 通过新建过滤器2 监听 cbName"
    ).toBe(true);

    /**
     * 交互组件抛出 cbValue，数据容器通过"新建过滤器"监听 cbValue
     */
    const cbValueRelation = manager["cbValue"];
    expect(cbValueRelation, "cbValue 回调关系已建立").toBeDefined();
    expect(
      cbValueRelation!.source.some((s) => s.id === 3233888),
      "交互组件(3233888) 作为 source 抛出 cbValue"
    ).toBe(true);
    expect(
      cbValueRelation!.target.some((t) => t.id === 3231694 && t.filterName === "3229456_26054_新建过滤器"),
      "数据容器(3231694) 通过新建过滤器 监听 cbValue"
    ).toBe(true);
  });

  it("数据容器触发回调 → 文本框接收 cbName 并执行过滤器", async () => {
    const { groupData, iframeComponentMap } = useGlobalComponentData();
    const iframeComponent = groupData.value[0] as ComponentType<mediaEnum.SwIframe>;

    const { initIframe } = useIframe({ element: iframeComponent });
    await initIframe();

    const dataContainer = iframeComponentMap.value.get("3231694")!;
    const textBox = iframeComponentMap.value.get("3231695")!;

    expect(dataContainer, "数据容器存在").toBeDefined();
    expect(textBox, "文本框存在").toBeDefined();

    // 前置断言：initIframe 已注册带前缀的过滤器，保证后续回调链可执行
    const { dataFilter } = useDataFilter();
    expect(dataFilter.value["3229456_26054_新建过滤器2"], "iframe 过滤器已带前缀注册").toBeDefined();

    // 为文本框注册过滤器监听
    let filterResult: unknown;
    const { registerFilter, unRegisterFilter } = useRegisterFilter(textBox, (data) => {
      filterResult = data;
    });
    registerFilter();

    const { callbackEventManager, callbackArgumentsInstance } = useCallbackArguments();

    expect(
      callbackEventManager.callbackFieldTriggerMap.has("onCallbackFieldTrigger-cbName-3231695"),
      "文本框 cbName 监听器已注册"
    ).toBe(true);

    // 走真实事件流程：handleEvents → handleCallback → callbackArgs.cbName → 文本框过滤器
    const { handleEvents } = useEventHandling();
    await handleEvents({
      id: dataContainer.id,
      triggerType: EventTypeEnum.DataChange,
      events: dataContainer.events.length > 0 ? dataContainer.events : [templateEvents({})],
      // 数据容器 cbArgs origin=text → target=cbName，throwValue 必须带 text 字段才会写入 cbName
      throwValue: { text: "测试文本" },
      throwCallback: true,
      // 测试环境非预览/查看页，需关闭"仅视图模式执行"限制
      isExecuteOnlyInViewMod: false,
      // 关闭防抖，await 即可拿到过滤器结果
      callbackDebounce: false
    });

    expect(callbackArgumentsInstance.value.getCallbackArgs()["cbName"], "cbName 已被写入 callbackArgs").toBe(
      "测试文本"
    );

    // 文本框 新建过滤器2 的 dataFormatter：callbackArgs.cbName 存在时返回 [{ value: cbName }]
    expect(filterResult, "文本框过滤器已被触发").toBeDefined();
    expect(filterResult, "文本框过滤器返回含 cbName 的数据").toEqual([{ value: "测试文本" }]);

    unRegisterFilter();
  });

  it("source 组件不存在时回调不触发", async () => {
    const { groupData, iframeComponentMap } = useGlobalComponentData();
    const iframeComponent = groupData.value[0] as ComponentType<mediaEnum.SwIframe>;
    const { initIframe } = useIframe({ element: iframeComponent });
    await initIframe();

    const dataContainer = iframeComponentMap.value.get("3231694")!;
    const { callbackArgumentsInstance } = useCallbackArguments();

    // 传入一个不存在的组件 id，但用数据容器的事件配置
    // handleEvents 按 id 查 sourceComponent 找不到，应跳过 handleCallback
    const { handleEvents } = useEventHandling();
    await handleEvents({
      id: 999999,
      triggerType: EventTypeEnum.DataChange,
      events: dataContainer.events,
      throwValue: { name: "不应生效" },
      throwCallback: true,
      isExecuteOnlyInViewMod: false,
      callbackDebounce: false
    });

    expect(
      callbackArgumentsInstance.value.getCallbackArgs()["cbName"],
      "source 不存在时 callbackArgs 不被写入"
    ).toBeUndefined();
  });

  it("交互组件点击 → 数据容器接收 cbValue 并发起 API 请求", async () => {
    const { groupData, iframeComponentMap } = useGlobalComponentData();
    const iframeComponent = groupData.value[0] as ComponentType<mediaEnum.SwIframe>;
    const { initIframe } = useIframe({ element: iframeComponent });
    await initIframe();

    const mutualComponent = iframeComponentMap.value.get("3233888")!;
    const dataContainer = iframeComponentMap.value.get("3231694")!;

    expect(mutualComponent, "交互组件存在").toBeDefined();
    expect(dataContainer, "数据容器存在").toBeDefined();
    // 前置断言：交互组件抛出 cbValue，数据容器通过新建过滤器监听 cbValue
    const { dataFilter } = useDataFilter();
    expect(dataFilter.value["3229456_26054_新建过滤器"], "数据容器过滤器已带前缀注册").toBeDefined();

    // 为数据容器注册过滤器监听，使 cbValue 触发时能走 calculateComponentData → ApiFilter.getData
    let filterResult: unknown;
    const { registerFilter, unRegisterFilter } = useRegisterFilter(dataContainer, (data) => {
      filterResult = data;
    });
    registerFilter();

    const { callbackEventManager } = useCallbackArguments();
    expect(
      callbackEventManager.callbackFieldTriggerMap.has("onCallbackFieldTrigger-cbValue-3231694"),
      "数据容器 cbValue 监听器已注册"
    ).toBe(true);

    // mock API 返回
    (queryAPIData as any).mockResolvedValue({
      status: 200,
      data: [{ text: "订单号: 1" }]
    });

    // 走真实事件流程：交互组件点击 → handleEvents → handleCallback → 数据容器发请求
    const { handleEvents } = useEventHandling();
    await handleEvents({
      id: mutualComponent.id,
      triggerType: EventTypeEnum.Click,
      events: mutualComponent.events,
      throwValue: mutualComponent.data[0],
      throwCallback: true,
      isExecuteOnlyInViewMod: false,
      callbackDebounce: false
    });

    const { callbackArgumentsInstance } = useCallbackArguments();
    expect(callbackArgumentsInstance.value.getCallbackArgs()["cbValue"], "cbValue 已被写入 callbackArgs").toBe(1);

    // 数据容器 dataType=2(API)、crossOrigin=true，应通过 queryAPIData 发起一次请求
    expect(queryAPIData, "数据容器应通过 queryAPIData 发起请求").toHaveBeenCalledTimes(1);
    const callArgs = (queryAPIData as any).mock.calls[0][0];
    expect(callArgs.method, "请求方法应为 post").toBe("post");
    expect(callArgs.url, "URL 应拼接 baseUrl + path").toContain("http://localhost:3000/test/v1/users");

    expect(filterResult, "数据容器过滤器应返回 API 数据").toBeDefined();

    unRegisterFilter();
  });

  it("initIframe，动态面板状态离开后再次进入同一 iframe，过滤器前缀只添加一次", async () => {
    const { groupData, iframeComponentMap } = useGlobalComponentData();
    const iframeComponent = groupData.value[0] as ComponentType<mediaEnum.SwIframe>;
    const { initIframe } = useIframe({ element: iframeComponent });

    await initIframe();
    const textBox = iframeComponentMap.value.get("3231695")!;
    const firstFilterName = textBox.listenArgs[0].filterName;

    await initIframe();

    expect(textBox.listenArgs[0].filterName).toBe(firstFilterName);
  });

  it("initIframe，动态面板状态离开后再次进入同一 iframe，回调过滤器仍正常执行", async () => {
    const { groupData, iframeComponentMap } = useGlobalComponentData();
    const iframeComponent = groupData.value[0] as ComponentType<mediaEnum.SwIframe>;
    const { initIframe } = useIframe({ element: iframeComponent });
    await initIframe();
    await initIframe();

    const dataContainer = iframeComponentMap.value.get("3231694")!;
    const textBox = iframeComponentMap.value.get("3231695")!;
    let filterResult: unknown;
    const { registerFilter, unRegisterFilter } = useRegisterFilter(textBox, (data) => {
      filterResult = data;
    });
    registerFilter();

    const { handleEvents } = useEventHandling();
    await handleEvents({
      id: dataContainer.id,
      triggerType: EventTypeEnum.DataChange,
      events: dataContainer.events.length > 0 ? dataContainer.events : [templateEvents({})],
      throwValue: { text: "测试文本" },
      throwCallback: true,
      isExecuteOnlyInViewMod: false,
      callbackDebounce: false
    });

    expect(filterResult).toEqual([{ value: "测试文本" }]);
    unRegisterFilter();
  });

  it("addCallbackArgumentsFromComponentList，同一 iframe 重复初始化，回调关系保持唯一", async () => {
    const { groupData } = useGlobalComponentData();
    const iframeComponent = groupData.value[0] as ComponentType<mediaEnum.SwIframe>;
    const { initIframe } = useIframe({ element: iframeComponent });
    await initIframe();
    await initIframe();

    const { callbackArgumentsManager } = useCallbackArguments();
    const cbNameTargets = callbackArgumentsManager.value.cbName!.target.filter((target) => target.id === 3231695);

    expect(cbNameTargets).toHaveLength(1);
  });

  it("unRegisterFilter，iframe 内组件卸载，移除该组件的全部过滤器事件监听", async () => {
    const { groupData, iframeComponentMap } = useGlobalComponentData();
    const iframeComponent = groupData.value[0] as ComponentType<mediaEnum.SwIframe>;
    const { initIframe } = useIframe({ element: iframeComponent });
    await initIframe();

    const textBox = iframeComponentMap.value.get("3231695")!;
    const { registerFilter, unRegisterFilter } = useRegisterFilter(textBox);
    const { callbackEventManager } = useCallbackArguments();
    registerFilter();

    unRegisterFilter();

    const eventKeys = callbackEventManager.getAllEventKeys();
    expect(eventKeys).not.toContain("onAddCallbackField-3231695");
    expect(eventKeys).not.toContain("onRemoveCallbackField-3231695");
    expect(eventKeys).not.toContain("onCallbackFieldTrigger-cbName-3231695");
    expect(eventKeys).not.toContain("onFilterTrigger-3231695");
  });
});
