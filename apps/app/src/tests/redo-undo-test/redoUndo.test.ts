import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enableMapSet, setAutoFreeze } from "immer";

// Enable Immer MapSet plugin for Map/Set support
enableMapSet();
// 与 main.ts 保持一致：关闭 autoFreeze。缓存（useHistoryData 的 updateCacheComponent 等）
// 存入的组件对象与 componentList 中的活引用共享，若不关闭会被 immer 冻结，导致后续
// buildComponentMap 给这些组件补装 parentDynamicPanelId 时因对象不可扩展而抛错。
setAutoFreeze(false);

// 用于在 vi.mock factory 和测试代码之间共享 handleUpdateResponse 引用
// vi.hoisted 保证此变量在 vi.mock factory 执行时已存在
const shared = vi.hoisted(() => ({
  handleUpdate: null as ((data: string, type: unknown) => void) | null,
  handleDelete: null as ((url: string, type: unknown) => void) | null
}));

import { initDataFilterPersistence } from "@screenwright/composables";

import { getLargeScreenInfo } from "@/api/build";
import { updateLargeScreen } from "@/api/library";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useCommandHistory } from "@/views/build/command/useCommandHistory";
import { useHistoryData } from "@/views/build/command/useHistoryData";
import { useConfigBaseAttrs } from "@/views/build/components/buildConfig/components/configBaseAttrs/useConfigBaseAttrs";
import type { UpdateHistoryTypeEnum } from "@/views/build/components/buildRender/hooks/useAction";
import { useAction } from "@/views/build/components/buildRender/hooks/useAction";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { saveLayersByType } from "@/views/build/components/buildRender/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";
import { useResponseHistoryHandler } from "@/views/build/useResponseHistoryHandler";
import { useTabsMenuGroup } from "@/views/build/useTabsMenuGroup";

import componentData4 from "./componentData/4.json";
import componentData69 from "./componentData/69.json";
import componentData75 from "./componentData/75.json";
import componentData102 from "./componentData/102.json";
import componentData138 from "./componentData/138.json";
import largeScreenDataMock from "./largeScreenData.mock.json";

const componentDataMap: Record<string, unknown> = {
  "4": componentData4,
  "69": componentData69,
  "75": componentData75,
  "102": componentData102,
  "138": componentData138
};

const mockOnMounted = vi.fn();
const mockOnBeforeMount = vi.fn();
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
  uuid: vi.fn(() => "mock-uuid-redoundo"),
  handleMessageBox: vi.fn(() => Promise.resolve(true))
}));

vi.mock("@/api/build", () => ({
  getLargeScreenInfo: vi.fn().mockImplementation((id: number) => {
    return Promise.resolve({ result: JSON.parse(JSON.stringify(largeScreenDataMock)) });
  })
}));

vi.mock("@/api/library", () => ({
  getModuleInfo: vi.fn().mockImplementation((id: string) => {
    const data = componentDataMap[id];
    if (data) {
      const response: Record<string, Record<string, string>> = JSON.parse(JSON.stringify(data));
      const randomId = Math.floor(Math.random() * 200000) + 1;
      const config = JSON.parse(response.result.javaScript);
      config.id = randomId;
      response.result.javaScript = JSON.stringify(config);
      return Promise.resolve(response);
    }
    return Promise.resolve(null);
  }),

  // 真实后端把提交上来的 config 原样存下并回传（只换新 id）。
  // 原先只回 { id }，凡是拿回传 config 当组件用的路径（撤销删除分组时的 recreateGroupFn）
  // 都会拿到一个没有 component 字段的空壳，静默失败成「撤销不生效」。
  saveLayersAgg: vi.fn().mockImplementation((data: { config?: string }) => {
    const mockId = Math.floor(Math.random() * 200000) + 1;
    const posted = typeof data?.config === "string" ? JSON.parse(data.config) : {};
    return Promise.resolve({
      success: true,
      result: { config: JSON.stringify({ ...posted, id: mockId }), id: mockId }
    });
  }),

  // 模拟 cacheService 响应拦截器对 layers/update 的处理：
  // 真实拦截器会调用 handleUpdateResponse(response.config.data, updateHistoryType)
  // 这里直接通过 shared 引用转发，避免 axios.create() 实例无法被 MockAdapter 拦截的问题
  updateLayersAgg: vi.fn().mockImplementation((data: unknown, updateHistoryType: unknown) => {
    shared.handleUpdate?.(JSON.stringify(data), updateHistoryType);
    return Promise.resolve({ success: true, code: 200, result: {} });
  }),

  updateLayersAggNoCache: vi.fn().mockResolvedValue({ success: true, code: 200, result: {} }),

  updateLargeScreen: vi.fn().mockResolvedValue({ success: true }),
  getLayerInfo: vi.fn().mockResolvedValue({ success: true, result: {} }),

  // 模拟 cacheService 响应拦截器对 layers/delete 的处理：
  // 真实拦截器会调用 handleDeleteResponse(url, updateHistoryType)
  delLayersAgg: vi.fn().mockImplementation((id: number, updateHistoryType: unknown) => {
    shared.handleDelete?.(`system/layers/delete/${id}`, updateHistoryType);
    return Promise.resolve({ success: true });
  })
}));

vi.mock("@/api/visual", () => ({
  getScreenMeta: vi.fn().mockResolvedValue({
    result: {
      updatedTime: "2026-02-06 10:00:00"
    }
  })
}));

vi.mock("@/utils/service", () => ({
  request: vi.fn()
}));

vi.mock("@/utils/cacheService", () => ({
  requestWithCache: vi.fn()
}));

vi.mock("@/utils/config", () => ({
  BaseName: {
    Online: "online",
    System: "system"
  }
}));

/**
 * Factory: Create test screen data
 * Returns parsed LargeScreeInfo with empty layers for clean slate testing
 */
const makeRedoUndoTestScreenData = async () => {
  const res = await getLargeScreenInfo(27975);
  return res.result;
};

/**
 * Factory: Initialize all stores for redo-undo testing
 * Follows the pattern from group.test.ts with proper state reset
 */
const makeInitializedStoresForRedoUndo = async () => {
  // Get store instances
  const { resetEditStore, componentList, syncGlobalComponentData, setDetail2Config } = useEditStore();
  const { resetNavInfo, setNavInfo } = useLargeScreenInfo();
  const { setGroupData, resetGroupData } = useGlobalComponentData();
  const { clearHistory, updateCacheComponentList } = useHistoryData();
  const { initCallbackArguments, onClear } = useCallbackArguments();

  // Reset all stores to clean state
  onClear();
  resetEditStore();
  resetNavInfo();
  resetGroupData();
  clearHistory();

  // Load and initialize screen data
  const screenData = await makeRedoUndoTestScreenData();
  setNavInfo(screenData);
  setGroupData(screenData);
  setDetail2Config(screenData);
  syncGlobalComponentData();

  // 填充 tabsList，handleUpdateResponse 通过组件 title 在此列表中查找 moduleId
  const { tabsList } = useTabsMenuGroup();
  tabsList.value = [
    { name: "折线柱形图", id: 4 },
    { name: "折线图", id: 69 },
    { name: "柱形图", id: 75 },
    { name: "饼图", id: 102 },
    { name: "地图", id: 138 }
  ] as any;

  // Initialize callback arguments
  initCallbackArguments([]);

  // 初始化缓存为空 Map，使 updateCacheComponent 能正常写入
  updateCacheComponentList(() => new Map());

  return {
    componentList,
    screenData
  };
};

describe("useCommandHistory - 撤销重做功能测试", () => {
  beforeEach(async () => {
    // 注入 @screenwright/composables 的持久化端口（真实 app 由 main.ts 在启动时调用一次），
    // 否则 useDataFilter 的 saveGlobalDataFilter 会因未初始化而抛错
    initDataFilterPersistence({
      saveLayersByType: (component, isDynamicPanel, options) =>
        saveLayersByType(component, isDynamicPanel, options as any),
      updateLargeScreen
    });

    // 将真实的 handleUpdateResponse / handleDeleteResponse 绑定到 shared，供 mock 调用
    const { handleUpdateResponse, handleDeleteResponse } = useResponseHistoryHandler();
    shared.handleUpdate = (data, type) => handleUpdateResponse(data, type as UpdateHistoryTypeEnum);
    shared.handleDelete = (url, type) => handleDeleteResponse(url, type as UpdateHistoryTypeEnum);

    await makeInitializedStoresForRedoUndo();
  });

  afterEach(async () => {
    shared.handleUpdate = null;
    shared.handleDelete = null;
    const { clearHistory } = useCommandHistory();
    clearHistory();

    // Invoke all registered onUnmounted callbacks to clean up reactive effects/watchers,
    // preventing async operations from accessing document after jsdom teardown
    for (const [fn] of mockOnUnmounted.mock.calls) {
      try {
        fn();
      } catch {}
    }

    const { nextTick } = await import("vue");
    await nextTick();

    mockOnUnmounted.mockClear();
    mockOnMounted.mockClear();
    mockOnBeforeMount.mockClear();
    mockInject.mockClear();
  });

  describe("组件添加的撤销重做", () => {
    it("创建一个组件, 预期componentList长度为1", async () => {
      const { addComponentList } = useAction();
      const { componentList } = useEditStore();

      await addComponentList({ moduleId: 4 });

      expect(componentList.value.length).toBe(1);

      await addComponentList({ moduleId: 4 });
      expect(componentList.value.length).toBe(2);

      const echart1 = componentList.value[0];
      const echart2 = componentList.value[1];

      expect(echart1.id).not.toBe(echart2.id);
    });

    it("创建一个组件，并创建一个添加的命令", async () => {
      const { addComponentList } = useAction();
      const { commandManager } = useHistoryData();
      const { componentList } = useEditStore();

      // updateLayersAgg mock 会通过 shared.handleUpdate 自动调用 handleUpdateResponse
      await addComponentList({ moduleId: 4 });

      expect(componentList.value.length).toBe(1);
      expect(commandManager.getUndoStackSize()).toBe(1);
    });

    it("新增一个组件再删除，历史记录正确", async () => {
      const { addComponentList, handleDelComponent } = useAction();
      const { commandManager } = useHistoryData();
      const { componentList } = useEditStore();
      const { batchCreateDeleteComponentsCommand } = useCommandHistory();

      // 1. 添加组件
      await addComponentList({ moduleId: 4 });
      expect(componentList.value.length).toBe(1);
      expect(commandManager.getUndoStackSize()).toBe(1);

      const componentId = String(componentList.value[0].id);

      // 2. 删除组件（showConfirm=false 跳过确认框）
      await handleDelComponent(componentId, undefined, false);

      // 删除走防抖批处理，手动 flush 立即执行
      batchCreateDeleteComponentsCommand.flush();

      // 3. 验证：组件已删除，历史记录包含 add + delete 两条命令
      expect(componentList.value.length).toBe(0);
      expect(commandManager.getUndoStackSize()).toBe(2);
      expect(commandManager.getRedoStackSize()).toBe(0);
    });

    it("组件新增的撤销与重做", async () => {
      const { addComponentList } = useAction();
      const { commandManager } = useHistoryData();
      const { componentList } = useEditStore();

      // 1. 添加组件
      await addComponentList({ moduleId: 4 });
      expect(componentList.value.length).toBe(1);
      expect(commandManager.getUndoStackSize()).toBe(1);
      expect(commandManager.getRedoStackSize()).toBe(0);

      // 记录原始组件属性（排除 id）
      const original = componentList.value[0];
      const { id: _originalId, ...originalProps } = original;

      // 2. 撤销添加 → 组件被移除
      await commandManager.undo();
      expect(componentList.value.length).toBe(0);
      expect(commandManager.getUndoStackSize()).toBe(0);
      expect(commandManager.getRedoStackSize()).toBe(1);

      // 3. 重做添加 → 组件恢复
      await commandManager.redo();
      expect(componentList.value.length).toBe(1);
      expect(commandManager.getUndoStackSize()).toBe(1);
      expect(commandManager.getRedoStackSize()).toBe(0);

      // 重做后组件 id 不同，但其余属性一致
      const restored = componentList.value[0];
      expect(restored.id).not.toBe(original.id);
      const { id: _restoredId, ...restoredProps } = restored;
      expect(restoredProps).toEqual(originalProps);
    });

    it("组件删除的撤销与重做", async () => {
      const { addComponentList, handleDelComponent } = useAction();
      const { commandManager } = useHistoryData();
      const { componentList } = useEditStore();
      const { batchCreateDeleteComponentsCommand } = useCommandHistory();

      // 1. 添加组件
      await addComponentList({ moduleId: 4 });
      expect(componentList.value.length).toBe(1);

      // 记录添加后的组件属性（排除 id，因为撤销删除重新添加时 id 会变）
      const added = componentList.value[0];
      const { id: _addedId, ...addedProps } = added;

      // 2. 删除组件
      const componentId = String(componentList.value[0].id);
      await handleDelComponent(componentId, undefined, false);
      batchCreateDeleteComponentsCommand.flush();
      expect(componentList.value.length).toBe(0);
      expect(commandManager.getUndoStackSize()).toBe(2); // add + delete
      expect(commandManager.getRedoStackSize()).toBe(0);

      // 3. 撤销删除 → 组件恢复
      await commandManager.undo();
      expect(componentList.value.length).toBe(1);
      expect(commandManager.getUndoStackSize()).toBe(1);
      expect(commandManager.getRedoStackSize()).toBe(1);

      // 撤销后组件 id 不同，但其余属性一致
      const restored = componentList.value[0];
      expect(restored.id).not.toBe(added.id);
      const { id: _restoredId, ...restoredProps } = restored;
      expect(restoredProps).toEqual(addedProps);

      // 4. 重做删除 → 组件再次被删除
      await commandManager.redo();
      expect(componentList.value.length).toBe(0);
      expect(commandManager.getUndoStackSize()).toBe(2);
      expect(commandManager.getRedoStackSize()).toBe(0);
    });
  });

  describe("组合的撤销重做", () => {
    it("handleGroup 组合两个组件, 撤销栈只新增一条创建分组命令", async () => {
      const { addComponentList, handleGroup } = useAction();
      const { commandManager } = useHistoryData();
      const { componentList, setTargetSelectChart } = useEditStore();
      const { batchCreateUpdateComponentsCommand } = useCommandHistory();

      await addComponentList({ moduleId: 4 });
      await addComponentList({ moduleId: 4 });
      // 组合前已有两条 add 命令
      const sizeBeforeGroup = commandManager.getUndoStackSize();
      expect(sizeBeforeGroup).toBe(2);

      // 选中两个组件并组合（成员的 /layers/update 全部走 SKIP，不应产生额外命令）
      const [c1, c2] = componentList.value;
      setTargetSelectChart([`${c1.id}`, `${c2.id}`]);
      await handleGroup();
      // flush 防御：确认批量更新队列里没有遗留的 UpdateComponentCommand
      batchCreateUpdateComponentsCommand.flush();

      // 组合这一步只新增一条 ToggleGroupCommand，而不是两条
      expect(commandManager.getUndoStackSize()).toBe(sizeBeforeGroup + 1);
    });

    it("handleGroup 组合后, 分组容器写入 cacheComponentList", async () => {
      const { addComponentList, handleGroup } = useAction();
      const { componentList, setTargetSelectChart } = useEditStore();
      const { cacheComponentList } = useHistoryData();

      await addComponentList({ moduleId: 4 });
      await addComponentList({ moduleId: 4 });
      const [c1, c2] = componentList.value;
      setTargetSelectChart([`${c1.id}`, `${c2.id}`]);
      await handleGroup();

      // 组合后成员被移除、分组容器入列，且分组含两个成员
      expect(componentList.value.length).toBe(1);
      const group = componentList.value[0];
      expect(group.children?.length).toBe(2);
      // 修复核心：分组容器进入缓存，后续对其 UPDATE 才能在 handleUpdateResponse 命中 oldComponent
      expect(cacheComponentList.value?.has(`${group.id}`)).toBe(true);
    });

    it("handleGroup 组合后, 对分组容器的 UPDATE 能记录历史", async () => {
      const { addComponentList, handleGroup, updateComponentLayers } = useAction();
      const { componentList, setTargetSelectChart } = useEditStore();
      const { commandManager } = useHistoryData();
      const { batchCreateUpdateComponentsCommand } = useCommandHistory();

      await addComponentList({ moduleId: 4 });
      await addComponentList({ moduleId: 4 });
      const [c1, c2] = componentList.value;
      setTargetSelectChart([`${c1.id}`, `${c2.id}`]);
      await handleGroup();
      const sizeAfterGroup = commandManager.getUndoStackSize();

      const group = componentList.value[0];
      // fullUpdateGroup:false 只更新分组容器本身（不触达 children），单独验证容器本身能记录历史
      await updateComponentLayers(group, { fullUpdateGroup: false });
      batchCreateUpdateComponentsCommand.flush();

      // 修复前 group 不在缓存，handleUpdateResponse 会因找不到 oldComponent 直接 return，
      // 不会记录历史；修复后命中 oldComponent，新增一条 UpdateComponentCommand
      expect(commandManager.getUndoStackSize()).toBe(sizeAfterGroup + 1);
    });

    it("组合后选中分组, 配置面板 initConstraint 初始化约束不压入历史", async () => {
      const { effectScope, nextTick } = await import("vue");
      const scope = effectScope();
      try {
        // 挂载配置面板 composable，注册 watch(selectTargetData)：选中变化会触发 initConstraint
        scope.run(() => useConfigBaseAttrs());

        const { addComponentList, handleGroup } = useAction();
        const { commandManager } = useHistoryData();
        const { componentList, setTargetSelectChart } = useEditStore();
        const { batchCreateUpdateComponentsCommand } = useCommandHistory();

        await addComponentList({ moduleId: 4 });
        await addComponentList({ moduleId: 4 });
        const [c1, c2] = componentList.value;
        setTargetSelectChart([`${c1.id}`, `${c2.id}`]);
        await handleGroup();
        // 让选中变化引发的 watch（initConstraint）跑完
        await nextTick();
        batchCreateUpdateComponentsCommand.flush();

        // initConstraint 走 SKIP，不应压入 UpdateComponentCommand；撤销栈只有两条 add + 一条创建分组。
        // 修复前这里会多出一条无感的组件更新，导致组合后需撤销两次、且第一次无视觉变化。
        expect(commandManager.getUndoStackSize()).toBe(3);
      } finally {
        scope.stop();
      }
    });

    it("handleGroup 组合后撤销, 成员原 id 提升回顶层; 重做重新建组", async () => {
      const { addComponentList, handleGroup } = useAction();
      const { componentList, setTargetSelectChart } = useEditStore();
      const { commandManager } = useHistoryData();
      const { batchCreateUpdateComponentsCommand } = useCommandHistory();

      await addComponentList({ moduleId: 4 });
      await addComponentList({ moduleId: 4 });
      // 记录两个成员原始 id：解组时成员用原 id 提升回顶层；重做建组后成员 id 仍不变（仅分组容器换新 id）
      const memberIds = componentList.value.map((c) => `${c.id}`);

      const [c1, c2] = componentList.value;
      setTargetSelectChart([`${c1.id}`, `${c2.id}`]);
      await handleGroup();
      batchCreateUpdateComponentsCommand.flush();

      // 组合后：只剩分组容器，含两个成员
      expect(componentList.value.length).toBe(1);
      const group = componentList.value[0];
      expect(group.children?.length ?? 0).toBe(2);
      const undoSizeAfterGroup = commandManager.getUndoStackSize();

      // 撤销：成员原 id 提升回顶层，分组容器消失
      await commandManager.undo();
      expect(componentList.value.length).toBe(2);
      expect(componentList.value.map((c) => `${c.id}`).sort()).toEqual([...memberIds].sort());
      expect(commandManager.getUndoStackSize()).toBe(undoSizeAfterGroup - 1);
      expect(commandManager.getRedoStackSize()).toBe(1);

      // 重做：分组重建（新 id），成员再次被收入分组
      await commandManager.redo();
      expect(componentList.value.length).toBe(1);
      const regrouped = componentList.value[0];
      expect(regrouped.children?.length ?? 0).toBe(2);
      // 重做建组产生新的分组容器 id，但成员仍是原 id
      expect(`${regrouped.id}`).not.toBe(`${group.id}`);
      expect(regrouped.children?.map((c) => `${c.id}`).sort()).toEqual([...memberIds].sort());
      expect(commandManager.getUndoStackSize()).toBe(undoSizeAfterGroup);
      expect(commandManager.getRedoStackSize()).toBe(0);
    });
  });

  /**
   * 结构化撤销里「删除」这一支的两条命令：删整个分组、删分组里的一个成员。
   * 快照在删除前拍、命令在级联副作用后压（见 useComponentDeleteActions.beginUndoRecord），
   * 此前没有用例覆盖——把 beginUndoRecord 改成恒不记录，整个测试套件依然全绿。
   */
  describe("分组删除的撤销重做", () => {
    /** 建一个含 memberCount 个成员的分组并返回它 */
    const makeGroup = async (memberCount: number) => {
      const { addComponentList, handleGroup } = useAction();
      const { componentList, setTargetSelectChart } = useEditStore();
      const { batchCreateUpdateComponentsCommand } = useCommandHistory();

      for (let i = 0; i < memberCount; i++) {
        await addComponentList({ moduleId: 4 });
      }
      setTargetSelectChart(componentList.value.map((c) => `${c.id}`));
      await handleGroup();
      batchCreateUpdateComponentsCommand.flush();

      return componentList.value[0];
    };

    it("删除分组后撤销, 分组与成员一起回来; 重做再次删除", async () => {
      const { handleDelComponent } = useAction();
      const { componentList } = useEditStore();
      const { commandManager } = useHistoryData();
      const { batchCreateDeleteComponentsCommand } = useCommandHistory();

      const group = await makeGroup(2);
      expect(group.children?.length ?? 0).toBe(2);
      const undoSizeAfterGroup = commandManager.getUndoStackSize();

      await handleDelComponent(`${group.id}`, undefined, false);
      batchCreateDeleteComponentsCommand.flush();
      expect(componentList.value.length).toBe(0);
      // 删分组压入一条 DeleteGroupCommand（而不是走清空历史兜底）
      expect(commandManager.getUndoStackSize()).toBe(undoSizeAfterGroup + 1);

      // 撤销：分组容器与两个成员一起重建（均为新 id）
      await commandManager.undo();
      expect(componentList.value.length).toBe(1);
      expect(componentList.value[0].children?.length ?? 0).toBe(2);
      expect(commandManager.getRedoStackSize()).toBe(1);

      // 重做：整组再次删掉
      await commandManager.redo();
      expect(componentList.value.length).toBe(0);
      expect(commandManager.getUndoStackSize()).toBe(undoSizeAfterGroup + 1);
    });

    it("删掉分组的一个成员后撤销, 成员回到分组; 重做再次删除", async () => {
      const { handleDelComponent } = useAction();
      const { componentList } = useEditStore();
      const { commandManager } = useHistoryData();
      const { batchCreateDeleteComponentsCommand } = useCommandHistory();

      // 三个成员：删掉一个之后仍剩两个，分组不会自动解散，才落在可精细撤销的范围内
      const group = await makeGroup(3);
      expect(group.children?.length ?? 0).toBe(3);
      const undoSizeAfterGroup = commandManager.getUndoStackSize();

      const victimId = `${group.children![0].id}`;
      await handleDelComponent(victimId, undefined, false);
      batchCreateDeleteComponentsCommand.flush();
      expect(componentList.value.length).toBe(1);
      expect(componentList.value[0].children?.length ?? 0).toBe(2);
      // 删成员压入一条 RemoveGroupMemberCommand
      expect(commandManager.getUndoStackSize()).toBe(undoSizeAfterGroup + 1);

      // 撤销：成员以新 id 回到原分组
      await commandManager.undo();
      expect(componentList.value.length).toBe(1);
      expect(componentList.value[0].children?.length ?? 0).toBe(3);

      // 重做：成员再次被摘掉
      await commandManager.redo();
      expect(componentList.value[0].children?.length ?? 0).toBe(2);
    });
  });
});
