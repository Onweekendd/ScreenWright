import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreateComponent } from "@/views/build/components/agentBI/hooks/useCreateComponent";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

/**
 * moveComponents 特征化测试。
 *
 * 这个函数原先零覆盖——树手术改由 @screenwright/core 的 ComponentManager.move 承担之后，
 * 需要有东西钉住「摘挂 / parent 记账 / zIndex 置顶 / 容器包围盒重算」这几件事没变。
 * 断言的是行为，不是实现，所以后续把更多逻辑挪进 core 时它仍然有效。
 */

const mockOnBeforeMount = vi.fn();
const mockOnMounted = vi.fn();
const mockOnUnmounted = vi.fn();
const mockInject = vi.fn();

vi.mock("vue", async () => ({
  ...((await vi.importActual("vue")) as any),
  onBeforeMount: (fn: () => void) => mockOnBeforeMount(fn),
  onMounted: (fn: () => void) => mockOnMounted(fn),
  onUnmounted: (fn: () => void) => mockOnUnmounted(fn),
  inject: (key: any, defaultValue?: any) => mockInject(key, defaultValue)
}));

vi.mock("@/api/library", () => ({
  updateLargeScreen: vi.fn().mockResolvedValue({ success: true }),
  updateLayersAgg: vi.fn().mockResolvedValue({ success: true }),
  updateLayersAggNoCache: vi.fn().mockResolvedValue({ success: true }),
  delLayersAgg: vi.fn().mockResolvedValue({ success: true }),
  saveLayersAgg: vi.fn().mockResolvedValue({ success: true }),
  getModuleInfo: vi.fn().mockResolvedValue(null),
  getGroupLayerData: vi.fn().mockResolvedValue(null),
  getLayerInfo: vi.fn().mockResolvedValue(null),
  copyLayers: vi.fn().mockResolvedValue({ success: true }),
  uploadGroupLayerInfo: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock("@/utils/service", () => ({ createRequest: vi.fn() }));
vi.mock("@/utils/cacheService", () => ({ createRequest: vi.fn() }));

/** 叶子组件：坐标与尺寸都给全，分组包围盒计算要用 */
const leaf = (id: number, left: number, top: number, zIndex: number) => ({
  id,
  name: `c${id}`,
  title: "条形图",
  component: { prop: "echartstripBar", width: 100, height: 50 },
  left,
  top,
  zIndex,
  display: true,
  option: {},
  data: [],
  events: [],
  cbArgs: [],
  listenArgs: []
});

const panelState = (id: string, config: unknown[] = []) => ({
  id,
  title: id,
  name: id,
  config,
  backgroundColor: "rgba(24,27,36,0)",
  showBackgroundImage: false,
  backgroundImage: "",
  showScreenAdaptation: false,
  adaptationNorm: "default",
  adaptationType: 2
});

/**
 * 固定的最小大屏：
 *   9   条形图（根级）
 *   100 分组 ── 101 / 102 条形图
 *   200 动态面板 ── 状态 s1 / s2（都为空）
 */
const makeScreen = () => ({
  id: 1234,
  versionCode: "1",
  layers: [
    leaf(9, 0, 0, 0),
    {
      id: 100,
      name: "g100",
      title: "分组",
      component: { prop: "sw-folder", width: 200, height: 100 },
      left: 200,
      top: 200,
      zIndex: 1,
      display: true,
      option: {},
      data: [],
      events: [],
      cbArgs: [],
      listenArgs: [],
      children: [
        { ...leaf(101, 200, 200, 3), parent: 100 },
        { ...leaf(102, 300, 250, 7), parent: 100 }
      ]
    },
    {
      id: 200,
      name: "p200",
      title: "动态面板",
      component: { prop: "sw-panel", width: 400, height: 300 },
      left: 600,
      top: 0,
      zIndex: 2,
      display: true,
      option: {},
      data: [],
      events: [],
      cbArgs: [],
      listenArgs: [],
      panelData: [panelState("s1"), panelState("s2")],
      activeStatusId: "s1"
    }
  ]
});

function setup() {
  const { setNavInfo, resetNavInfo } = useLargeScreenInfo();
  const { setGroupData, resetGroupData, groupData, allComponentMap } = useGlobalComponentData();
  const { resetEditStore, syncGlobalComponentData } = useEditStore();

  resetEditStore();
  resetNavInfo();
  resetGroupData();

  const screen = makeScreen();
  setNavInfo(screen as never);
  setGroupData(screen as never);
  // componentList 是「当前画布」那个数组；根级编辑态下它就是 layers 本身
  syncGlobalComponentData();

  return { groupData, allComponentMap };
}

const childIds = (component: { children?: Array<{ id: number }> }) => (component.children ?? []).map((c) => c.id);

describe("moveComponents", () => {
  beforeEach(() => {
    setup();
  });

  it("移动到分组：从根级摘除、挂进 children、记账 parent", async () => {
    const { groupData, allComponentMap } = setup();
    const { moveComponents } = useCreateComponent();

    const result = await moveComponents([9], { parentId: 100, parentType: "group" });

    expect(result.success).toBe(true);
    expect(groupData.value.map((c) => c.id)).toEqual([100, 200]);
    const group = allComponentMap.value.get("100")!;
    expect(childIds(group)).toEqual([101, 102, 9]);
    expect(allComponentMap.value.get("9")!.parent).toBe(100);
  });

  it("移动到分组：zIndex 顶到该容器最上层", async () => {
    const { allComponentMap } = setup();
    const { moveComponents } = useCreateComponent();

    // 分组内现有 zIndex 为 3 / 7
    await moveComponents([9], { parentId: 100, parentType: "group" });

    expect(allComponentMap.value.get("9")!.zIndex).toBe(8);
  });

  it("移动后重算分组包围盒", async () => {
    const { allComponentMap } = setup();
    const { moveComponents } = useCreateComponent();

    // 9 在 (0,0)，原分组成员在 (200,200) 与 (300,250)，并入后包围盒应从 (0,0) 起算
    await moveComponents([9], { parentId: 100, parentType: "group" });

    const group = allComponentMap.value.get("100")!;
    expect({ left: group.left, top: group.top }).toEqual({ left: 0, top: 0 });
    // 最右下角是 102：300+100 / 250+50
    expect({ width: group.component.width, height: group.component.height }).toEqual({ width: 400, height: 300 });
  });

  it("移动到动态面板指定状态，且不带 parent", async () => {
    const { allComponentMap, groupData } = setup();
    const { moveComponents } = useCreateComponent();

    const result = await moveComponents([9], { parentId: 200, parentType: "dynamicPanel", stateId: "s2" });

    expect(result.success).toBe(true);
    expect(groupData.value.map((c) => c.id)).toEqual([100, 200]);
    const panel = allComponentMap.value.get("200") as unknown as {
      panelData: Array<{ id: string; config: Array<{ id: number }> }>;
    };
    expect(panel.panelData[0].config.map((c) => c.id)).toEqual([]);
    expect(panel.panelData[1].config.map((c) => c.id)).toEqual([9]);
    expect(allComponentMap.value.get("9")!.parent).toBeUndefined();
  });

  it("把分组成员移回根级：从 children 摘除并清掉 parent", async () => {
    const { groupData, allComponentMap } = setup();
    const { moveComponents } = useCreateComponent();

    const result = await moveComponents([101]);

    expect(result.success).toBe(true);
    expect(groupData.value.map((c) => c.id)).toEqual([9, 100, 200, 101]);
    expect(childIds(allComponentMap.value.get("100")!)).toEqual([102]);
    expect(allComponentMap.value.get("101")!.parent).toBeUndefined();
  });

  it("落盘一律带 syncWorkspace: false —— 工作区归后端写", async () => {
    setup();
    const { moveComponents } = useCreateComponent();
    const { updateLayersAgg } = await import("@/api/library");
    vi.mocked(updateLayersAgg).mockClear();

    await moveComponents([9], { parentId: 100, parentType: "group" });

    // updateLayersAgg(data, updateHistoryType, showLoading, syncWorkspace)
    expect(vi.mocked(updateLayersAgg).mock.calls.length).toBeGreaterThan(0);
    for (const call of vi.mocked(updateLayersAgg).mock.calls) {
      expect(call[3]).toBe(false);
    }
  });

  it("组件不存在时失败，且不改动树", async () => {
    const { groupData } = setup();
    const { moveComponents } = useCreateComponent();
    const before = groupData.value.map((c) => c.id);

    const result = await moveComponents([404], { parentId: 100, parentType: "group" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("404");
    expect(groupData.value.map((c) => c.id)).toEqual(before);
  });

  it("目标容器是被移动的组件本身时失败", async () => {
    setup();
    const { moveComponents } = useCreateComponent();

    const result = await moveComponents([100], { parentId: 100, parentType: "group" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("目标容器不能是被移动的组件本身");
  });

  it("目标容器不存在时失败", async () => {
    setup();
    const { moveComponents } = useCreateComponent();

    const result = await moveComponents([9], { parentId: 999, parentType: "group" });

    expect(result.success).toBe(false);
    expect(result.message).toContain("999");
  });

  it("重复移动到同一容器不会让 zIndex 一路上涨", async () => {
    const { allComponentMap } = setup();
    const { moveComponents } = useCreateComponent();
    const target = { parentId: 100, parentType: "group" as const };

    await moveComponents([9], target);
    const afterFirst = allComponentMap.value.get("9")!.zIndex;
    await moveComponents([9], target);

    expect(allComponentMap.value.get("9")!.zIndex).toBe(afterFirst);
  });
});
