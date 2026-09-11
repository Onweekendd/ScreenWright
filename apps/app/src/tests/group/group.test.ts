import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initDataFilterPersistence } from "@screenwright/composables";
import dayjs from "dayjs";

import { getLargeScreenInfo } from "@/api/build";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { UpdateHistoryTypeEnum, useAction } from "@/views/build/components/buildRender/hooks/useAction";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useTree } from "@/views/build/components/buildSiderbar/useTree";
import { useCacheData } from "@/views/build/useCacheData";
import { useCacheTime } from "@/views/build/useCacheTime";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useDataFilter } from "../../views/build/useDataFilter";
import { useLargeScreenInfo } from "../../views/build/useLargeScreenInfo";
/**
 * 一个动态面板(2019412 )
 * 前五个状态是 每个状态9个条形图
 * 第六个状态含一个动态面板(2019458) 包含两个状态 每个状态9个条形图
 *
 */
import mockDetail from "./componentData.mock.json";
import groupSaveJson from "./groupSave.mock.json";
import groupTemplateJson from "./groupTemplate.json";

// 模拟Vue的组件生命周期
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

// 固定化 uuid，避免用例受随机值影响
vi.mock("@/utils/utils", () => ({
  uuid: vi.fn(() => "mock-uuid-1234"),
  handleMessageBox: vi.fn(() => Promise.resolve(true))
}));

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

  delLayersAgg: vi.fn().mockResolvedValue({ success: true }),

  // mock getModuleInfo 接口
  getModuleInfo: vi.fn().mockImplementation((id: string) => {
    if (id === "75") {
      // 每次返回带有随机 id 的深拷贝
      const response = JSON.parse(JSON.stringify(groupTemplateJson));
      const randomId = Math.floor(Math.random() * 200000) + 1;
      const config = JSON.parse(response.result.javaScript);
      config.id = randomId;
      response.result.javaScript = JSON.stringify(config);
      return Promise.resolve(response);
    }
    return Promise.resolve(null);
  }),

  // mock saveLayersAgg 接口
  saveLayersAgg: vi.fn().mockImplementation((data: any) => {
    if (data.moduleId === 75) {
      // 每次返回带有随机 id 的深拷贝
      const response = JSON.parse(JSON.stringify(groupSaveJson));
      const randomId = Math.floor(Math.random() * 200000) + 1;
      const config = JSON.parse(response.result.config);
      config.id = randomId;
      response.result.config = JSON.stringify(config);
      response.result.id = randomId;
      return Promise.resolve(response);
    }
    return Promise.resolve({ success: true });
  })
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
  }
}));

// 在这里 mock 一个可以检查调用次数的函数
// 使用 Vitest 的 vi.fn() 实现，并导出以便测试中使用
export const mockFnWithCallCount = vi.fn();
export const mockFnWithCallCount2 = vi.fn();

/**
 * 工厂函数：创建测试用大屏数据
 */
const makeLargeScreenData = async () => {
  const res = await getLargeScreenInfo(23595);
  return res.result;
};

/**
 * 工厂函数：初始化所有测试依赖的 store 状态
 */
const makeInitializedStores = async () => {
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

  const screenData = await makeLargeScreenData();
  setNavInfo(screenData);
  setGroupData(screenData);
  setDetail2Config(screenData);
  initCallbackArguments(groupData.value);
  cloneDataFilterOnInit();
  lastCacheTime.value = dayjs("2025-08-26 10:00:00").valueOf();

  return { groupData };
};

/**
 * 工厂函数：获取测试用的组件实例
 */
const makeTestComponents = () => {
  const { groupData } = useGlobalComponentData();
  return {
    echart1: groupData.value[0],
    echart2: groupData.value[1],
    echart3: groupData.value[2],
    echart4: groupData.value[3],
    echart5: groupData.value[4]
  };
};

describe("useTree - 分组功能测试", () => {
  beforeEach(async () => {
    // 删除路径会走 updateFilterOnComponentDeleted，未注入持久化实现时它会抛
    initDataFilterPersistence({ saveLayersByType: vi.fn(), updateLargeScreen: vi.fn() });
    await makeInitializedStores();
  });

  afterEach(() => {
    const { buildWorkerCacheInput } = useCacheData();
    const workerCacheInput = buildWorkerCacheInput(Date.now());
    structuredClone(workerCacheInput);
    mockFnWithCallCount.mockReset();
  });

  describe("分组创建", () => {
    it("handleGroup given 两个组件 selected, 创建分组并包含这两个组件", async () => {
      // Arrange
      const { groupData } = useGlobalComponentData();
      const { componentList, syncGlobalComponentData, setTargetSelectChart } = useEditStore();
      const { handleGroup } = useAction();

      expect(componentList.value.length, "初始组件列表应该为空").toBe(0);

      // Act
      syncGlobalComponentData();
      const { echart1, echart2 } = makeTestComponents();
      setTargetSelectChart([`${echart1.id}`, `${echart2.id}`]);
      const groupItem = await handleGroup();

      // Assert
      expect(groupData.value.length, "初始分组数据应该包含4个组件").toBe(4);
      syncGlobalComponentData();
      expect(componentList.value.length, "同步全局组件数据后应该有4个组件").toBe(4);

      expect(echart1.left, "echart1的left位置应该为0").toBe(0);
      expect(echart1.top, "echart1的top位置应该为0").toBe(600);
      expect(echart1.component.width, "echart1的组件宽度应该为600").toBe(600);
      expect(echart1.component.height, "echart1的组件高度应该为300").toBe(300);
      expect(echart1.width, "echart1的width属性应该未定义").toBeUndefined();
      expect(echart1.height, "echart1的height属性应该未定义").toBeUndefined();

      expect(echart2.left, "echart2的left位置应该为0").toBe(0);
      expect(echart2.top, "echart2的top位置应该为0").toBe(0);
      expect(echart2.component.width, "echart2的组件宽度应该为600").toBe(600);
      expect(echart2.component.height, "echart2的组件高度应该为300").toBe(300);
      expect(echart2.width, "echart2的width属性应该未定义").toBeUndefined();
      expect(echart2.height, "echart2的height属性应该未定义").toBeUndefined();

      expect(groupItem, "分组项应该被定义").toBeDefined();
      expect(groupItem!.left, "分组项的left位置应该为0").toBe(0);
      expect(groupItem!.top, "分组项的top位置应该为0").toBe(0);
      expect(groupItem!.component.width, "分组项的组件宽度应该为600").toBe(600);
      expect(groupItem!.component.height, "分组项的组件高度应该为900").toBe(900);
      expect(groupItem!.width, "分组项的width属性应该未定义").toBeUndefined();
      expect(groupItem!.height, "分组项的height属性应该未定义").toBeUndefined();

      expect(groupItem!.children, "分组项的子组件应该被定义").toBeDefined();
      expect(groupItem!.children, "分组项应该包含2个子组件").toHaveLength(2);

      // 按 zIndex 从大到小排序来验证，不依赖选中顺序
      const sortedChildren = groupItem!.children!.sort((a, b) => b.zIndex - a.zIndex);
      const sortedIds = sortedChildren.map((c) => c.id);
      expect(sortedIds).toContain(echart1.id);
      expect(sortedIds).toContain(echart2.id);

      // 成员的 parent 必须指向新分组：这项记账已下沉到 @screenwright/core 的 ComponentManager.group，
      // 漏掉的话组件仍在 children 里、落盘也正常，但删除/移动时反查不到所属容器
      expect(
        sortedChildren.map((c) => c.parent),
        "成员的 parent 应指向新分组"
      ).toEqual([groupItem!.id, groupItem!.id]);

      // 成员已被移入分组，不再留在画布顶层
      expect(
        componentList.value.some((c) => c.id === echart1.id || c.id === echart2.id),
        "成员不应再留在画布顶层"
      ).toBe(false);

      expect(componentList.value.length, "分组后组件列表应该包含2个组件").toBe(4);
    });
  });

  describe("分组操作", () => {
    it("updateLocalData given 往现有分组添加组件, 更新分组尺寸和子组件列表", async () => {
      // Arrange
      const { componentList, syncGlobalComponentData, setTargetSelectChart } = useEditStore();
      const { updateLocalData, processPendingUpdates } = useTree();
      const { handleGroup } = useAction();

      // Act
      syncGlobalComponentData();
      const { echart1, echart2, echart3 } = makeTestComponents();
      setTargetSelectChart([`${echart1.id}`, `${echart2.id}`]);
      const groupItem = await handleGroup();

      if (!groupItem) {
        throw new Error("groupItem is undefined");
      }

      updateLocalData(`${groupItem.id}`, [echart1, echart2, echart3]);

      // Assert
      expect(groupItem.left, "分组项的left位置应该为0").toBe(0);
      expect(groupItem.top).toBe(0);
      expect(groupItem.component.width, "分组项的组件宽度应该为1200").toBe(1200);
      expect(groupItem.component.height, "分组项的组件高度应该为900").toBe(900);
      expect(groupItem.width, "分组项的width属性应该未定义").toBeUndefined();
      expect(groupItem.height, "分组项的height属性应该未定义").toBeUndefined();
      expect(groupItem.children, "分组项的子组件应该包含3个组件").toHaveLength(3);

      updateLocalData(undefined, [groupItem]);
      processPendingUpdates();

      expect(componentList.value.length, "把echart3添加到分组中后，组件列表应该包含1个组件").toBe(1);
      expect(componentList.value[0], "组件列表的第一个组件应该是分组").toEqual(groupItem);
      expect(echart3.parent, "echart3的父组件应该是分组").toBe(groupItem.id);
    });

    it("updateLocalData given 从分组拖出组件, 更新分组和组件列表", async () => {
      // Arrange
      const { componentList, syncGlobalComponentData, setTargetSelectChart } = useEditStore();
      const { updateLocalData, processPendingUpdates } = useTree();
      const { handleGroup } = useAction();

      // Act
      syncGlobalComponentData();
      const { echart1, echart2, echart3 } = makeTestComponents();
      setTargetSelectChart([`${echart1.id}`, `${echart2.id}`, `${echart3.id}`]);
      const groupItem = await handleGroup();

      if (!groupItem) {
        throw new Error("groupItem is undefined");
      }

      expect(groupItem.left, "分组项的left位置应该为0").toBe(0);
      expect(groupItem.top).toBe(0);
      expect(groupItem.component.width, "分组项的组件宽度应该为1200").toBe(1200);
      expect(groupItem.component.height, "分组项的组件高度应该为900").toBe(900);
      expect(groupItem.width, "分组项的width属性应该未定义").toBeUndefined();
      expect(groupItem.height, "分组项的height属性应该未定义").toBeUndefined();
      expect(groupItem.children, "分组项的子组件应该包含3个组件").toHaveLength(3);

      // 拖出echart3
      updateLocalData(undefined, [groupItem, echart3]);
      updateLocalData(`${groupItem.id}`, [echart1, echart2]);
      processPendingUpdates();

      // Assert
      expect(componentList.value.length, "拖出echart3后，组件列表应该包含2个组件").toBe(2);
      expect(componentList.value[0], "组件列表的第一个组件应该是分组").toEqual(groupItem);
      expect(componentList.value[1], "组件列表的第二个组件应该是echart3").toEqual(echart3);
      expect(echart3.parent, "echart3的父组件应该是undefined").toBeUndefined();
      expect(groupItem.children, "分组项的子组件应该包含2个组件").toHaveLength(2);

      // 按 zIndex 从大到小排序验证
      const sortedChildren2 = groupItem.children!.sort((a, b) => b.zIndex - a.zIndex);
      const childrenIds = sortedChildren2.map((c) => c.id);
      expect(childrenIds).toContain(echart1.id);
      expect(childrenIds).toContain(echart2.id);
    });
  });

  describe("分组完整流程", () => {
    it("完整分组流程 given 多次拖拽操作, 正确维护组件关系", async () => {
      // Arrange
      const { componentList, syncGlobalComponentData, setTargetSelectChart } = useEditStore();
      const { updateLocalData, processPendingUpdates } = useTree();
      const { handleGroup } = useAction();

      // Act - 步骤1: 将两个组件添加为分组
      syncGlobalComponentData();
      const { echart1, echart2, echart3 } = makeTestComponents();
      setTargetSelectChart([`${echart1.id}`, `${echart2.id}`]);
      const groupItem = await handleGroup();

      if (!groupItem) {
        throw new Error("初始分组创建失败");
      }

      // Assert - 步骤1
      expect(componentList.value.length, "步骤1后：组件列表应该包含2个组件（分组+echart3）").toBe(4);
      expect(groupItem.children, "步骤1后：分组应该包含2个子组件").toHaveLength(2);
      const sorted1 = groupItem.children!.sort((a, b) => b.zIndex - a.zIndex);
      const ids1 = sorted1.map((c) => c.id);
      expect(ids1).toContain(echart1.id);
      expect(ids1).toContain(echart2.id);
      expect(groupItem.left, "步骤1后：分组的left位置应该是0").toBe(0);
      expect(groupItem.top, "步骤1后：分组的top位置应该是0").toBe(0);
      expect(groupItem.component.width, "步骤1后：分组的宽度应该是600").toBe(600);
      expect(groupItem.component.height, "步骤1后：分组的高度应该是900").toBe(900);

      // Act - 步骤2: 把echart3拖入分组
      updateLocalData(`${groupItem.id}`, [echart1, echart2, echart3]);
      updateLocalData(undefined, [
        Object.assign({}, groupItem, {
          children: [...groupItem.children!, echart3]
        })
      ]);
      processPendingUpdates();

      // Assert - 步骤2
      expect(componentList.value.length, "步骤2后：组件列表应该只包含1个组件（分组）").toBe(1);
      expect(groupItem.children, "步骤2后：分组应该包含3个子组件").toHaveLength(3);
      expect(echart3.parent, "步骤2后：echart3的父组件应该是分组").toBe(groupItem.id);
      expect(groupItem.left, "步骤2后：分组的left位置应该是0").toBe(0);
      expect(groupItem.top, "步骤2后：分组的top位置应该是0").toBe(0);
      expect(groupItem.component.width, "步骤2后：分组的宽度应该是1200").toBe(1200);
      expect(groupItem.component.height, "步骤2后：分组的高度应该是900").toBe(900);

      // Act - 步骤3: 把echart3拖出分组
      updateLocalData(undefined, [groupItem, echart3]);
      updateLocalData(`${groupItem.id}`, [echart1, echart2]);
      processPendingUpdates();

      // Assert - 步骤3
      expect(componentList.value.length, "步骤3后：组件列表应该包含2个组件（分组+echart3）").toBe(2);
      expect(componentList.value[0], "步骤3后：第一个组件应该是分组").toEqual(groupItem);
      expect(componentList.value[1], "步骤3后：第二个组件应该是echart3").toEqual(echart3);
      expect(echart3.parent, "步骤3后：echart3的父组件应该是undefined").toBeUndefined();
      expect(groupItem.children, "步骤3后：分组应该只包含2个子组件").toHaveLength(2);
      const sortedDragOut = groupItem.children!.sort((a, b) => b.zIndex - a.zIndex);
      const idsDragOut = sortedDragOut.map((c) => c.id);
      expect(idsDragOut).toContain(echart1.id);
      expect(idsDragOut).toContain(echart2.id);
      expect(groupItem.left, "步骤3后：分组的left位置应该是0").toBe(0);
      expect(groupItem.top, "步骤3后：分组的top位置应该是0").toBe(0);
      expect(groupItem.component.width, "步骤3后：分组的宽度应该是600").toBe(600);
      expect(groupItem.component.height, "步骤3后：分组的高度应该是900").toBe(900);
    });

    it("分组自动删除 given 只剩一个子组件, 解散分组并提升子组件", async () => {
      // Arrange
      const { allComponentMap } = useGlobalComponentData();
      const { componentList, syncGlobalComponentData, setTargetSelectChart } = useEditStore();
      const { updateLocalData, processPendingUpdates } = useTree();
      const { handleGroup } = useAction();

      // Act - 步骤1: 将三个组件全部加入分组
      syncGlobalComponentData();
      const { echart1, echart2, echart3 } = makeTestComponents();
      setTargetSelectChart([`${echart1.id}`, `${echart2.id}`, `${echart3.id}`]);
      const groupItem = await handleGroup();

      if (!groupItem) {
        throw new Error("分组创建失败");
      }

      // Assert - 步骤1
      expect(componentList.value.length, "步骤1后：组件列表应该只包含1个分组组件").toBe(3);
      expect(groupItem.children, "步骤1后：分组应该包含3个子组件").toHaveLength(3);
      const sortedStep1 = groupItem.children!.sort((a, b) => b.zIndex - a.zIndex);
      const idsStep1 = sortedStep1.map((c) => c.id);
      expect(idsStep1).toContain(echart1.id);
      expect(idsStep1).toContain(echart2.id);
      expect(idsStep1).toContain(echart3.id);
      expect(groupItem.left, "步骤1后：分组的left位置应该是0").toBe(0);
      expect(groupItem.top, "步骤1后：分组的top位置应该是0").toBe(0);
      expect(groupItem.component.width, "步骤1后：分组的宽度应该是1200").toBe(1200);
      expect(groupItem.component.height, "步骤1后：分组的高度应该是900").toBe(900);

      // Act - 步骤2: 拖出echart3，只剩两个子组件
      updateLocalData(undefined, [groupItem, echart3]);
      updateLocalData(`${groupItem.id}`, [echart1, echart2]);
      processPendingUpdates();

      // Assert - 步骤2
      expect(componentList.value.length, "步骤2后：组件列表应该包含2个组件（分组+echart3）").toBe(2);
      expect(groupItem.children, "步骤2后：分组应该包含2个子组件").toHaveLength(2);
      expect(echart3.parent, "步骤2后：echart3的父组件应该是undefined").toBeUndefined();
      expect(groupItem.left, "步骤2后：分组的left位置应该是0").toBe(0);
      expect(groupItem.top, "步骤2后：分组的top位置应该是0").toBe(0);
      expect(groupItem.component.width, "步骤2后：分组的宽度应该是600").toBe(600);
      expect(groupItem.component.height, "步骤2后：分组的高度应该是900").toBe(900);

      // Act - 步骤3: 拖出echart2，只剩一个子组件（echart1）
      updateLocalData(undefined, [groupItem, echart2, echart3]);
      updateLocalData(`${groupItem.id}`, [echart1]);
      processPendingUpdates();

      // Assert - 步骤3
      expect(componentList.value.length, "步骤3后：组件列表应该包含3个组件（echart1+echart2+echart3）").toBe(3);
      expect(echart2.parent, "步骤3后：echart2的父组件应该是undefined").toBeUndefined();
      expect(echart1.parent, "步骤3后：echart1的父组件应该是undefined").toBeUndefined();

      Array.from(allComponentMap.value.values()).forEach((component, index) => {
        expect(component.parent, `步骤3后：echart${index + 1}应该是独立的组件`).toBeUndefined();
      });
    });

    it("多组件分组与跨组拖拽 given 多个分组和跨组拖拽, 正确维护组件关系", async () => {
      // Arrange
      const { componentList, syncGlobalComponentData, setTargetSelectChart } = useEditStore();
      const { updateLocalData, processPendingUpdates } = useTree();
      const { handleGroup } = useAction();

      // Act - 步骤1: 把组件1,2,3成组（组1）
      syncGlobalComponentData();
      const { echart1, echart2, echart3, echart4, echart5 } = makeTestComponents();
      setTargetSelectChart([`${echart1.id}`, `${echart2.id}`, `${echart3.id}`]);
      const group1 = await handleGroup();

      if (!group1) {
        throw new Error("组1创建失败");
      }

      // Assert - 步骤1
      expect(componentList.value.length, "步骤1后：组件列表应该包含3个组件（组1+echart4+echart5）").toBe(3);
      expect(group1.children, "步骤1后：组1应该包含3个子组件").toHaveLength(3);
      const sortedGroup1_1 = group1.children!.sort((a, b) => b.zIndex - a.zIndex);
      const idsGroup1_1 = sortedGroup1_1.map((c) => c.id);
      expect(idsGroup1_1).toContain(echart1.id);
      expect(idsGroup1_1).toContain(echart2.id);
      expect(idsGroup1_1).toContain(echart3.id);
      expect(group1.left, "步骤1后：组1的left位置应该是0").toBe(0);
      expect(group1.top, "步骤1后：组1的top位置应该是0").toBe(0);
      expect(group1.component.width, "步骤1后：组1的宽度应该是1200").toBe(1200);
      expect(group1.component.height, "步骤1后：组1的高度应该是900").toBe(900);

      // Act - 步骤2: 把组件4,5成组（组2）
      setTargetSelectChart([`${echart4.id}`, `${echart5.id}`]);
      const group2 = await handleGroup();

      if (!group2) {
        throw new Error("组2创建失败");
      }

      // Assert - 步骤2
      expect(componentList.value.length, "步骤2后：组件列表应该包含2个组件（组1+组2）").toBe(2);
      expect(group2.children, "步骤2后：组2应该包含2个子组件").toHaveLength(2);
      const sortedGroup2_2 = group2.children!.sort((a, b) => b.zIndex - a.zIndex);
      const idsGroup2_2 = sortedGroup2_2.map((c) => c.id);
      expect(idsGroup2_2).toContain(echart4.id);
      expect(idsGroup2_2).toContain(echart5.id);
      expect(group2.left, "步骤2后：组2的left位置应该是600").toBe(600);
      expect(group2.top, "步骤2后：组2的top位置应该是0").toBe(0);
      expect(group2.component.width, "步骤2后：组2的宽度应该是900").toBe(900);
      expect(group2.component.height, "步骤2后：组2的高度应该是1200").toBe(1200);

      // Act - 步骤3: 把组件3从组1拖入到组2中
      updateLocalData(`${group1.id}`, [echart1, echart2]);
      updateLocalData(`${group2.id}`, [echart4, echart5, echart3]);
      processPendingUpdates();

      // Assert - 步骤3
      expect(componentList.value.length, "步骤3后：组件列表应该包含2个组件（组1+组2）").toBe(2);
      expect(group1.children, "步骤3后：组1应该包含2个子组件").toHaveLength(2);
      const sortedGroup1_3 = group1.children!.sort((a, b) => b.zIndex - a.zIndex);
      const idsGroup1_3 = sortedGroup1_3.map((c) => c.id);
      expect(idsGroup1_3).toContain(echart1.id);
      expect(idsGroup1_3).toContain(echart2.id);
      expect(group1.left, "步骤3后：组1的left位置应该是0").toBe(0);
      expect(group1.top, "步骤3后：组1的top位置应该是0").toBe(0);
      expect(group1.component.width, "步骤3后：组1的宽度应该是600").toBe(600);
      expect(group1.component.height, "步骤3后：组1的高度应该是900").toBe(900);

      expect(group2.children, "步骤3后：组2应该包含3个子组件").toHaveLength(3);
      const sortedGroup2_3 = group2.children!.sort((a, b) => b.zIndex - a.zIndex);
      const idsGroup2_3 = sortedGroup2_3.map((c) => c.id);
      expect(idsGroup2_3).toContain(echart4.id);
      expect(idsGroup2_3).toContain(echart5.id);
      expect(idsGroup2_3).toContain(echart3.id);
      expect(group2.left, "步骤3后：组2的left位置应该是600").toBe(600);
      expect(group2.top, "步骤3后：组2的top位置应该是0").toBe(0);
      expect(group2.component.width, "步骤3后：组2的宽度应该是900").toBe(900);
      expect(group2.component.height, "步骤3后：组2的高度应该是1200").toBe(1200);
      expect(echart3.parent, "步骤3后：echart3的父组件应该是组2").toBe(group2.id);

      // Act - 步骤4: 把组件2从组1拖入到组2中，此时组1只剩echart1，应该被删除
      expect(group1.children, "步骤4前：组1应该只剩2个子组件").toHaveLength(2);
      updateLocalData(`${group1.id}`, [echart1]);
      updateLocalData(`${group2.id}`, [echart4, echart5, echart3, echart2]);
      processPendingUpdates();

      // Assert - 步骤4
      expect(componentList.value.length, "步骤4后：组件列表应该包含2个组件（组2+echart1）").toBe(2);
      expect(echart1.parent, "步骤4后：echart1应该是独立组件（组1被删除）").toBeUndefined();
      expect(group2.children, "步骤4后：组2应该包含4个子组件").toHaveLength(4);
      const sortedGroup2_4 = group2.children!.sort((a, b) => b.zIndex - a.zIndex);
      const idsGroup2_4 = sortedGroup2_4.map((c) => c.id);
      expect(idsGroup2_4).toContain(echart4.id);
      expect(idsGroup2_4).toContain(echart5.id);
      expect(idsGroup2_4).toContain(echart3.id);
      expect(idsGroup2_4).toContain(echart2.id);
      expect(echart2.parent, "步骤4后：echart2的父组件应该是组2").toBe(group2.id);
      expect(echart3.parent, "步骤4后：echart3的父组件应该是组2").toBe(group2.id);
      expect(echart4.parent, "步骤4后：echart4的父组件应该是组2").toBe(group2.id);
      expect(echart5.parent, "步骤4后：echart5的父组件应该是组2").toBe(group2.id);
      expect(group2.left, "步骤4后：组2的left位置应该是0").toBe(0);
      expect(group2.top, "步骤4后：组2的top位置应该是0").toBe(0);
      expect(group2.component.width, "步骤4后：组2的宽度应该是1500").toBe(1500);
      expect(group2.component.height, "步骤4后：组2的高度应该是1200").toBe(1200);

      // Act - 步骤5: 把最后一个独立组件echart1也拖入组2
      updateLocalData(`${group2.id}`, [echart4, echart5, echart3, echart2, echart1]);
      updateLocalData(undefined, [group2]);
      processPendingUpdates();

      // Assert - 步骤5
      expect(componentList.value.length, "步骤5后：组件列表应该只包含1个组件（组2）").toBe(1);
      expect(echart1.parent, "步骤5后：echart1的父组件应该是组2").toBe(group2.id);
      expect(echart2.parent, "步骤5后：echart2的父组件应该是组2").toBe(group2.id);
      expect(echart3.parent, "步骤5后：echart3的父组件应该是组2").toBe(group2.id);
      expect(echart4.parent, "步骤5后：echart4的父组件应该是组2").toBe(group2.id);
      expect(echart5.parent, "步骤5后：echart5的父组件应该是组2").toBe(group2.id);
      expect(group2.children, "步骤5后：组2应该包含5个子组件").toHaveLength(5);
      const sortedGroup2_5 = group2.children!.sort((a, b) => b.zIndex - a.zIndex);
      const idsGroup2_5 = sortedGroup2_5.map((c) => c.id);
      expect(idsGroup2_5).toContain(echart1.id);
      expect(idsGroup2_5).toContain(echart2.id);
      expect(idsGroup2_5).toContain(echart3.id);
      expect(idsGroup2_5).toContain(echart4.id);
      expect(idsGroup2_5).toContain(echart5.id);
      expect(group2.left, "步骤5后：组2的left位置应该是0").toBe(0);
      expect(group2.top, "步骤5后：组2的top位置应该是0").toBe(0);
      expect(group2.component.width, "步骤5后：组2的宽度应该是1500").toBe(1500);
      expect(group2.component.height, "步骤5后：组2的高度应该是1200").toBe(1200);
    });
  });

  describe("treeData 引用一致性", () => {
    it("treeData given 分组组件, 返回的 group 与 componentList.value 中的 group 保持同一引用", async () => {
      // Arrange
      const { componentList, syncGlobalComponentData, setTargetSelectChart } = useEditStore();
      const { treeData } = useTree();
      const { handleGroup } = useAction();

      // Act
      syncGlobalComponentData();
      const { echart1, echart2 } = makeTestComponents();
      setTargetSelectChart([`${echart1.id}`, `${echart2.id}`]);
      const groupItem = await handleGroup();

      if (!groupItem) {
        throw new Error("groupItem is undefined");
      }

      // 获取 treeData 中的分组
      const treeDataGroup = treeData.value.find((item) => item.id === groupItem.id);

      // Assert - 验证 treeData 中的分组与 componentList 中的分组是同一引用
      expect(treeDataGroup, "treeData 中应该包含该分组").toBeDefined();

      // 由于 buildTreeData 使用了 map 创建新数组，所以 treeData.value !== componentList.value
      // 但分组对象本身是通过 Object.assign 修改的，所以应该是同一引用
      const componentListGroup = componentList.value.find((item) => item.id === groupItem.id);
      expect(treeDataGroup, "treeData 中的分组应该与 componentList 中的分组是同一引用").toBe(componentListGroup);

      // 验证 treeData 返回的数组是新数组（因为用了 map）
      expect(treeData.value === componentList.value, "treeData.value 应该返回新数组").toBe(false);

      // 验证 children 也是同一引用
      expect(treeDataGroup!.children, "treeData 中的 children 应该与 componentList 中的 children 是同一引用").toBe(
        componentListGroup!.children
      );
    });

    it("treeData given 多次更新分组, 始终返回与 componentList 一致的引用", async () => {
      // Arrange
      const { componentList, syncGlobalComponentData, setTargetSelectChart } = useEditStore();
      const { treeData, updateLocalData, processPendingUpdates } = useTree();
      const { handleGroup } = useAction();

      // Act - 步骤1: 创建分组
      syncGlobalComponentData();
      const { echart1, echart2, echart3 } = makeTestComponents();
      setTargetSelectChart([`${echart1.id}`, `${echart2.id}`]);
      const groupItem = await handleGroup();

      if (!groupItem) {
        throw new Error("groupItem is undefined");
      }

      // Assert - 步骤1
      const treeDataGroup1 = treeData.value.find((item) => item.id === groupItem.id);
      expect(treeDataGroup1, "步骤1: treeData 中的分组应该与 componentList 中的分组是同一引用").toBe(
        componentList.value.find((item) => item.id === groupItem.id)
      );

      // Act - 步骤2: 添加 echart3 到分组
      updateLocalData(`${groupItem.id}`, [echart1, echart2, echart3]);
      updateLocalData(undefined, [groupItem]);
      processPendingUpdates();

      // Assert - 步骤2
      const treeDataGroup2 = treeData.value.find((item) => item.id === groupItem.id);
      const componentListGroup2 = componentList.value.find((item) => item.id === groupItem.id);
      expect(treeDataGroup2, "步骤2: treeData 中的分组应该与 componentList 中的分组是同一引用").toBe(
        componentListGroup2
      );
      // 注意：updateLocalData 会修改 children 数组，所以引用可能变化
      // 但分组对象本身应该是同一引用
      expect(treeDataGroup2!.children, "步骤2: treeData 中的 children 应该与 componentList 中的 children 一致").toBe(
        componentListGroup2!.children
      );

      // Act - 步骤3: 从分组中移除 echart3
      updateLocalData(undefined, [groupItem, echart3]);
      updateLocalData(`${groupItem.id}`, [echart1, echart2]);
      processPendingUpdates();

      // Assert - 步骤3
      const treeDataGroup3 = treeData.value.find((item) => item.id === groupItem.id);
      const componentListGroup3 = componentList.value.find((item) => item.id === groupItem.id);
      expect(treeDataGroup3, "步骤3: treeData 中的分组应该与 componentList 中的分组是同一引用").toBe(
        componentListGroup3
      );
      expect(treeDataGroup3!.children, "步骤3: treeData 中的 children 应该与 componentList 中的 children 一致").toBe(
        componentListGroup3!.children
      );
    });

    it("treeData given 多个分组, 每个分组都与 componentList 保持引用一致", async () => {
      // Arrange
      const { componentList, syncGlobalComponentData, setTargetSelectChart } = useEditStore();
      const { treeData } = useTree();
      const { handleGroup } = useAction();

      // Act
      syncGlobalComponentData();
      const { echart1, echart2, echart4, echart5 } = makeTestComponents();

      // 创建两个分组
      setTargetSelectChart([`${echart1.id}`, `${echart2.id}`]);
      const group1 = await handleGroup();

      setTargetSelectChart([`${echart4.id}`, `${echart5.id}`]);
      const group2 = await handleGroup();

      if (!group1 || !group2) {
        throw new Error("分组创建失败");
      }

      // Assert
      const treeDataGroup1 = treeData.value.find((item) => item.id === group1.id);
      const treeDataGroup2 = treeData.value.find((item) => item.id === group2.id);
      const componentListGroup1 = componentList.value.find((item) => item.id === group1.id);
      const componentListGroup2 = componentList.value.find((item) => item.id === group2.id);

      expect(treeDataGroup1, "treeData 中的 group1 应该与 componentList 中的 group1 是同一引用").toBe(
        componentListGroup1
      );
      expect(treeDataGroup2, "treeData 中的 group2 应该与 componentList 中的 group2 是同一引用").toBe(
        componentListGroup2
      );

      treeDataGroup1!.name = "test1234";

      expect(componentListGroup1?.name, "修改 treeData 中的分组应该反映到 componentList 中").toBe("test1234");
    });
  });

  describe("删除分组成员", () => {
    /**
     * 建一个含 memberCount 个成员的分组，返回分组节点与成员。
     * 走 handleSelectGroupAction 而不是 handleGroup：后者有「至少选两个」的 UI 守卫，
     * 而这里需要造出一个只有单个成员的分组，去覆盖删掉它之后的那一档。
     */
    const makeGroupOf = async (memberCount: number) => {
      const { syncGlobalComponentData, setTargetSelectChart } = useEditStore();
      const { handleSelectGroupAction } = useAction();
      syncGlobalComponentData();
      const all = makeTestComponents();
      const members = [all.echart1, all.echart2, all.echart3].slice(0, memberCount);
      setTargetSelectChart(members.map((m) => `${m.id}`));
      const groupItem = await handleSelectGroupAction(members);
      if (!groupItem) {
        throw new Error("建组失败");
      }
      return { groupItem, members };
    };

    it("成员还剩两个以上：分组仍然成立，只收紧包围盒", async () => {
      const { allComponentMap } = useGlobalComponentData();
      const { handleDelComponent } = useAction();
      const { groupItem, members } = await makeGroupOf(3);

      await handleDelComponent([`${members[2].id}`], UpdateHistoryTypeEnum.DELETE, false);

      expect(allComponentMap.value.get(`${groupItem.id}`), "分组应该还在树上").toBeDefined();
      expect(groupItem.children!.map((c) => c.id).sort(), "分组应该只剩前两个成员").toEqual(
        [members[0].id, members[1].id].sort()
      );
    });

    it("成员只剩一个：分组自动解散，成员提升到画布并继承分组的层级", async () => {
      const { componentList } = useEditStore();
      const { allComponentMap } = useGlobalComponentData();
      const { handleDelComponent } = useAction();
      const { groupItem, members } = await makeGroupOf(2);
      const groupZIndex = groupItem.zIndex;

      await handleDelComponent([`${members[1].id}`], UpdateHistoryTypeEnum.DELETE, false);

      expect(allComponentMap.value.get(`${groupItem.id}`), "分组应该已被解散").toBeUndefined();
      const survivor = componentList.value.find((c) => c.id === members[0].id);
      expect(survivor, "剩下那个成员应该提升到画布上").toBeDefined();
      expect(survivor!.parent, "提升后不该再带 parent").toBeUndefined();
      expect(survivor!.zIndex, "提升后应继承分组的层级").toBe(groupZIndex);
    });

    it("删掉分组里唯一的成员：分组与成员都从树上消失", async () => {
      // 这一档原先掉进 `===2` / `>2` 两个分支的缝里——组件已判定删除，却留在树上
      const { componentList } = useEditStore();
      const { allComponentMap } = useGlobalComponentData();
      const { handleDelComponent } = useAction();
      const { groupItem, members } = await makeGroupOf(1);

      await handleDelComponent([`${members[0].id}`], UpdateHistoryTypeEnum.DELETE, false);

      expect(allComponentMap.value.get(`${members[0].id}`), "成员应该已从树上摘掉").toBeUndefined();
      expect(allComponentMap.value.get(`${groupItem.id}`), "空分组不该留在画布上").toBeUndefined();
      expect(
        componentList.value.some((c) => c.id === members[0].id || c.id === groupItem.id),
        "画布上两者都不该再出现"
      ).toBe(false);
    });
  });
});
