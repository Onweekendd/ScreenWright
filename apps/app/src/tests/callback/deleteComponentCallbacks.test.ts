import { beforeEach, describe, expect, it, vi } from "vitest";

import { initDataFilterPersistence } from "@screenwright/composables";

import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useAction } from "@/views/build/components/buildRender/hooks/useAction";
import { UpdateHistoryTypeEnum } from "@/views/build/components/buildRender/hooks/useAction";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

/**
 * 删除组件时的回调关系注销。
 *
 * 这件事原本是「摘树」与「注销回调登记」两个动作手工配对——每个删除分支都得记得写一遍
 * deleteCallbackRelation，漏一处就在关系图里留下指向已不存在组件的悬挂登记，且不报错。
 * 现在由 @screenwright/core 的 ComponentManager.delete 一并完成，本用例钉住这个绑定，
 * 以及注销范围覆盖整棵子树（动态面板各状态里的组件原先是漏网的）。
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
  updateLargeNoCacheScreen: vi.fn().mockResolvedValue({ success: true }),
  updateLayersAgg: vi.fn().mockResolvedValue({ success: true }),
  updateLayersAggNoCache: vi.fn().mockResolvedValue({ success: true }),
  delLayersAgg: vi.fn().mockResolvedValue({ code: 200, success: true }),
  saveLayersAgg: vi.fn().mockResolvedValue({ code: 200, result: {} }),
  getModuleInfo: vi.fn().mockResolvedValue(null),
  copyLayers: vi.fn().mockResolvedValue({ code: 200, result: {} })
}));

vi.mock("@/api/layer", () => ({
  getGroupLayerData: vi.fn().mockResolvedValue(null),
  getLayerInfo: vi.fn().mockResolvedValue(null)
}));

vi.mock("@/api/version", () => ({ uploadGroupLayerInfo: vi.fn().mockResolvedValue({ success: true }) }));
vi.mock("@/utils/service", () => ({ createRequest: vi.fn() }));
vi.mock("@/utils/cacheService", () => ({ createRequest: vi.fn() }));

const base = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  name: `c${id}`,
  title: "条形图",
  component: { prop: "echartstripBar", width: 100, height: 50 },
  left: 0,
  top: 0,
  zIndex: 0,
  display: true,
  option: {},
  data: [],
  events: [],
  cbArgs: [],
  listenArgs: [],
  ...extra
});

/** 抛出方：把值写进回调字段 field */
const thrower = (id: number, field: string) =>
  base(id, { cbArgs: [{ id: `cb-${id}`, value: { origin: { value: "x" }, target: { value: field } } }] });

/** 接收方：监听回调字段 field（openFilter 必须为 true，否则根本不会登记为 target） */
const listener = (id: number, field: string) =>
  base(id, { openFilter: true, listenArgs: [{ callbackFields: [field], filterName: `f-${id}` }] });

const panel = (id: number, states: Array<{ id: string; config: unknown[] }>) =>
  base(id, {
    title: "动态面板",
    component: { prop: "sw-panel", width: 400, height: 300 },
    panelData: states.map((state) => ({
      ...state,
      title: state.id,
      name: state.id,
      backgroundColor: "rgba(24,27,36,0)",
      showBackgroundImage: false,
      backgroundImage: "",
      showScreenAdaptation: false,
      adaptationNorm: "default",
      adaptationType: 2
    })),
    activeStatusId: states[0]?.id
  });

function setup(layers: unknown[]) {
  const { setNavInfo, resetNavInfo } = useLargeScreenInfo();
  const { setGroupData, resetGroupData } = useGlobalComponentData();
  const { resetEditStore, syncGlobalComponentData } = useEditStore();
  const { initCallbackArguments, callbackArgumentsManager, onClear } = useCallbackArguments();

  onClear();
  resetEditStore();
  resetNavInfo();
  resetGroupData();

  const screen = { id: 1234, versionCode: "1", layers };
  setNavInfo(screen as never);
  setGroupData(screen as never);
  syncGlobalComponentData();
  initCallbackArguments(layers as never);

  return { callbackArgumentsManager };
}

describe("删除组件时注销回调关系", () => {
  beforeEach(() => {
    initDataFilterPersistence({ saveLayersByType: vi.fn(), updateLargeScreen: vi.fn() });
  });

  it("删掉抛出方后，它在关系图里的 source 登记消失", async () => {
    const { callbackArgumentsManager } = setup([thrower(1, "fieldA"), listener(2, "fieldA")]);
    const { handleDelComponent } = useAction();
    expect(callbackArgumentsManager.value.fieldA!.source.map((s) => s.id)).toEqual([1]);

    await handleDelComponent(["1"], UpdateHistoryTypeEnum.DELETE, false);

    expect(callbackArgumentsManager.value.fieldA!.source).toEqual([]);
    expect(callbackArgumentsManager.value.fieldA!.target.map((t) => t.id)).toEqual([2]);
  });

  it("两端都删掉之后，整条回调关系被摘掉", async () => {
    const { callbackArgumentsManager } = setup([thrower(1, "fieldA"), listener(2, "fieldA")]);
    const { handleDelComponent } = useAction();

    await handleDelComponent(["1"], UpdateHistoryTypeEnum.DELETE, false);
    await handleDelComponent(["2"], UpdateHistoryTypeEnum.DELETE, false);

    expect(callbackArgumentsManager.value.fieldA).toBeUndefined();
  });

  it("删掉动态面板时，面板各状态里组件的登记一并注销", async () => {
    const { callbackArgumentsManager } = setup([
      thrower(1, "fieldA"),
      panel(200, [
        { id: "s1", config: [listener(201, "fieldA")] },
        { id: "s2", config: [listener(202, "fieldA")] }
      ])
    ]);
    const { handleDelComponent } = useAction();
    expect(callbackArgumentsManager.value.fieldA!.target.map((t) => t.id)).toEqual([201, 202]);

    await handleDelComponent(["200"], UpdateHistoryTypeEnum.DELETE, false);

    expect(callbackArgumentsManager.value.fieldA!.target).toEqual([]);
    // 面板外的抛出方不受影响
    expect(callbackArgumentsManager.value.fieldA!.source.map((s) => s.id)).toEqual([1]);
  });
});
