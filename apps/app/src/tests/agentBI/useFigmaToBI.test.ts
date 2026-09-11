import { beforeEach, describe, expect, it, vi } from "vitest";

// useFigmaToBI 是 createGlobalState 单例，其内部 figmaNodeIdToBIComponentId 映射在整个 worker
// 生命周期内常驻。这里只验证「幂等守卫 + finishConversion 清空」这条去重链，因此把打到
// 网络/DB/路由的叶子依赖全部 stub 掉，让真实 composable 的 addProcessedComponent 逻辑跑起来。

const {
  mockAddComponentList,
  mockAddComponentToPanel,
  mockUpdateComponentLayers,
  mockRouterPush,
  mockAllComponentMap,
  mockRoute
} = vi.hoisted(() => ({
  mockAddComponentList: vi.fn(),
  mockAddComponentToPanel: vi.fn(),
  mockUpdateComponentLayers: vi.fn(),
  mockRouterPush: vi.fn().mockResolvedValue(undefined),
  mockAllComponentMap: { value: new Map<string, unknown>() },
  mockRoute: { value: { name: "build", params: {} as Record<string, string | number> } }
}));

vi.mock("@/views/build/components/buildRender/hooks/useAction", () => ({
  useAction: () => ({
    addComponentList: mockAddComponentList,
    updateComponentLayers: mockUpdateComponentLayers
  }),
  UpdateHistoryTypeEnum: { SKIP: "SKIP", ADD: "ADD", UPDATE: "UPDATE", DELETE: "DELETE" }
}));

vi.mock("@/views/build/components/panelEditor/usePanelAction", () => ({
  usePanelAction: () => ({
    addComponentToPanel: mockAddComponentToPanel,
    addPanelStatus: vi.fn(),
    changePanelStatus: vi.fn(),
    addPanelToPanel: vi.fn()
  })
}));

// 以下 store 在被测的根级添加路径上不会被读取（route.name === "build" 使 navigateToRoot 直接返回），
// 给出带 .value 的伪 ref 即可，无需引入真正的 vue ref。
vi.mock("@/views/build/components/buildRender/hooks/useEditStore", () => ({
  useEditStore: () => ({ isDynamicPanel: () => false, componentList: { value: [] } })
}));
vi.mock("@/views/build/useGlobalComponentData", () => ({
  useGlobalComponentData: () => ({ allComponentMap: mockAllComponentMap })
}));
vi.mock("@/views/build/components/panelEditor/usePanelData", () => ({
  usePanelData: () => ({
    isLoad: { value: false },
    setIsLoad: vi.fn(),
    panelInfo: { value: { config: { panelData: [] } } }
  })
}));
vi.mock("@/views/build/useInitLargeScreenData", () => ({
  useInitLargeScreenData: () => ({ isLoad: { value: true } })
}));
vi.mock("@/views/build/useLargeScreenInfo", () => ({
  useLargeScreenInfo: () => ({ navInfo: { value: { id: 1 } } })
}));

vi.mock("@/router", () => ({
  // route.name === "build"：navigateToRoot 早返回，不触发 push，也不读 isScreenLoad。
  default: { currentRoute: mockRoute, push: mockRouterPush }
}));

vi.mock("@/api/assets", () => ({ uploadMinioScene: vi.fn() }));
vi.mock("element-plus", () => ({
  ElMessage: { error: vi.fn(), success: vi.fn(), warning: vi.fn() }
}));

import { type ConvertChunkDataType, useFigmaToBI } from "@/views/build/components/agentBI/hooks/useFigmaToBI";

const buildChunk = (nodeId: string, parentNodeId = ""): ConvertChunkDataType =>
  ({
    component: { id: 0, component: { prop: "swimg", name: "sw-img", width: 817, height: 424 } } as never,
    nodeId,
    parentNodeId,
    moduleId: 43
  }) as ConvertChunkDataType;

describe("useFigmaToBI.addProcessedComponent 幂等去重", () => {
  // createGlobalState 单例：同一份 figmaNodeIdToBIComponentId 映射跨用例常驻。
  const { addProcessedComponent, finishConversion } = useFigmaToBI();

  beforeEach(async () => {
    mockAddComponentList.mockReset();
    mockAddComponentList.mockResolvedValue({ id: 9999 });
    mockAddComponentToPanel.mockReset();
    mockUpdateComponentLayers.mockReset();
    mockRouterPush.mockReset();
    mockAllComponentMap.value.clear();
    Object.assign(mockRoute.value, { name: "build", params: {} });
    // 清空上一轮残留映射，保证每个用例从干净状态起步
    await finishConversion();
  });

  it("同一 nodeId 的 chunk 到达两次，addComponentList 只调用一次（不落出重复组件）", async () => {
    const chunk = buildChunk("ImageView_176_973_34");

    await addProcessedComponent(chunk);
    await addProcessedComponent(chunk);

    expect(mockAddComponentList).toHaveBeenCalledTimes(1);
  });

  it("不同 nodeId 的 chunk 各自正常添加，不被彼此的幂等守卫误伤", async () => {
    await addProcessedComponent(buildChunk("ImageView_176_973_34"));
    await addProcessedComponent(buildChunk("ImageView_4650_747_2"));

    expect(mockAddComponentList).toHaveBeenCalledTimes(2);
  });

  it("finishConversion 清空映射后，先前已添加的 nodeId 可在下一轮再次添加", async () => {
    await addProcessedComponent(buildChunk("ImageView_176_973_34"));
    expect(mockAddComponentList).toHaveBeenCalledTimes(1);

    await finishConversion();

    await addProcessedComponent(buildChunk("ImageView_176_973_34"));
    expect(mockAddComponentList).toHaveBeenCalledTimes(2);
  });

  it("component 为 null 直接返回，不调用 addComponentList", async () => {
    const res = await addProcessedComponent({ ...buildChunk("node-x"), component: null });

    expect(res).toBeNull();
    expect(mockAddComponentList).not.toHaveBeenCalled();
  });

  it("addProcessedComponent，进入动态面板后父组件不在 allComponentMap，同级子组件仍添加到该面板", async () => {
    const panel = {
      id: 100,
      component: { prop: "sw-panel", name: "dynamic-panel", width: 800, height: 600 }
    };
    mockAddComponentList.mockResolvedValueOnce(panel);
    mockAddComponentToPanel.mockResolvedValue({ id: 200, component: { prop: "swimg" } });

    await addProcessedComponent({
      ...buildChunk("panel-node"),
      component: panel as never,
      moduleId: 69
    });
    Object.assign(mockRoute.value, { name: "panel", params: { cid: 100 } });
    await addProcessedComponent(buildChunk("child-node-1", "panel-node"));
    await addProcessedComponent(buildChunk("child-node-2", "panel-node"));

    expect(mockAddComponentToPanel).toHaveBeenCalledTimes(2);
  });
});
