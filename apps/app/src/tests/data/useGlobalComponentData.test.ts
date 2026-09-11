import { beforeEach, describe, expect, it, vi } from "vitest";

import { nextTick } from "vue";

import * as buildApi from "../../api/build";
import type { ComponentType } from "../../views/build/components/buildRender/type";
import {
  buildComponentMap,
  findTargetDynamicPanel,
  transformGroupData,
  useGlobalComponentData
} from "../../views/build/useGlobalComponentData";
/**
 * 分组 (sw-folder): 1821450
 * 顶层5个组件:
 * 条形图1 (echartstripBar): 1821447
 * 条形图2 (echartstripBar): 1821446
 * 动态面板 (sw-panel): 1821451
 * 终端交互 (terminal-control): 1821454
 * 嵌套组件:
 * 分组内饼图: 1821449, 面积折线图: 1821448
 * 动态面板内排名图: 1821452, 饼图: 1821453
 * 终端交互内图片: 1821455, 动态面板: 1821456
 * 终端交互嵌套动态面板内页面切换: 1821457, 选项卡: 1821458
 *
 * 一共13个组件
 */
import mockData from "./componentData.mock.json";

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

// Mock API 函数
vi.mock("../../api/build", () => ({
  getLargeScreenInfo: vi.fn()
}));

describe("useGlobalComponentData", () => {
  const mockGetLargeScreenInfo = vi.mocked(buildApi.getLargeScreenInfo);

  beforeEach(() => {
    vi.clearAllMocks();
    // 设置默认的成功响应
    mockGetLargeScreenInfo.mockResolvedValue(mockData as any);
  });

  describe("纯函数测试", () => {
    describe("transformGroupData", () => {
      it("应该正确转换字符串数组为对象数组", () => {
        const stringData = ['{"id": 1, "name": "test"}', '{"id": 2, "name": "test2"}'];
        const result = transformGroupData(stringData);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ id: 1, name: "test" });
        expect(result[1]).toEqual({ id: 2, name: "test2" });
      });

      it("应该正确处理已经是对象的数据", () => {
        const objectData = [
          { id: 1, name: "test" },
          { id: 2, name: "test2" }
        ];
        const result = transformGroupData(objectData as any);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ id: 1, name: "test" });
        expect(result[1]).toEqual({ id: 2, name: "test2" });
      });

      it("应该处理混合数据类型", () => {
        const mixedData = ['{"id": 1, "name": "test"}', { id: 2, name: "test2" }];
        const result = transformGroupData(mixedData as any);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ id: 1, name: "test" });
        expect(result[1]).toEqual({ id: 2, name: "test2" });
      });
    });

    describe("buildComponentMap", () => {
      it("应该正确构建组件映射", () => {
        const componentList: ComponentType[] = [
          {
            id: 1821450,
            component: { prop: "sw-folder", width: 1269, height: 302 },
            children: [
              {
                id: 1821449,
                component: { prop: "echartpie", width: 600, height: 300 }
              }
            ]
          } as any
        ];

        const componentMap = new Map();
        buildComponentMap({ componentList, componentMap, parentDynamicPanelId: [] });

        expect(componentMap.size).toBe(2);
        expect(componentMap.get("1821450")).toBeDefined();
        expect(componentMap.get("1821449")).toBeDefined();
        expect(componentMap.get("1821450")?.parentDynamicPanelId).toEqual([]);
        expect(componentMap.get("1821449")?.parentDynamicPanelId).toEqual([]);
      });

      it("应该正确处理动态面板", () => {
        const componentList: ComponentType[] = [
          {
            id: 1821451,
            component: { prop: "sw-panel", width: 600, height: 600 },
            panelData: [
              {
                config: [
                  {
                    id: 1821452,
                    component: { prop: "echartrank", width: 600, height: 300 }
                  }
                ]
              }
            ]
          } as any
        ];

        const componentMap = new Map();
        buildComponentMap({ componentList, componentMap, parentDynamicPanelId: [] });

        expect(componentMap.size).toBe(2);
        expect(componentMap.get("1821451")?.parentDynamicPanelId).toEqual([]);
        expect(componentMap.get("1821452")?.parentDynamicPanelId).toEqual([1821451]);
      });
    });

    describe("findTargetDynamicPanel", () => {
      const mockData: ComponentType[] = [
        {
          id: 1821454,
          component: { prop: "terminal-control", width: 768, height: 1024 },
          panelData: [
            {
              config: [
                {
                  id: 1821456,
                  component: { prop: "sw-panel", width: 600, height: 600 },
                  panelData: [
                    {
                      config: [
                        {
                          id: 1821457,
                          component: { prop: "iotSubtabs", width: 420, height: 48 }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        } as any
      ];

      it("应该找到第一级组件", () => {
        const result = findTargetDynamicPanel({
          data: mockData,
          parentIds: [1821454]
        });

        expect(result).toBeDefined();
        expect(result?.id).toBe(1821454);
      });

      it("应该找到深层嵌套的组件", () => {
        const result = findTargetDynamicPanel({
          data: mockData,
          parentIds: [1821454, 1821456]
        });

        expect(result).toBeDefined();
        expect(result?.id).toBe(1821456);
      });

      it("应该在找不到组件时返回null", () => {
        const result = findTargetDynamicPanel({
          data: mockData,
          parentIds: [999999]
        });

        expect(result).toBeNull();
      });

      it("应该在空路径时返回null", () => {
        const result = findTargetDynamicPanel({
          data: mockData,
          parentIds: []
        });

        expect(result).toBeNull();
      });
    });
  });

  describe("hooks 默认状态测试", () => {
    it("应该有正确的初始值", () => {
      const { groupData, globalComponentMap, encodeComponentMap, allComponentMap } = useGlobalComponentData();

      expect(groupData.value).toEqual([]);
      expect(globalComponentMap.value.size).toBe(0);
      expect(encodeComponentMap.value.size).toBe(0);
      expect(allComponentMap.value.size).toBe(0);
    });
  });

  describe("Mock API 测试", () => {
    it("应该正确 mock getLargeScreenInfo API 并返回 mockData", async () => {
      // 测试 API mock
      const result = await buildApi.getLargeScreenInfo(23587);

      expect(mockGetLargeScreenInfo).toHaveBeenCalledWith(23587);
      expect(result).toEqual(mockData);
      expect(result.result.name).toBe("组件测试大屏");
      expect(result.result.layers).toHaveLength(5);
    });

    it("应该处理 API 错误情况", async () => {
      // 设置 API 抛出错误
      const errorMessage = "获取大屏信息失败";
      mockGetLargeScreenInfo.mockRejectedValueOnce(new Error(errorMessage));

      // 测试错误处理
      await expect(buildApi.getLargeScreenInfo(99999)).rejects.toThrow(errorMessage);
      expect(mockGetLargeScreenInfo).toHaveBeenCalledWith(99999);
    });
  });

  describe("setGroupData 方法测试", () => {
    it("应该正确处理 mock API 数据并设置正确数量的组件", async () => {
      const { setGroupData, groupData } = useGlobalComponentData();

      // 调用 mock API 获取数据
      const apiResult = await buildApi.getLargeScreenInfo(23587);
      setGroupData(apiResult.result as any);
      await nextTick();

      // 验证基础数据结构
      expect(groupData.value).toHaveLength(5); // 5个顶层组件

      // 验证组件类型和结构
      const componentTypes = groupData.value.map((comp) => comp.component.prop);
      expect(componentTypes).toContain("sw-folder"); // 分组组件
      expect(componentTypes).toContain("echartstripBar"); // 条形图
      expect(componentTypes).toContain("sw-panel"); // 动态面板
      expect(componentTypes).toContain("terminal-control"); // 终端交互
    });

    it("应该正确处理分组组件的子组件", async () => {
      const { setGroupData, groupData } = useGlobalComponentData();

      const apiResult = await buildApi.getLargeScreenInfo(23587);
      setGroupData(apiResult.result as any);
      await nextTick();

      // 查找分组组件
      const groupComponent = groupData.value.find((comp) => comp.component.prop === "sw-folder");
      expect(groupComponent).toBeDefined();
      expect(groupComponent?.children).toHaveLength(2); // 分组内有2个组件

      // 验证子组件类型
      const childTypes = groupComponent?.children?.map((child) => child.component.prop);
      expect(childTypes).toContain("echartpie"); // 饼图
      expect(childTypes).toContain("echartareaLine"); // 面积折线图
    });
  });

  describe("computed maps 测试", () => {
    it("应该正确统计所有组件映射数量", async () => {
      const { setGroupData, globalComponentMap, encodeComponentMap, allComponentMap } = useGlobalComponentData();

      // 使用 mock API 数据
      const apiResult = await buildApi.getLargeScreenInfo(23587);
      setGroupData(apiResult.result);
      await nextTick();

      // 根据新的mock数据结构验证组件数量
      // 顶层5个 + 分组内2个 + 动态面板内2个 + 终端交互及其嵌套组件
      expect(allComponentMap.value.size).toBe(13); // 13个组件

      // globalComponentMap 应该过滤掉终端交互面板
      expect(globalComponentMap.value.size).toBe(8);
      expect(globalComponentMap.value.size).toBeLessThan(allComponentMap.value.size);

      // encodeComponentMap 应该包含终端交互组件及其嵌套组件
      expect(encodeComponentMap.value.size).toBe(5);

      // 验证总数一致性
      expect(globalComponentMap.value.size + encodeComponentMap.value.size).toBe(allComponentMap.value.size);
    });

    it("应该正确处理终端交互组件的过滤", async () => {
      const { setGroupData, globalComponentMap, encodeComponentMap, allComponentMap } = useGlobalComponentData();

      const apiResult = await buildApi.getLargeScreenInfo(23587);
      setGroupData(apiResult.result);
      await nextTick();

      // 检查终端交互组件是否正确分类
      const terminalComponent = [...allComponentMap.value.values()].find(
        (comp) => comp.component.prop === "terminal-control"
      );
      expect(terminalComponent).toBeDefined();

      // 终端交互组件应该在 encodeComponentMap 中，而不在 globalComponentMap 中
      expect(encodeComponentMap.value.has(terminalComponent!.id.toString())).toBe(true);
      expect(globalComponentMap.value.has(terminalComponent!.id.toString())).toBe(false);
    });

    it("应该正确处理动态面板的嵌套组件和parentDynamicPanelId", async () => {
      const { setGroupData, allComponentMap } = useGlobalComponentData();

      const apiResult = await buildApi.getLargeScreenInfo(23587);
      setGroupData(apiResult.result);
      await nextTick();

      // 查找动态面板组件
      const dynamicPanels = [...allComponentMap.value.values()].filter((comp) => comp.component.prop === "sw-panel");

      expect(dynamicPanels.length).toBe(2);

      // 验证动态面板内的组件有正确的parentDynamicPanelId
      const nestedComponents = [...allComponentMap.value.values()].filter(
        (comp) => comp.parentDynamicPanelId.length > 0
      );

      expect(nestedComponents.length).toBe(6);

      // 验证嵌套组件的父级ID正确
      nestedComponents.forEach((comp) => {
        expect(comp.parentDynamicPanelId).toBeInstanceOf(Array);
        if (comp.id === 1821457 || comp.id === 1821458) {
          // 终端 -> 动态面板 -> 组件
          expect(comp.parentDynamicPanelId.length).toBe(2);
        } else {
          expect(comp.parentDynamicPanelId.length).toBe(1);
        }
      });
    });
  });

  describe("resetGroupData 方法测试", () => {
    it("应该重置 groupData 为空数组", async () => {
      const { setGroupData, resetGroupData, groupData, allComponentMap } = useGlobalComponentData();

      // 先使用mock API设置一些数据
      const apiResult = await buildApi.getLargeScreenInfo(23587);
      setGroupData(apiResult.result);
      await nextTick();
      expect(groupData.value).toHaveLength(5);
      expect(allComponentMap.value.size).toBe(13);

      // 重置数据
      resetGroupData();
      await nextTick();
      expect(groupData.value).toEqual([]);
      expect(allComponentMap.value.size).toBe(0);
    });
  });

  describe("完整数据流程集成测试", () => {
    it("应该完整处理从API到组件映射的整个数据流", async () => {
      const { setGroupData, groupData, globalComponentMap, encodeComponentMap, allComponentMap } =
        useGlobalComponentData();

      // 完整流程：API -> 设置数据 -> 验证各种映射
      const apiResult = await buildApi.getLargeScreenInfo(23587);
      setGroupData(apiResult.result);
      await nextTick();

      // 验证API数据正确处理
      expect(apiResult.result.name).toBe("组件测试大屏");
      expect(groupData.value).toHaveLength(5);

      // 验证所有映射的完整性和一致性
      const totalComponents = allComponentMap.value.size;
      const globalComponents = globalComponentMap.value.size;
      const encodeComponents = encodeComponentMap.value.size;

      expect(totalComponents).toBe(13); // 应该有很多组件包括嵌套的
      expect(globalComponents + encodeComponents).toBe(totalComponents);
      expect(encodeComponents).toBe(5); // 应该有终端交互组件

      // 验证具体组件类型存在
      const componentProps = [...allComponentMap.value.values()].map((comp) => comp.component.prop);
      expect(componentProps).toContain("sw-folder"); // 分组
      expect(componentProps).toContain("terminal-control"); // 终端交互
      expect(componentProps).toContain("sw-panel"); // 动态面板
      expect(componentProps).toContain("echartstripBar"); // 条形图

      // 验证终端交互组件的正确分类
      const hasTerminalInEncode = [...encodeComponentMap.value.values()].some(
        (comp) => comp.component.prop === "terminal-control"
      );
      const hasTerminalInGlobal = [...globalComponentMap.value.values()].some(
        (comp) => comp.component.prop === "terminal-control"
      );
      expect(hasTerminalInEncode).toBe(true);
      expect(hasTerminalInGlobal).toBe(false);
    });
  });
});
