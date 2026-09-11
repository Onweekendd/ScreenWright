import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initFilterDataApi } from "@screenwright/composables";
import { isNumber, isString } from "lodash-es";

import { getLargeScreenInfo } from "@/api/build";
import { queryAPIData } from "@/api/dataSource";
import { useRegisterFilter } from "@/components/componentEntry/useRegisterFilter";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { apiFilter as ApiFilter } from "@/views/build/components/buildRender/core/BaseComponent/filterData/apiFilter";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import type { ComponentType } from "@/views/build/components/buildRender/type";
import { useCacheData } from "@/views/build/useCacheData";
import { useDataFilter } from "@/views/build/useDataFilter";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import mockDetail from "./componentData5.mock.json";

// ============================================================
// MOCK 配置
// ============================================================

const mockOnBeforeMount = vi.fn();
const mockOnMounted = vi.fn();
const mockOnUnmounted = vi.fn();
const mockInject = vi.fn();

vi.mock("vue", async () => ({
  ...((await vi.importActual("vue")) as any),
  onBeforeMount: (fn: Function) => mockOnBeforeMount(fn),
  onMounted: (fn: Function) => mockOnMounted(fn),
  onUnmounted: (fn: Function) => mockOnUnmounted(fn),
  inject: (key: any, defaultValue?: any) => mockInject(key, defaultValue)
}));

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

vi.mock("@/api/build", () => ({
  getLargeScreenInfo: vi
    .fn()
    .mockImplementation(() => Promise.resolve({ result: JSON.parse(JSON.stringify(mockDetail)) }))
}));

vi.mock("@/api/library", () => ({
  updateLargeScreen: vi.fn(),
  updateLayersAgg: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock("@/utils/service", () => ({
  createRequest: vi.fn()
}));

vi.mock("@/utils/cacheService", () => ({
  createRequest: vi.fn()
}));

vi.mock("element-plus", () => ({
  ElMessage: { error: vi.fn() }
}));

vi.mock("@/api/dataSource", () => ({
  queryAPIData: vi.fn()
}));

// apiFilter（@screenwright/composables）通过端口调用 queryAPIData；tests/setup.ts 里全局的 initFilterDataApi
// 在本文件的 vi.mock 生效前就已绑定了真实实现，这里用本文件 mock 后的引用重新注入一次。
initFilterDataApi({ executeSql: vi.fn(), queryAPIData, getCsvData: vi.fn() });

// ============================================================
// 测试套件
// ============================================================

describe("ApiFilter - API 数据过滤器模板变量替换与请求测试", () => {
  // ref() 会把类实例的类型展开（私有字段丢失），故这里取 ref 的 value 类型而不是类本身
  let callbackInstance: ReturnType<typeof useCallbackArguments>["callbackArgumentsInstance"]["value"];
  let groupData: any;

  beforeEach(async () => {
    // 清理 queryAPIData spy 计数
    (queryAPIData as any).mockClear();

    // 重置所有全局状态
    const { resetNavInfo, setNavInfo } = useLargeScreenInfo();
    const { setGroupData, groupData: gd, resetGroupData } = useGlobalComponentData();
    const { initCallbackArguments, onClear } = useCallbackArguments();
    const { setDetail2Config, resetEditStore } = useEditStore();
    const { resetDataFilter, cloneDataFilterOnInit } = useDataFilter();
    onClear();
    resetEditStore();
    resetNavInfo();
    resetGroupData();
    resetDataFilter();

    // 通过 mock 接口返回的数据进行初始化
    const res = await getLargeScreenInfo(30495);
    setNavInfo(res.result);
    setGroupData(res.result);
    setDetail2Config(res.result);
    groupData = gd;
    initCallbackArguments(groupData.value);
    cloneDataFilterOnInit();

    // CallbackArguments 已不是单例：实例由编辑器（useScreenEditor -> EventManager）持有，
    // 过滤器运行时读的也是同一个（useScreenEditor 启动时注册为 CallbackArgsSource）
    callbackInstance = useCallbackArguments().callbackArgumentsInstance.value;
  });

  afterEach(() => {
    const { buildWorkerCacheInput } = useCacheData();
    structuredClone(buildWorkerCacheInput(Date.now()));
  });

  // ============================================================
  // 辅助方法
  // ============================================================

  /** 获取 API 柱状图组件（组件 B） */
  function getApiComponent(): ComponentType {
    return groupData.value.find((c: any) => c.id === 3224201);
  }

  /** 获取交互组件（组件 A） */
  function getTriggerComponent(): ComponentType {
    return groupData.value.find((c: any) => c.id === 3224200);
  }

  /** 模拟交互组件点击触发回调 */
  async function simulateTrigger(dataIndex: number) {
    const { handleCallback } = useCallbackArguments();
    const trigger = getTriggerComponent();
    await handleCallback({
      sourceComponent: trigger,
      throwValue: trigger.data[dataIndex],
      debounce: false
    });
  }

  // ============================================================
  // 回调关系初始化
  // ============================================================

  describe("回调关系初始化", () => {
    it("selectedId 回调关系应正确注册 源组件为交互组件 目标组件为柱状图", () => {
      const { callbackArgumentsManager } = useCallbackArguments();
      const manager = callbackArgumentsManager.value;

      expect(manager["selectedId"], "selectedId 关系应存在").toBeTruthy();
      expect(manager["selectedId"]!.source.length, "selectedId 应有1个源组件").toBe(1);
      expect(manager["selectedId"]!.source[0].id, "源组件应为交互组件").toBe(3224200);
      expect(manager["selectedId"]!.target.length, "selectedId 应有1个目标组件").toBe(1);
      expect(manager["selectedId"]!.target[0].id, "目标组件应为柱状图").toBe(3224201);
    });

    it("keyword 回调关系应正确注册 源组件为交互组件 目标组件为柱状图", () => {
      const { callbackArgumentsManager } = useCallbackArguments();
      const manager = callbackArgumentsManager.value;

      expect(manager["keyword"], "keyword 关系应存在").toBeTruthy();
      expect(manager["keyword"]!.source.length, "keyword 应有1个源组件").toBe(1);
      expect(manager["keyword"]!.source[0].id, "源组件应为交互组件").toBe(3224200);
      expect(manager["keyword"]!.target.length, "keyword 应有1个目标组件").toBe(1);
      expect(manager["keyword"]!.target[0].id, "目标组件应为柱状图").toBe(3224201);
    });

    it("初始化后 callbackArgs 应为空对象 无任何回调值", () => {
      const callbackArgs = callbackInstance.getCallbackArgs();
      expect(Object.keys(callbackArgs).length, "初始化后 callbackArgs 应为空").toBe(0);
    });
  });

  // ============================================================
  // 触发回调 → callbackArgs 更新
  // ============================================================

  describe("交互组件触发回调", () => {
    it("点击交互组件第一项 value=1 label=admin callbackArgs 应设为 selectedId=1 keyword=admin", async () => {
      await simulateTrigger(0);

      const callbackArgs = callbackInstance.getCallbackArgs();
      expect(callbackArgs["selectedId"], "selectedId 应为 1").toBe(1);
      expect(callbackArgs["keyword"], "keyword 应为 admin").toBe("admin");
    });

    it("点击交互组件第二项 value=2 label=user callbackArgs 应更新为 selectedId=2 keyword=user", async () => {
      await simulateTrigger(1);

      const callbackArgs = callbackInstance.getCallbackArgs();
      expect(callbackArgs["selectedId"], "selectedId 应为 2").toBe(2);
      expect(callbackArgs["keyword"], "keyword 应为 user").toBe("user");
    });

    it("点击交互组件第三项 value=3 label=all callbackArgs 应更新为 selectedId=3 keyword=all", async () => {
      await simulateTrigger(2);

      const callbackArgs = callbackInstance.getCallbackArgs();
      expect(callbackArgs["selectedId"], "selectedId 应为 3").toBe(3);
      expect(callbackArgs["keyword"], "keyword 应为 all").toBe("all");
    });
  });

  // ============================================================
  // getFullDataUrl - URL 路径模板替换
  // ============================================================

  describe("getFullDataUrl - URL 路径模板替换", () => {
    it("无回调值时 默认值替换 /api/users/${selectedId||1} → /api/users/1", () => {
      const filter = new ApiFilter();
      const result = filter.getFullDataUrl("/api/users/${selectedId||1}");
      expect(result).toBe("/api/users/1");
    });

    it("回调触发后 selectedId=2 /api/users/${selectedId||1} → /api/users/2", async () => {
      await simulateTrigger(1);
      const filter = new ApiFilter();
      const result = filter.getFullDataUrl("/api/users/${selectedId||1}");
      expect(result).toBe("/api/users/2");
    });

    it("多个模板变量同时替换", async () => {
      await simulateTrigger(2);
      const filter = new ApiFilter();
      const result = filter.getFullDataUrl("/api/${type||users}/${selectedId||1}");
      expect(result).toBe("/api/users/3");
    });

    it("URL 中无模板变量 原样返回", () => {
      const filter = new ApiFilter();
      const result = filter.getFullDataUrl("/api/users/list");
      expect(result).toBe("/api/users/list");
    });
  });

  // ============================================================
  // getDataQuery - query 参数模板替换
  // ============================================================

  describe("getDataQuery - query 参数模板替换", () => {
    it("无回调值时 默认值替换 keyword=${keyword||all}&page=1 → keyword=all&page=1", () => {
      const filter = new ApiFilter();
      const target = { dataQuery: "keyword=${keyword||all}&page=1" } as ComponentType;
      const result = filter.getDataQuery(target);
      expect(result).toBe("keyword=all&page=1");
    });

    it("回调触发后 keyword=admin keyword=${keyword||all}&page=1 → keyword=admin&page=1", async () => {
      await simulateTrigger(0);
      const filter = new ApiFilter();
      const target = { dataQuery: "keyword=${keyword||all}&page=1" } as ComponentType;
      const result = filter.getDataQuery(target);
      expect(result).toBe("keyword=admin&page=1");
    });

    it("dataQuery 为空字符串 返回空字符串", () => {
      const filter = new ApiFilter();
      const target = { dataQuery: "" } as ComponentType;
      const result = filter.getDataQuery(target);
      expect(result).toBe("");
    });

    it("dataQuery 为 undefined 返回空字符串", () => {
      const filter = new ApiFilter();
      const target = { dataQuery: undefined } as any;
      const result = filter.getDataQuery(target);
      expect(result).toBe("");
    });
  });

  // ============================================================
  // handleRequest - 请求头/请求体模板替换
  // ============================================================

  describe("handleRequest - 请求头模板替换", () => {
    it("无回调值时 默认值替换 Authorization Bearer ${token||demo-token}", () => {
      const filter = new ApiFilter();
      const header = { Authorization: "Bearer ${token||demo-token}" };
      const result = filter.handleRequest(header);
      expect(result.Authorization).toBe("Bearer demo-token");
    });

    it("设置 token 后 Authorization 替换为实际值", () => {
      callbackInstance.setCallbackArgs("token", "real-jwt-token");
      const filter = new ApiFilter();
      const header = { Authorization: "Bearer ${token||demo-token}" };
      const result = filter.handleRequest(header);
      expect(result.Authorization).toBe("Bearer real-jwt-token");
    });

    it("空对象返回 undefined", () => {
      const filter = new ApiFilter();
      const result = filter.handleRequest({});
      expect(result).toBeUndefined();
    });
  });

  // ============================================================
  // 完整请求流程 - getData
  // ============================================================

  describe("getData - 完整请求流程", () => {
    it("无回调值时 跨域 get 请求 URL 和参数应使用默认值", async () => {
      (queryAPIData as any).mockResolvedValue({ result: { values: [{ name: "A", value: 100 }] } });

      const filter = new ApiFilter();
      const target = getApiComponent();
      const result = await filter.getData(target);

      // 验证请求参数
      expect(queryAPIData).toHaveBeenCalledTimes(1);
      const callArgs = (queryAPIData as any).mock.calls[0][0];
      expect(callArgs.url, "URL 应包含默认 selectedId=1").toContain("/api/users/1");
      expect(callArgs.url, "URL 应包含默认 keyword=all").toContain("keyword=all");
      expect(callArgs.url, "URL 应包含静态参数 page=1").toContain("page=1");
      expect(callArgs.method, "请求方法应为 get").toBe("get");
      // crossOrigin 路径传字符串给 handleStringRequest，不支持 ||default，变量被替换为 undefined 字符串
      expect(callArgs.headers, "请求头 token 变量被替换为 undefined").toContain("undefined");

      // 验证返回值
      expect(result).not.toBe(false);
      expect((result as any).status).toBe(200);
    });

    it("交互组件触发后 跨域 get 请求 URL 和参数应使用回调值", async () => {
      await simulateTrigger(1);
      (queryAPIData as any).mockResolvedValue({ result: { values: [{ name: "B", value: 200 }] } });

      const filter = new ApiFilter();
      const target = getApiComponent();
      const result = await filter.getData(target);

      // 验证请求参数
      expect(queryAPIData).toHaveBeenCalledTimes(1);
      const callArgs = (queryAPIData as any).mock.calls[0][0];
      expect(callArgs.url, "URL 应包含回调 selectedId=2").toContain("/api/users/2");
      expect(callArgs.url, "URL 应包含回调 keyword=user").toContain("keyword=user");
      expect(callArgs.method, "请求方法应为 get").toBe("get");

      // 验证返回值
      expect(result).not.toBe(false);
      expect((result as any).status).toBe(200);
    });

    it("queryAPIData 返回标准 {status, data} 格式 直接透传", async () => {
      (queryAPIData as any).mockResolvedValue({ status: 200, data: [{ name: "X", value: 42 }] });

      const filter = new ApiFilter();
      const target = getApiComponent();
      const result = await filter.getData(target);

      expect(result).toEqual({ status: 200, data: [{ name: "X", value: 42 }] });
    });

    it("API 返回非 200 状态码 getInputData 应返回空数组并弹出错误提示", async () => {
      (queryAPIData as any).mockResolvedValue({ status: 500, data: { message: "Internal Server Error" } });

      const { ElMessage } = await import("element-plus");
      const filter = new ApiFilter();
      const target = getApiComponent();
      const result = await filter.getInputData(target);

      expect(result, "非 200/201 状态应返回空数组").toEqual([]);
      expect(ElMessage.error, "应弹出错误提示").toHaveBeenCalled();
    });
  });

  // ============================================================
  // 工具方法
  // ============================================================

  describe("工具方法", () => {
    it("getJson 字符串安全解析为对象", () => {
      const filter = new ApiFilter();
      expect(filter.getJson('{"key":"value"}')).toEqual({ key: "value" });
    });

    it("getJson 非法 JSON 字符串返回空对象", () => {
      const filter = new ApiFilter();
      expect(filter.getJson("{invalid}")).toEqual({});
    });

    it("getJson null 返回空对象", () => {
      const filter = new ApiFilter();
      expect(filter.getJson(null)).toEqual({});
    });

    it("getJson 已是对象直接返回", () => {
      const filter = new ApiFilter();
      const obj = { a: 1 };
      expect(filter.getJson(obj)).toBe(obj);
    });

    it("removeEmptyKeys 过滤空值 null undefined 空字符串", () => {
      const filter = new ApiFilter();
      const result = filter.removeEmptyKeys({ a: "value", b: "", c: null, d: undefined, e: 0, f: false });
      expect(result).toEqual({ a: "value" });
    });

    it("removeEmptyKeys 数字 0 也会被过滤 因为 lodash isEmpty(0) 为 true", () => {
      const filter = new ApiFilter();
      const result = filter.removeEmptyKeys({ count: 0 });
      expect(result).toEqual({});
    });
  });

  // ============================================================
  // 集成测试 - 完整触发链路
  // handleCallback → emitCallbackFieldTrigger → useRegisterFilter
  // → FilterData.run → ApiFilter.run → getData → queryAPIData
  // ============================================================

  describe("集成测试 - 交互组件触发 → API 组件发请求 → 过滤器返回数据", () => {
    it("交互组件点击第一项 handleCallback 触发完整链路 API 请求参数正确", async () => {
      (queryAPIData as any).mockResolvedValue({
        status: 200,
        data: { id: 1, name: "admin", email: "admin@test.com", role: "admin" }
      });

      const { allComponentMap } = useGlobalComponentData();
      const { handleCallback, callbackEventManager, callbackArgumentsManager } = useCallbackArguments();
      const apiComponent = allComponentMap.value.get("3224201")!;
      const mutualComponent = groupData.value.find((c: any) => c.id === 3224200);

      // 诊断：验证回调关系存在
      expect(callbackArgumentsManager.value["selectedId"], "selectedId 关系应存在").toBeTruthy();
      expect(callbackArgumentsManager.value["selectedId"]!.target[0].id, "目标应为 3224201").toBe(3224201);
      expect(callbackArgumentsManager.value["keyword"], "keyword 关系应存在").toBeTruthy();

      let filterResult: any;
      const { registerFilter, unRegisterFilter } = useRegisterFilter(apiComponent, (data) => {
        filterResult = data;
      });

      registerFilter();

      // 诊断：验证事件监听器已注册
      expect(
        callbackEventManager.callbackFieldTriggerMap.has(`onCallbackFieldTrigger-selectedId-3224201`),
        "selectedId 监听器应已注册"
      ).toBe(true);
      expect(
        callbackEventManager.callbackFieldTriggerMap.has(`onCallbackFieldTrigger-keyword-3224201`),
        "keyword 监听器应已注册"
      ).toBe(true);

      // 触发完整链路
      await handleCallback({
        sourceComponent: mutualComponent,
        throwValue: mutualComponent.data[0],
        debounce: false
      });

      // 目标组件同时监听 selectedId 和 keyword 两个字段，一次点击会写入两个回调值；
      // debounce:false 下 handleCallback 会按字段逐一触发，故 queryAPIData 被调用两次
      // （线上默认 debounce:true，两个字段共用同一防抖函数会合并为一次请求）。
      expect(queryAPIData).toHaveBeenCalledTimes(2);
      // 两次请求都在回调值全部写入后发起，URL 参数应一致且正确
      const firstUrl = (queryAPIData as any).mock.calls[0][0].url;
      const secondUrl = (queryAPIData as any).mock.calls[1][0].url;
      [firstUrl, secondUrl].forEach((url) => {
        expect(url, "URL 应包含回调 selectedId=1").toContain("/api/users/1");
        expect(url, "URL 应包含回调 keyword=admin").toContain("keyword=admin");
      });
      expect((queryAPIData as any).mock.calls[0][0].method, "请求方法应为 get").toBe("get");

      // 验证过滤后数据经过 dataFormatter 转换
      expect(filterResult, "过滤器应返回数据").toBeDefined();
      expect(Array.isArray(filterResult), "过滤结果应为数组").toBe(true);

      unRegisterFilter();
    });

    it("交互组件点击第二项 回调值不同 API 请求参数随之变化", async () => {
      (queryAPIData as any).mockResolvedValue({
        status: 200,
        data: { id: 2, name: "user", email: "user@test.com", role: "user" }
      });

      const { allComponentMap } = useGlobalComponentData();
      const { handleCallback } = useCallbackArguments();
      const apiComponent = allComponentMap.value.get("3224201")!;
      const mutualComponent = groupData.value.find((c: any) => c.id === 3224200);

      let filterResult: any;
      const { registerFilter, unRegisterFilter } = useRegisterFilter(apiComponent, (data) => {
        filterResult = data;
      });

      registerFilter();

      await handleCallback({
        sourceComponent: mutualComponent,
        throwValue: mutualComponent.data[1], // {value:2, label:"user"}
        debounce: false
      });

      // 同时监听 selectedId+keyword 两个字段，debounce:false 下按字段逐一触发，故调用两次
      expect(queryAPIData).toHaveBeenCalledTimes(2);
      const firstUrl = (queryAPIData as any).mock.calls[0][0].url;
      const secondUrl = (queryAPIData as any).mock.calls[1][0].url;
      [firstUrl, secondUrl].forEach((url) => {
        expect(url, "URL 应包含回调 selectedId=2").toContain("/api/users/2");
        expect(url, "URL 应包含回调 keyword=user").toContain("keyword=user");
      });

      expect(filterResult, "过滤器应返回数据").toBeDefined();

      unRegisterFilter();
    });

    it("无回调触发时 calculateComponentData 使用默认模板值发起请求", async () => {
      (queryAPIData as any).mockResolvedValue({
        status: 200,
        data: { id: 1, name: "default", email: "default@test.com", role: "guest" }
      });

      const { allComponentMap } = useGlobalComponentData();
      const apiComponent = allComponentMap.value.get("3224201")!;

      let filterResult: any;
      const { calculateComponentData, registerFilter, unRegisterFilter } = useRegisterFilter(apiComponent, (data) => {
        filterResult = data;
      });

      registerFilter();

      // 不触发 handleCallback，直接调用 calculateComponentData（模拟组件初始化加载）
      await calculateComponentData();

      expect(queryAPIData).toHaveBeenCalledTimes(1);
      const callArgs = (queryAPIData as any).mock.calls[0][0];
      expect(callArgs.url, "URL 应包含默认 selectedId=1").toContain("/api/users/1");
      expect(callArgs.url, "URL 应包含默认 keyword=all").toContain("keyword=all");

      expect(filterResult, "过滤器应返回数据").toBeDefined();

      unRegisterFilter();
    });
  });
});
