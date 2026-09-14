import { beforeEach, describe, expect, it, vi } from "vitest";

import { SuspendType } from "@screenwright/server/rpc";

import { updateLayersAgg } from "@/api/library";
import { useComponentStreamUpdater } from "@/views/build/components/agentBI/hooks/useComponentStreamUpdater";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

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

const leaf = (id: number, left: number, top: number, zIndex: number) => ({
  id,
  name: `c${id}`,
  title: "条形图",
  component: { name: "echart-stripBar", prop: "echartstripBar", width: 100, height: 50 },
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

/**
 * 固定的最小大屏：
 *   9   条形图（根级）
 *   100 分组 ── 101 (200,200) / 102 (300,250)，包围盒正好是 [200,200]~[400,300]
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
      component: { name: "sw-folder", prop: "sw-folder", width: 200, height: 100 },
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
    }
  ]
});

function setup() {
  const { setNavInfo, resetNavInfo } = useLargeScreenInfo();
  const { setGroupData, resetGroupData, allComponentMap } = useGlobalComponentData();
  const { resetEditStore, syncGlobalComponentData } = useEditStore();

  resetEditStore();
  resetNavInfo();
  resetGroupData();

  const screen = makeScreen();
  setNavInfo(screen as never);
  setGroupData(screen as never);
  syncGlobalComponentData();

  return { allComponentMap };
}

const boxOf = (component: any) => ({
  left: component.left,
  top: component.top,
  width: component.component.width,
  height: component.component.height
});

/** 取 updateLayersAgg 对某个组件 id 的最后一次调用 */
const lastCallFor = (id: number) =>
  (updateLayersAgg as unknown as { mock: { calls: any[][] } }).mock.calls.filter((call) => call[0]?.id === id).at(-1);

/**
 * 后端推来的组件更新落到画布上时的两件事：
 *  1. 父分组的包围盒要跟着重算（跑 core 的 reflowGroup，与用户在属性面板改位置同一条规则）
 *  2. 这条路**不回写 agent 工作区**——工作区已由后端过 core 之后写好了
 */
describe("handlePushComponentUpdate", () => {
  beforeEach(() => {
    setup();
    vi.mocked(updateLayersAgg).mockClear();
  });

  const push = async (component: unknown) => {
    const { suspendHandlers } = useComponentStreamUpdater("session-1", { applyLocalMode: vi.fn() });
    const handler = suspendHandlers.get(SuspendType.PushComponentUpdate)!;
    return handler({
      suspendPayload: { type: SuspendType.PushComponentUpdate, component, replacements: 1 }
    } as never);
  };

  it("推送分组成员的新位置后，父分组的包围盒被重算", async () => {
    const { allComponentMap } = setup();
    vi.mocked(updateLayersAgg).mockClear();
    expect(boxOf(allComponentMap.value.get("100"))).toEqual({ left: 200, top: 200, width: 200, height: 100 });

    // 101 从 (200,200) 挪到 (100,200)：并集左边界左移 100，宽度 200 → 300
    await push({ ...leaf(101, 100, 200, 3), parent: 100 });

    expect(boxOf(allComponentMap.value.get("101"))).toMatchObject({ left: 100 });
    expect(boxOf(allComponentMap.value.get("100"))).toEqual({ left: 100, top: 200, width: 300, height: 100 });
  });

  it("成员与父分组的落盘都带 syncWorkspace: false", async () => {
    setup();
    vi.mocked(updateLayersAgg).mockClear();

    await push({ ...leaf(101, 100, 200, 3), parent: 100 });

    // updateLayersAgg(data, updateHistoryType, showLoading, syncWorkspace)
    expect(lastCallFor(101)?.[3]).toBe(false);
    expect(lastCallFor(100)?.[3]).toBe(false);
  });

  it("根级组件没有父分组，只落盘它自己", async () => {
    setup();
    vi.mocked(updateLayersAgg).mockClear();

    await push(leaf(9, 50, 60, 0));

    expect(lastCallFor(9)?.[3]).toBe(false);
    expect(lastCallFor(100)).toBeUndefined();
  });

  it("新数组比旧数组短时会整体替换 data 和 option 中的嵌套数组", async () => {
    const { allComponentMap } = setup();
    const component = allComponentMap.value.get("9")!;
    component.data = [
      { label: "Tab A", value: 1 },
      { label: "Tab B", value: 2 },
      { label: "Tab C", value: 3 }
    ];
    component.option = {
      series: [{ name: "系列1" }, { name: "系列2" }, { name: "系列3" }]
    };

    await push({
      ...leaf(9, 0, 0, 0),
      data: [
        { label: "Tab A", value: 1 },
        { label: "Tab B", value: 2 }
      ],
      option: { series: [{ name: "系列1" }, { name: "系列2" }] }
    });

    expect(component.data).toEqual([
      { label: "Tab A", value: 1 },
      { label: "Tab B", value: 2 }
    ]);
    expect(component.option.series).toEqual([{ name: "系列1" }, { name: "系列2" }]);
  });
});
