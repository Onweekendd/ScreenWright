import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { nextTick } from "vue";

import { isNumber, isString } from "lodash-es";

import { getLargeScreenInfo } from "@/api/build";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useCacheData } from "@/views/build/useCacheData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useDataFilter } from "../../views/build/useDataFilter";
import { useLargeScreenInfo } from "../../views/build/useLargeScreenInfo";
import mockDetail from "./componentData4.mock.json";

// ============================================
// 使用 vi.hoisted 确保 mock 变量在 vi.mock 提升前初始化
// ============================================
const {
  mockElMessageError,
  wsCallbacks,
  mockWebSocketConfig,
  mockWebSocketLocalSocket,
  mockWebSocketOnClose,
  mockWebSocketSendMsg
} = vi.hoisted(() => {
  const mockElMessageError = vi.fn();

  const wsCallbacks = {
    onReceiveMessage: null as ((data: unknown) => void) | null,
    onOpen: null as (() => void) | null,
    onError: null as ((error: string) => void) | null
  };

  // Mock localSocket method directly as a standalone function
  const mockWebSocketLocalSocket = vi.fn((onReceiveMessage, onError, onOpen) => {
    wsCallbacks.onReceiveMessage = onReceiveMessage;
    wsCallbacks.onError = onError;
    wsCallbacks.onOpen = onOpen;
    // 模拟连接成功
    setTimeout(() => onOpen?.(), 0);
  });

  const mockWebSocketOnClose = vi.fn();
  const mockWebSocketSendMsg = vi.fn();

  // Mock WebSocketConfig constructor to return an instance with correct methods
  const mockWebSocketConfig = vi.fn().mockImplementation(() => {
    return {
      localSocket: mockWebSocketLocalSocket,
      onclose: mockWebSocketOnClose,
      sendMsg: mockWebSocketSendMsg,
      socketOpen: null,
      ws: undefined
    };
  });

  return {
    mockElMessageError,
    wsCallbacks,
    mockWebSocketConfig,
    mockWebSocketLocalSocket,
    mockWebSocketOnClose,
    mockWebSocketSendMsg
  };
});

// Mock @/utils/websocket 的 WebSocketConfig 类（app 端 re-export 路径）
vi.mock("@/utils/websocket", () => ({
  WebSocketConfig: mockWebSocketConfig
}));

// FilterData 已下沉到 @screenwright/composables，WS 连接由包内 WebSocketConnection 创建，
// 它从包内相对路径 import WebSocketConfig；测试期 vite.config.ts 将 @screenwright/composables 直连到
// packages/composables/src（而非 dist），需 mock 源码路径才能拦截包内真实建连逻辑
// （否则 jsdom 会真去连 ws://127.0.0.1:8081）
vi.mock("../../../../../packages/composables/src/utils/websocket", () => ({
  WebSocketConfig: mockWebSocketConfig,
  Websocketconfig: mockWebSocketConfig
}));

// Mock ElMessage
vi.mock("element-plus", () => ({
  ElMessage: {
    error: mockElMessageError
  }
}));

// ============================================
// 模拟 Vue 的组件生命周期
// ============================================
const mockOnBeforeMount = vi.fn();
const mockOnMounted = vi.fn();
const mockOnUnmounted = vi.fn();
const mockInject = vi.fn();

vi.mock("vue", async () => {
  const actual = (await vi.importActual("vue")) as Record<string, unknown>;
  return {
    ...actual,
    onBeforeMount: (fn: () => void) => mockOnBeforeMount(fn),
    onMounted: (fn: () => void) => mockOnMounted(fn),
    onUnmounted: (fn: () => void) => mockOnUnmounted(fn),
    inject: (key: unknown, defaultValue?: unknown) => mockInject(key, defaultValue)
  };
});

// 固定化 uuid，避免用例受随机值影响
vi.mock("@/utils/utils", async () => ({
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

// mock 获取大屏详情接口，每次返回 mockDetail 的深拷贝
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

// ============================================
// 工厂函数：模拟 WebSocket 行为
// ============================================

/**
 * 模拟 WebSocket 连接成功
 */
const simulateWsConnect = () => {
  wsCallbacks.onOpen?.();
};

/**
 * 模拟接收 WebSocket 消息
 * @param data 要发送的数据
 */
const simulateWsMessage = (data: unknown) => {
  wsCallbacks.onReceiveMessage?.(data);
};

/**
 * 模拟接收原始字符串消息（非 JSON）
 * @param rawText 原始字符串
 */
const simulateWsRawMessage = (rawText: string) => {
  wsCallbacks.onReceiveMessage?.(rawText);
};

/**
 * 模拟 WebSocket 错误
 */
const simulateWsError = () => {
  wsCallbacks.onError?.("连接错误");
};

/**
 * 重置 WebSocket Mock 状态
 */
const resetWsMock = () => {
  wsCallbacks.onReceiveMessage = null;
  wsCallbacks.onOpen = null;
  wsCallbacks.onError = null;
};

// ============================================
// 测试用例
// ============================================
describe("WebSocket 数据过滤器测试 (使用 WebSocketConfig)", () => {
  beforeAll(async () => {
    // 在所有测试前重置模块状态一次
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    // 清理单例实例
    const { WebsocketFilter } = await import(
      "@/views/build/components/buildRender/core/BaseComponent/filterData/websocketFilter"
    );
    const { WebSocketManager } = await import(
      "@/views/build/components/buildRender/core/BaseComponent/filterData/utils/WebSocketManager"
    );
    WebsocketFilter.resetInstance();
    WebSocketManager.resetInstance();
  });

  beforeEach(async () => {
    // 重置 WebSocket Mock 状态
    resetWsMock();
    vi.clearAllMocks();

    // 重置单例实例（防止测试间状态污染）
    const { WebsocketFilter } = await import(
      "@/views/build/components/buildRender/core/BaseComponent/filterData/websocketFilter"
    );
    const { WebSocketManager } = await import(
      "@/views/build/components/buildRender/core/BaseComponent/filterData/utils/WebSocketManager"
    );
    WebsocketFilter.resetInstance();
    WebSocketManager.resetInstance();

    const { resetNavInfo, setNavInfo } = useLargeScreenInfo();
    const { setGroupData, groupData, resetGroupData } = useGlobalComponentData();
    const { initCallbackArguments, onClear } = useCallbackArguments();
    const { setDetail2Config, resetEditStore } = useEditStore();
    const { resetDataFilter, cloneDataFilterOnInit } = useDataFilter();

    // 重置所有状态
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
  }, 30000);

  afterEach(() => {
    const { navInfo } = useLargeScreenInfo();
    if (navInfo.value.id !== -1) {
      const { buildWorkerCacheInput } = useCacheData();
      const workerCacheInput = buildWorkerCacheInput(Date.now());
      structuredClone(workerCacheInput);
    }

    // 清理 WebSocket Mock
    resetWsMock();
    vi.clearAllMocks();
  });

  // ============================================
  // 场景 1: 组件数据配置验证
  // ============================================
  describe("组件数据配置验证", () => {
    it(
      "数据容器组件应配置为 WebSocket 类型",
      () => {
        // Arrange
        const { groupData } = useGlobalComponentData();
        const dataContainer = groupData.value[0];

        // Assert
        expect(dataContainer.isWebsocket).toBe(true);
        expect(dataContainer.websocketUrl).toBe("ws://127.0.0.1:8081");
        expect(dataContainer.dataType).toBe(4); // DataType.WEBSOCKET = 4
      },
      {
        timeout: 20000
      }
    );

    it("数据容器应绑定数据过滤器", () => {
      // Arrange
      const { groupData } = useGlobalComponentData();
      const dataContainer = groupData.value[0];

      // Assert
      expect(dataContainer.listenArgs).toBeDefined();
      expect(dataContainer.listenArgs.length).toBeGreaterThan(0);
      expect(dataContainer.listenArgs[0].filterName).toBe("新建过滤器");
    });

    it("文本框组件应监听回调参数", () => {
      // Arrange
      const { groupData } = useGlobalComponentData();
      const textBox = groupData.value[1];

      // Assert
      expect(textBox.listenArgs).toBeDefined();
      expect(textBox.listenArgs[0].filterName).toBe("新建过滤器2");
      expect(textBox.listenArgs[0].callbackFields).toContain("cbValue");
    });

    it("数据容器的回调参数应正确配置", () => {
      // Arrange
      const { groupData } = useGlobalComponentData();
      const dataContainer = groupData.value[0];

      // Assert
      expect(dataContainer.cbArgs).toBeDefined();
      expect(dataContainer.cbArgs.length).toBe(1);
      expect(dataContainer.cbArgs[0].value.target.value).toBe("cbVal");
    });

    it("数据容器的数据源应包含 WebSocket 配置", () => {
      // Arrange
      const { groupData } = useGlobalComponentData();
      const dataContainer = groupData.value[0];

      // Assert
      expect(dataContainer.dataSource).toBeDefined();
      expect(dataContainer.dataSource.type).toBe(2);
      expect(dataContainer.dataSource.name).toBe("WS moclk 2");
      const config = JSON.parse((dataContainer.dataSource as { config: string }).config);
      expect(config.baseUrl).toBe("ws://127.0.0.1:8081");
      expect(config.type).toBe("websocket");
    });
  });

  // ============================================
  // 场景 2: 过滤器配置验证
  // ============================================
  describe("过滤器配置验证", () => {
    it("全局数据过滤器应包含正确的过滤器配置", () => {
      // Arrange
      const { dataFilter } = useDataFilter();

      // Assert
      expect(dataFilter.value["新建过滤器"]).toBeDefined();
      expect(dataFilter.value["新建过滤器"].show).toBe(true);
      expect(dataFilter.value["新建过滤器"].checked).toBe(true);
    });

    it("过滤器应绑定到数据容器组件", () => {
      // Arrange
      const { dataFilter } = useDataFilter();
      const filter = dataFilter.value["新建过滤器"];

      // Assert
      expect(filter.bindComponent).toBeDefined();
      expect(filter.bindComponent.length).toBe(1);
      expect(filter.bindComponent[0].label).toBe("数据容器");
    });

    it("第二个过滤器应绑定到文本框并监听回调参数", () => {
      // Arrange
      const { dataFilter } = useDataFilter();
      const filter = dataFilter.value["新建过滤器2"];

      // Assert
      expect(filter).toBeDefined();
      expect(filter.callBack).toContain("cbValue");
      expect(filter.bindComponent[0].label).toBe("文本框");
    });

    it("过滤器的 dataFormatter 应是有效的函数字符串", () => {
      // Arrange
      const { dataFilter } = useDataFilter();
      const filter = dataFilter.value["新建过滤器"];

      // Assert
      expect(filter.dataFormatter).toContain("data");
      expect(filter.dataFormatter).toContain("return");
    });
  });

  // ============================================
  // 场景 3: WebsocketFilter 类单元测试
  // ============================================
  describe("WebsocketFilter 类行为", () => {
    it("WebsocketFilter 应通过 FilterData 正确实例化", async () => {
      // Arrange
      const { FilterData } = await import("@/views/build/components/buildRender/core/BaseComponent/filterData/index");
      const { groupData } = useGlobalComponentData();
      const { dataFilter } = useDataFilter();
      const dataContainer = groupData.value[0];
      const mockCallback = vi.fn();

      // Act
      const filterData = new FilterData();
      await filterData.run({
        filterConfig: dataFilter.value,
        target: dataContainer,
        onDataReceived: mockCallback
      });
      await nextTick();

      // Assert - WebSocketConfig 应被调用
      expect(mockWebSocketConfig).toHaveBeenCalled();
    }, 30000);

    it("WebsocketFilter，创建 WebSocket 连接，使用有限重连且禁用自动初始化配置", async () => {
      // Arrange
      const { FilterData } = await import("@/views/build/components/buildRender/core/BaseComponent/filterData/index");
      const { groupData } = useGlobalComponentData();
      const { dataFilter } = useDataFilter();
      const dataContainer = groupData.value[0];

      // Act
      const filterData = new FilterData();
      await filterData.run({
        filterConfig: dataFilter.value,
        target: dataContainer
      });
      await nextTick();

      // Assert - 验证 WebSocketConfig 被调用时的配置
      expect(mockWebSocketConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          src: "ws://127.0.0.1:8081",
          longConnect: false,
          initLoad: false,
          enableHeartbeat: true,
          heartbeatInterval: 30000,
          responseTimeout: 5000
        })
      );
    }, 10000);

    it("WebsocketFilter 应注册三个回调函数", async () => {
      // Arrange
      const { FilterData } = await import("@/views/build/components/buildRender/core/BaseComponent/filterData/index");
      const { groupData } = useGlobalComponentData();
      const { dataFilter } = useDataFilter();
      const dataContainer = groupData.value[0];
      const mockCallback = vi.fn();

      // Act
      const filterData = new FilterData();
      await filterData.run({
        filterConfig: dataFilter.value,
        target: dataContainer,
        onDataReceived: mockCallback
      });
      await nextTick();

      // Assert - 三个回调都应被注册
      expect(wsCallbacks.onReceiveMessage).toBeDefined();
      expect(typeof wsCallbacks.onReceiveMessage).toBe("function");
      expect(wsCallbacks.onError).toBeDefined();
      expect(typeof wsCallbacks.onError).toBe("function");
      expect(wsCallbacks.onOpen).toBeDefined();
      expect(typeof wsCallbacks.onOpen).toBe("function");
    }, 10000);

    it("getInputData 应在无 WebSocket 配置时返回组件默认数据", async () => {
      // Arrange
      const { FilterData } = await import("@/views/build/components/buildRender/core/BaseComponent/filterData/index");
      const { groupData } = useGlobalComponentData();
      const textBox = groupData.value[1]; // 文本框组件，非 WebSocket 类型

      // Act
      const filterData = new FilterData();
      const result = await filterData.getInputData(textBox);

      // Assert
      expect(result).toEqual(textBox.data);
    }, 10000);
  });

  // ============================================
  // 场景 4: WebSocket 消息接收
  // ============================================
  describe("WebSocket 消息接收", () => {
    it("接收消息后，onReceiveMessage 回调应被触发", async () => {
      // Arrange
      const { FilterData } = await import("@/views/build/components/buildRender/core/BaseComponent/filterData/index");
      const { groupData } = useGlobalComponentData();
      const { dataFilter } = useDataFilter();
      const dataContainer = groupData.value[0];
      const mockCallback = vi.fn();

      // Act
      const filterData = new FilterData();
      await filterData.run({
        filterConfig: dataFilter.value,
        target: dataContainer,
        onDataReceived: mockCallback
      });
      await nextTick();

      // 模拟接收消息
      const testData = { text: "测试消息" };
      simulateWsMessage(testData);
      await nextTick();

      // Assert
      expect(mockCallback).toHaveBeenCalled();
    }, 10000);

    it("接收数组数据时，dataCallback 应正确传递数据", async () => {
      // Arrange
      const { FilterData } = await import("@/views/build/components/buildRender/core/BaseComponent/filterData/index");
      const { groupData } = useGlobalComponentData();
      const { dataFilter } = useDataFilter();
      const dataContainer = groupData.value[0];
      const mockCallback = vi.fn();

      // Act
      const filterData = new FilterData();
      await filterData.run({
        filterConfig: dataFilter.value,
        target: dataContainer,
        onDataReceived: mockCallback
      });
      await nextTick();

      const testData = [{ id: 1 }, { id: 2 }];
      simulateWsMessage(testData);
      await nextTick();

      // Assert
      expect(mockCallback).toHaveBeenCalledWith(testData);
    }, 10000);

    it("接收对象数据时，dataCallback 应正确传递数据", async () => {
      // Arrange
      const { FilterData } = await import("@/views/build/components/buildRender/core/BaseComponent/filterData/index");
      const { groupData } = useGlobalComponentData();
      const { dataFilter } = useDataFilter();
      const dataContainer = groupData.value[0];
      const mockCallback = vi.fn();

      // Act
      const filterData = new FilterData();
      await filterData.run({
        filterConfig: dataFilter.value,
        target: dataContainer,
        onDataReceived: mockCallback
      });
      await nextTick();

      const testData = { text: "单个对象" };
      simulateWsMessage(testData);
      await nextTick();

      // Assert
      expect(mockCallback).toHaveBeenCalledWith(testData);
    }, 10000);

    it("多次接收消息时，每次都应触发 dataCallback", async () => {
      // Arrange
      const { FilterData } = await import("@/views/build/components/buildRender/core/BaseComponent/filterData/index");
      const { groupData } = useGlobalComponentData();
      const { dataFilter } = useDataFilter();
      const dataContainer = groupData.value[0];
      const mockCallback = vi.fn();

      // Act
      const filterData = new FilterData();
      await filterData.run({
        filterConfig: dataFilter.value,
        target: dataContainer,
        onDataReceived: mockCallback
      });
      await nextTick();

      simulateWsMessage({ msg: "消息1" });
      await nextTick();
      simulateWsMessage({ msg: "消息2" });
      await nextTick();
      simulateWsMessage({ msg: "消息3" });
      await nextTick();

      // Assert
      expect(mockCallback).toHaveBeenCalledTimes(3);
    }, 10000);

    it("接收原始字符串消息时，dataCallback 应正确处理", async () => {
      // Arrange
      const { FilterData } = await import("@/views/build/components/buildRender/core/BaseComponent/filterData/index");
      const { groupData } = useGlobalComponentData();
      const { dataFilter } = useDataFilter();
      const dataContainer = groupData.value[0];
      const mockCallback = vi.fn();

      // Act
      const filterData = new FilterData();
      await filterData.run({
        filterConfig: dataFilter.value,
        target: dataContainer,
        onDataReceived: mockCallback
      });
      await nextTick();

      const rawText = "原始字符串消息";
      simulateWsRawMessage(rawText);
      await nextTick();

      // Assert
      expect(mockCallback).toHaveBeenCalledWith(rawText);
    }, 10000);
  });

  // ============================================
  // 场景 5: 错误处理
  // ============================================
  describe("错误处理", () => {
    it("WebSocket 连接错误时，错误处理回调应被触发", async () => {
      // Arrange
      const { FilterData } = await import("@/views/build/components/buildRender/core/BaseComponent/filterData/index");
      const { groupData } = useGlobalComponentData();
      const { dataFilter } = useDataFilter();
      const dataContainer = groupData.value[0];
      const mockCallback = vi.fn();

      // Act
      const filterData = new FilterData();
      await filterData.run({
        filterConfig: dataFilter.value,
        target: dataContainer,
        onDataReceived: mockCallback
      });
      await nextTick();

      // Assert - onError 回调应已注册，可以处理错误
      expect(wsCallbacks.onError).toBeDefined();
      expect(typeof wsCallbacks.onError).toBe("function");

      // 验证错误处理不会抛出异常
      expect(() => {
        simulateWsError();
      }).not.toThrow();
    });

    it("WebSocket 错误时，onError 回调应被调用", async () => {
      // Arrange
      const { FilterData } = await import("@/views/build/components/buildRender/core/BaseComponent/filterData/index");
      const { groupData } = useGlobalComponentData();
      const { dataFilter } = useDataFilter();
      const dataContainer = groupData.value[0];
      const mockCallback = vi.fn();

      // Act
      const filterData = new FilterData();
      await filterData.run({
        filterConfig: dataFilter.value,
        target: dataContainer,
        onDataReceived: mockCallback
      });
      await nextTick();

      // Assert - onError 应已被注册
      expect(wsCallbacks.onError).toBeDefined();
      expect(typeof wsCallbacks.onError).toBe("function");
    });
  });

  // ============================================
  // 场景 6: 连接管理
  // ============================================
  describe("连接管理", () => {
    it("连接成功后，onOpen 回调应被触发", async () => {
      // Arrange
      const { FilterData } = await import("@/views/build/components/buildRender/core/BaseComponent/filterData/index");
      const { groupData } = useGlobalComponentData();
      const { dataFilter } = useDataFilter();
      const dataContainer = groupData.value[0];
      const mockCallback = vi.fn();

      // Act
      const filterData = new FilterData();
      await filterData.run({
        filterConfig: dataFilter.value,
        target: dataContainer,
        onDataReceived: mockCallback
      });
      await nextTick();

      // Assert
      expect(wsCallbacks.onOpen).toBeDefined();
      expect(typeof wsCallbacks.onOpen).toBe("function");
    });

    it("onOpen 被调用时不应抛出错误", async () => {
      // Arrange
      const { FilterData } = await import("@/views/build/components/buildRender/core/BaseComponent/filterData/index");
      const { groupData } = useGlobalComponentData();
      const { dataFilter } = useDataFilter();
      const dataContainer = groupData.value[0];
      const mockCallback = vi.fn();

      // Act
      const filterData = new FilterData();
      await filterData.run({
        filterConfig: dataFilter.value,
        target: dataContainer,
        onDataReceived: mockCallback
      });
      await nextTick();

      // Assert - 调用 onOpen 不应抛出错误
      expect(() => {
        simulateWsConnect();
      }).not.toThrow();
    });
  });
});
