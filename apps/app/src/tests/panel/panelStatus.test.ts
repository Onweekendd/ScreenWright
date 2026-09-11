import { beforeEach, describe, expect, it, vi } from "vitest";

import { computed, ref } from "vue";

import { initDataFilterPersistence } from "@screenwright/composables";

import { copyLayers, delLayersAgg } from "@/api/library";
import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { useCommonPanelAction } from "@/views/build/components/buildRender/hooks/useCommonPanelAction";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import type { PanelInfo } from "@/views/build/components/common/useCommonPanelData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

/**
 * 动态面板「状态」增删复制的特征化测试。
 *
 * 这批操作原先零覆盖。panelData 数组的增删改由 @screenwright/core 的 PanelManager 承担之后，
 * 需要有东西钉住两件事：
 *   1. 改动落在 layers 里那个真正的面板节点上（而不是某个脱钩的临时数组）；
 *   2. 新状态的字段约定、副本的命名规则、删除后的 activeStatusId 兜底都没变。
 * 断言的是行为不是实现，后续继续往 core 搬时仍然有效。
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

// 只替换删除确认框，其余工具函数（uuid 等）保持真身
vi.mock("@/utils/utils", async () => ({
  ...((await vi.importActual("@/utils/utils")) as any),
  handleMessageBox: vi.fn().mockResolvedValue(true)
}));

vi.mock("@/api/library", () => ({
  updateLargeScreen: vi.fn().mockResolvedValue({ success: true }),
  updateLayersAgg: vi.fn().mockResolvedValue({ success: true }),
  updateLayersAggNoCache: vi.fn().mockResolvedValue({ success: true }),
  delLayersAgg: vi.fn().mockResolvedValue({ code: 200, success: true }),
  saveLayersAgg: vi.fn().mockResolvedValue({ code: 200, result: {} }),
  getModuleInfo: vi.fn().mockResolvedValue(null),
  getGroupLayerData: vi.fn().mockResolvedValue(null),
  getLayerInfo: vi.fn().mockResolvedValue(null),
  // 复制组件：服务端分配新 id（这里固定 +1000），core 绝不自己造 id
  copyLayers: vi.fn().mockImplementation((id: number) =>
    Promise.resolve({
      code: 200,
      result: {
        config: JSON.stringify({
          id: id + 1000,
          name: `copy-of-${id}`,
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
          children: []
        })
      }
    })
  ),
  uploadGroupLayerInfo: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock("@/utils/service", () => ({ createRequest: vi.fn() }));
vi.mock("@/utils/cacheService", () => ({ createRequest: vi.fn() }));

const leaf = (id: number) => ({
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
 *   200 动态面板 ── 状态 s1（含条形图 9）/ 状态 s2（空）
 */
const makeScreen = () => ({
  id: 1234,
  versionCode: "1",
  layers: [
    {
      id: 200,
      name: "p200",
      title: "动态面板",
      component: { prop: "sw-panel", width: 400, height: 300 },
      left: 0,
      top: 0,
      zIndex: 0,
      display: true,
      option: {},
      data: [],
      events: [],
      cbArgs: [],
      listenArgs: [],
      panelData: [panelState("s1", [leaf(9)]), panelState("s2")],
      activeStatusId: "s1"
    }
  ]
});

/** 面板编辑态：panelInfo.config 指向 layers 里那个面板节点（活引用，与线上一致） */
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

  const panel = allComponentMap.value.get("200")!;
  const panelInfo = ref({ config: panel } as unknown as PanelInfo);
  const activeStatusId = ref("s1");
  const panelData = computed(() => panelInfo.value.config.panelData ?? []) as unknown as {
    value: PanelState[];
  };

  const action = useCommonPanelAction({
    panelInfo,
    activeStatusId,
    panelData: panelData as never
  });

  /** 直接从 layers 上读，确保断言的是树里那份而不是测试自己攥着的引用 */
  const statesInTree = () => (allComponentMap.value.get("200") as any).panelData as PanelState[];

  return { action, activeStatusId, statesInTree };
}

describe("动态面板状态操作", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 注入 @screenwright/composables 的持久化端口（真实 app 由 main.ts 在启动时调用一次），
    // 否则复制状态时联动的筛选器保存会因未初始化而抛错
    initDataFilterPersistence({
      saveLayersByType: vi.fn(),
      updateLargeScreen: vi.fn()
    });
  });

  describe("addPanelStatus", () => {
    it("不传参数时追加到末尾，字段按 core 的约定生成", async () => {
      const { action, statesInTree } = setup();

      const created = await action.addPanelStatus();

      expect(statesInTree().map((s) => s.id)).toEqual(["s1", "s2", created.id]);
      expect(created.name).toBe("状态3");
      expect(created.title).toBe("状态3");
      expect(created.config).toEqual([]);
      expect(created.backgroundColor).toBe("rgba(24,27,36,0)");
      expect(created.adaptationType).toBe(2);
    });

    it("显式传下标时按下标寻址，越过的位置留空（Figma 批量导入依赖这个语义）", async () => {
      const { action, statesInTree } = setup();

      const created = await action.addPanelStatus(3);

      expect(statesInTree()).toHaveLength(4);
      expect(statesInTree()[3].id).toBe(created.id);
      expect(statesInTree()[2]).toBeUndefined();
    });
  });

  describe("onStatusDelete", () => {
    it("摘掉状态、硬删其子组件，并把激活态兜底到剩下的第一个", async () => {
      const { action, activeStatusId, statesInTree } = setup();

      await action.onStatusDelete(statesInTree()[0]);

      expect(statesInTree().map((s) => s.id)).toEqual(["s2"]);
      expect(delLayersAgg).toHaveBeenCalledWith(9, expect.anything());
      expect(activeStatusId.value).toBe("s2");
    });

    it("删光之后激活态清空", async () => {
      const { action, activeStatusId, statesInTree } = setup();

      await action.onStatusDelete(statesInTree()[0]);
      activeStatusId.value = "s2";
      await action.onStatusDelete(statesInTree()[0]);

      expect(statesInTree()).toEqual([]);
      expect(activeStatusId.value).toBe("");
    });
  });

  describe("onStatusCopy", () => {
    it("副本追加到末尾、名字加「-副本」、子组件用服务端发的新 id", async () => {
      const { action, activeStatusId, statesInTree } = setup();

      await action.onStatusCopy(statesInTree()[0]);

      const states = statesInTree();
      expect(states.map((s) => s.name)).toEqual(["s1", "s2", "s1-副本"]);
      expect(copyLayers).toHaveBeenCalledWith(9, true, true, expect.anything());
      // core 不克隆 id：config 里必须是接口回来的那个新 id
      expect(states[2].config.map((c: any) => c.id)).toEqual([1009]);
      expect(states[2].id).not.toBe("s1");
      // 源状态不受影响
      expect(states[0].config.map((c: any) => c.id)).toEqual([9]);
      expect(activeStatusId.value).toBe(states[2].id);
    });

    it("源状态样式沿用，但状态 id 换新", async () => {
      const { action, statesInTree } = setup();
      statesInTree()[0].backgroundColor = "rgba(1,2,3,1)";

      await action.onStatusCopy(statesInTree()[0]);

      expect(statesInTree()[2].backgroundColor).toBe("rgba(1,2,3,1)");
      expect(statesInTree()[2].id).not.toBe(statesInTree()[0].id);
    });
  });
});
