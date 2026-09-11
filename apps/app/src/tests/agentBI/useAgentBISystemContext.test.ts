import { beforeEach, describe, expect, it, vi } from "vitest";

// isDynamicPanel 开关：用例里切换 screen / panel
const { isDynamicPanelMock } = vi.hoisted(() => ({
  isDynamicPanelMock: vi.fn(() => false)
}));

vi.mock("@/router", async () => {
  const { ref } = await import("vue");
  return { default: { currentRoute: ref<{ params: Record<string, string> }>({ params: {} }) } };
});

vi.mock("@/views/build/components/buildRender/hooks/useEditStore", () => ({
  useEditStore: () => ({
    componentList: { value: [] },
    isDynamicPanel: isDynamicPanelMock,
    selectTargetData: { value: [] }
  })
}));

vi.mock("@/views/build/useLargeScreenInfo", () => ({
  useLargeScreenInfo: () => ({
    navInfo: { value: { id: 23595, versionCode: "v1" } }
  })
}));

vi.mock("@/views/build/useGlobalComponentData", () => {
  // 模块级单例：被测代码与测试用例须共享同一个 Map
  const allComponentMap = { value: new Map<string, unknown>() };
  return {
    useGlobalComponentData: () => ({ allComponentMap })
  };
});

vi.mock("@/views/build/components/panelEditor/usePanelData", () => ({
  usePanelData: () => ({
    activeStatusId: { value: "s1" },
    panelInfo: {
      value: { config: { panelData: [{ id: "s1", name: "默认状态" }] } }
    }
  })
}));

vi.mock("@/views/build/components/agentBI/componentPath", () => ({
  buildComponentPath: () => ({ namePath: "root/p", idPath: "1/2" })
}));

import router from "@/router";
import { useAgentBISystemContext } from "@/views/build/components/agentBI/hooks/useAgentBISystemContext";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

const { buildSystemContext } = useAgentBISystemContext();
const { allComponentMap } = useGlobalComponentData();

describe("useAgentBISystemContext - screen 场景", () => {
  beforeEach(() => {
    isDynamicPanelMock.mockReturnValue(false);
  });

  it("大屏根画布：current-page 为「大屏根画布」，不出现面板字段", () => {
    const xml = buildSystemContext([]);

    expect(xml).toContain("<editor-context>");
    expect(xml).toContain("类型: 大屏根画布");
    expect(xml).not.toContain("动态面板");
    expect(xml).toContain("screen_23595_v1");
  });

  // 回归：本测试运行在 vitest 顶层（无 Vue 组件实例 / setup）。
  // 旧实现里 useRoute() 在非 setup 上下文返回 undefined，buildSystemContext 在 panel 分支会抛
  // "Cannot read properties of undefined (reading 'params')"，导致动态面板里发消息直接崩溃。
  it("在非 setup 上下文调用不抛错（不依赖 useRoute 的 inject）", () => {
    expect(() => buildSystemContext([])).not.toThrow();
  });
});

describe("useAgentBISystemContext - panel 场景", () => {
  beforeEach(() => {
    isDynamicPanelMock.mockReturnValue(true);
    router.currentRoute.value = { params: { cid: "123" } } as never;
    allComponentMap.value.clear();
    allComponentMap.value.set("123", { id: 123, name: "销售看板", parentDynamicPanelId: [] } as never);
  });

  it("动态面板：输出含面板名、当前状态名、面板ID", () => {
    const xml = buildSystemContext([]);

    expect(xml).toContain("类型: 动态面板");
    expect(xml).toContain("面板名称: 「销售看板」");
    expect(xml).toContain("当前状态: 「默认状态」");
    expect(xml).toContain("面板ID: 123");
  });

  // 核心回归：证明 buildSystemContext 每次实时读全局 router.currentRoute，
  // 而非在 setup 时 captured 一次。createAgentBISession 多数在事件回调(setup外)被 addTab 触发，
  // 若仍用 useRoute() 则 route 恒为 undefined。
  it("currentRoute 切换后输出随之变化（实时读全局 router）", () => {
    router.currentRoute.value = { params: { cid: "456" } } as never;
    allComponentMap.value.set("456", { id: 456, name: "运营大盘", parentDynamicPanelId: [] } as never);

    const xml = buildSystemContext([]);

    expect(xml).toContain("运营大盘");
    expect(xml).not.toContain("销售看板");
  });
});
