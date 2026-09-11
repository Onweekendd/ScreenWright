import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { nextTick } from "vue";

import { getLargeScreenInfo } from "@/api/build";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import type {
  AnimationCallbacks,
  AnimationTrigger
} from "@/views/build/components/buildRender/hooks/useGlobalAnimation";
import { useGlobalAnimation } from "@/views/build/components/buildRender/hooks/useGlobalAnimation";
import type { Animation } from "@/views/build/components/buildRender/type";
import { useCacheData } from "@/views/build/useCacheData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useDataFilter } from "../../views/build/useDataFilter";
import { useLargeScreenInfo } from "../../views/build/useLargeScreenInfo";
import mockDetail from "./componentData.mock.json";

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
  uuid: vi.fn(() => "mock-uuid-1234")
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
  updateLayersAgg: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock("@/utils/service", () => ({
  createRequest: vi.fn()
}));

vi.mock("@/utils/cacheService", () => ({
  createRequest: vi.fn()
}));

describe("useGlobalAnimation", () => {
  beforeEach(async () => {
    const { resetNavInfo, setNavInfo } = useLargeScreenInfo();
    const { setGroupData, groupData, resetGroupData } = useGlobalComponentData();
    const { initCallbackArguments, onClear } = useCallbackArguments();
    const { setDetail2Config, resetEditStore } = useEditStore();
    const { resetDataFilter, cloneDataFilterOnInit } = useDataFilter();
    onClear();
    resetEditStore();
    resetNavInfo();
    resetGroupData();
    resetDataFilter();

    // 清理全局动画注册表
    const { triggerRegistry } = useGlobalAnimation();
    triggerRegistry.clear();

    // 通过 mock 接口返回的数据进行初始化
    const res = await getLargeScreenInfo(23595);
    setNavInfo(res.result);
    setGroupData(res.result);
    setDetail2Config(res.result);
    initCallbackArguments(groupData.value);
    cloneDataFilterOnInit();
  });

  afterEach(() => {
    const { buildWorkerCacheInput } = useCacheData();

    const workerCacheInput = buildWorkerCacheInput(Date.now());

    structuredClone(workerCacheInput);
  });

  describe("基础功能测试", () => {
    it("应该返回正确的全局动画管理器", () => {
      const globalAnimation = useGlobalAnimation();

      expect(globalAnimation).toHaveProperty("triggerRegistry");
      expect(globalAnimation).toHaveProperty("registerAnimationTrigger");
      expect(globalAnimation).toHaveProperty("unregisterAnimationTrigger");
      expect(globalAnimation).toHaveProperty("getAllTriggers");
    });

    it("应该初始化空的触发器注册表", () => {
      const { triggerRegistry } = useGlobalAnimation();

      expect(triggerRegistry).toBeInstanceOf(Map);
      expect(triggerRegistry.size).toBe(0);
    });

    it("应该提供触发器注册功能", () => {
      const { registerAnimationTrigger } = useGlobalAnimation();

      expect(typeof registerAnimationTrigger).toBe("function");
    });

    it("应该提供触发器注销功能", () => {
      const { unregisterAnimationTrigger } = useGlobalAnimation();

      expect(typeof unregisterAnimationTrigger).toBe("function");
    });

    it("应该提供获取所有触发器功能", () => {
      const { getAllTriggers } = useGlobalAnimation();

      expect(typeof getAllTriggers).toBe("function");
      expect(Array.isArray(getAllTriggers())).toBe(true);
    });
  });

  describe("触发器注册管理测试", () => {
    it("应该能够注册动画触发器", () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];
      const { registerAnimationTrigger, triggerRegistry } = useGlobalAnimation();

      const mockTrigger: AnimationTrigger = vi.fn();

      registerAnimationTrigger(testComponent.id.toString(), mockTrigger);

      expect(triggerRegistry.has(testComponent.id.toString())).toBe(true);
      expect(triggerRegistry.get(testComponent.id.toString())).toBe(mockTrigger);
    });

    it("应该能够注销动画触发器", () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];
      const { registerAnimationTrigger, unregisterAnimationTrigger, triggerRegistry } = useGlobalAnimation();

      const mockTrigger: AnimationTrigger = vi.fn();

      // 先注册
      registerAnimationTrigger(testComponent.id.toString(), mockTrigger);
      expect(triggerRegistry.has(testComponent.id.toString())).toBe(true);

      // 再注销
      unregisterAnimationTrigger(testComponent.id.toString());
      expect(triggerRegistry.has(testComponent.id.toString())).toBe(false);
    });

    it("应该能够获取所有注册的触发器ID", () => {
      const { groupData } = useGlobalComponentData();
      const { registerAnimationTrigger, getAllTriggers } = useGlobalAnimation();

      const mockTrigger: AnimationTrigger = vi.fn();
      // 获取唯一的组件ID（去重）
      const uniqueComponentIds = [...new Set(groupData.value.map((comp) => comp.id.toString()))];

      // 注册多个触发器
      uniqueComponentIds.forEach((id) => {
        registerAnimationTrigger(id, mockTrigger);
      });

      const allTriggers = getAllTriggers();
      expect(allTriggers).toHaveLength(uniqueComponentIds.length);
      expect(allTriggers).toEqual(expect.arrayContaining(uniqueComponentIds));
    });

    it("重复注册同一个组件ID应该覆盖之前的触发器", () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];
      const { registerAnimationTrigger, triggerRegistry } = useGlobalAnimation();

      const firstTrigger: AnimationTrigger = vi.fn();
      const secondTrigger: AnimationTrigger = vi.fn();

      // 第一次注册
      registerAnimationTrigger(testComponent.id.toString(), firstTrigger);
      expect(triggerRegistry.get(testComponent.id.toString())).toBe(firstTrigger);

      // 第二次注册（覆盖）
      registerAnimationTrigger(testComponent.id.toString(), secondTrigger);
      expect(triggerRegistry.get(testComponent.id.toString())).toBe(secondTrigger);
      expect(triggerRegistry.get(testComponent.id.toString())).not.toBe(firstTrigger);
    });
  });

  describe("触发器调用测试", () => {
    it("应该能够正确调用注册的触发器", () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];
      const { registerAnimationTrigger, triggerRegistry } = useGlobalAnimation();

      const mockTrigger = vi.fn();
      const testAnimation: Animation = {
        type: "fade",
        direction: "in",
        duration: 1000,
        delay: 0,
        timingFunction: "ease-in-out"
      };

      // 注册触发器
      registerAnimationTrigger(testComponent.id.toString(), mockTrigger);

      // 获取并调用触发器
      const registeredTrigger = triggerRegistry.get(testComponent.id.toString());
      expect(registeredTrigger).toBeDefined();

      registeredTrigger!({
        animation: testAnimation,
        triggerType: "preview"
      });

      expect(mockTrigger).toHaveBeenCalledWith({
        animation: testAnimation,
        triggerType: "preview"
      });
    });

    it("应该能够传递完整的动画参数", () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];
      const { registerAnimationTrigger, triggerRegistry } = useGlobalAnimation();

      const mockTrigger = vi.fn();
      const testAnimation: Animation = {
        type: "slide",
        direction: "up",
        duration: 2000,
        delay: 500,
        timingFunction: "ease-out"
      };
      const mockCallbacks: AnimationCallbacks = {
        onBeforeEnter: vi.fn(),
        onEnter: vi.fn(),
        onAfterEnter: vi.fn()
      };

      registerAnimationTrigger(testComponent.id.toString(), mockTrigger);
      const trigger = triggerRegistry.get(testComponent.id.toString())!;

      trigger({
        animation: testAnimation,
        newAnimationCallback: mockCallbacks,
        type: "transition",
        triggerType: "enter"
      });

      expect(mockTrigger).toHaveBeenCalledWith({
        animation: testAnimation,
        newAnimationCallback: mockCallbacks,
        type: "transition",
        triggerType: "enter"
      });
    });

    it("应该支持多个组件的独立触发", async () => {
      const { registerAnimationTrigger, triggerRegistry } = useGlobalAnimation();

      const trigger1 = vi.fn();
      const trigger2 = vi.fn();
      const animation1: Animation = {
        type: "fade",
        direction: "in",
        duration: 1000,
        delay: 0,
        timingFunction: "ease-in-out"
      };
      const animation2: Animation = {
        type: "slide",
        direction: "left",
        duration: 1500,
        delay: 200,
        timingFunction: "ease-out"
      };

      // 使用不同的组件ID来避免重复
      const component1Id = "test-component-1";
      const component2Id = "test-component-2";

      registerAnimationTrigger(component1Id, trigger1);
      registerAnimationTrigger(component2Id, trigger2);

      // 分别触发两个组件
      const trigger1Func = triggerRegistry.get(component1Id);
      const trigger2Func = triggerRegistry.get(component2Id);

      expect(trigger1Func).toBeDefined();
      expect(trigger2Func).toBeDefined();

      // 直接调用触发器函数
      if (trigger1Func) {
        trigger1Func({
          animation: animation1,
          triggerType: "preview"
        });
      }

      if (trigger2Func) {
        trigger2Func({
          animation: animation2,
          triggerType: "enter"
        });
      }

      await nextTick();

      expect(trigger1).toHaveBeenCalledWith({
        animation: animation1,
        triggerType: "preview"
      });

      expect(trigger2).toHaveBeenCalledWith({
        animation: animation2,
        triggerType: "enter"
      });

      // 确保触发器没有相互影响
      expect(trigger1).toHaveBeenCalledTimes(1);
      expect(trigger2).toHaveBeenCalledTimes(1);
    });

    it("应该正确处理不同的触发类型", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];
      const { registerAnimationTrigger, triggerRegistry } = useGlobalAnimation();

      const mockTrigger = vi.fn();
      const testAnimation: Animation = {
        type: "fade",
        direction: "in",
        duration: 1000,
        delay: 0,
        timingFunction: "ease-in-out"
      };

      registerAnimationTrigger(testComponent.id.toString(), mockTrigger);
      const trigger = triggerRegistry.get(testComponent.id.toString())!;

      // 测试 preview 触发类型
      trigger({
        animation: testAnimation,
        triggerType: "preview"
      });
      await nextTick();

      // 测试 enter 触发类型
      trigger({
        animation: testAnimation,
        triggerType: "enter"
      });
      await nextTick();

      // 测试 leave 触发类型
      trigger({
        animation: testAnimation,
        triggerType: "leave"
      });
      await nextTick();

      expect(mockTrigger).toHaveBeenCalledTimes(3);
    });
  });

  describe("全局状态管理测试", () => {
    it("useGlobalAnimation应该确保单例行为", () => {
      const global1 = useGlobalAnimation();
      const global2 = useGlobalAnimation();

      // 应该是同一个实例
      expect(global1.triggerRegistry).toBe(global2.triggerRegistry);
      expect(global1.registerAnimationTrigger).toBe(global2.registerAnimationTrigger);
      expect(global1.unregisterAnimationTrigger).toBe(global2.unregisterAnimationTrigger);
    });

    it("不同调用应该共享同一个注册表", () => {
      const global1 = useGlobalAnimation();
      const global2 = useGlobalAnimation();

      const mockTrigger: AnimationTrigger = vi.fn();

      // 在第一个实例中注册
      global1.registerAnimationTrigger("shared-component", mockTrigger);

      // 在第二个实例中应该能看到
      expect(global2.triggerRegistry.has("shared-component")).toBe(true);
      expect(global2.getAllTriggers()).toContain("shared-component");
    });

    it("应该在不同组件间保持状态同步", () => {
      const global1 = useGlobalAnimation();
      const global2 = useGlobalAnimation();

      const mockTrigger1 = vi.fn();
      const mockTrigger2 = vi.fn();

      // 使用不同的组件ID来避免重复
      const component1Id = "sync-component-1";
      const component2Id = "sync-component-2";

      // 在不同实例中注册不同组件
      global1.registerAnimationTrigger(component1Id, mockTrigger1);
      global2.registerAnimationTrigger(component2Id, mockTrigger2);

      // 两个实例都应该能看到所有注册的触发器
      const allTriggers1 = global1.getAllTriggers();
      const allTriggers2 = global2.getAllTriggers();

      expect(allTriggers1).toHaveLength(2);
      expect(allTriggers2).toHaveLength(2);
      expect(allTriggers1).toEqual(allTriggers2);
      expect(allTriggers1).toContain(component1Id);
      expect(allTriggers1).toContain(component2Id);
    });
  });

  describe("生命周期集成测试", () => {
    it("注册和注销操作应该正常工作", () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];
      const { registerAnimationTrigger, unregisterAnimationTrigger, getAllTriggers } = useGlobalAnimation();

      const mockTrigger: AnimationTrigger = vi.fn();

      // 初始状态
      expect(getAllTriggers()).toHaveLength(0);

      // 注册触发器
      registerAnimationTrigger(testComponent.id.toString(), mockTrigger);
      expect(getAllTriggers()).toHaveLength(1);

      // 注销触发器
      unregisterAnimationTrigger(testComponent.id.toString());
      expect(getAllTriggers()).toHaveLength(0);
    });

    it("应该支持动态注册和注销", () => {
      const { groupData } = useGlobalComponentData();
      const { registerAnimationTrigger, unregisterAnimationTrigger, getAllTriggers } = useGlobalAnimation();

      const mockTrigger: AnimationTrigger = vi.fn();

      // 获取唯一的组件ID（去重）
      const uniqueComponentIds = [...new Set(groupData.value.map((comp) => comp.id.toString()))];

      // 动态注册多个组件
      uniqueComponentIds.forEach((id) => {
        registerAnimationTrigger(id, mockTrigger);
      });

      expect(getAllTriggers()).toHaveLength(uniqueComponentIds.length);

      // 动态注销部分组件
      const halfLength = Math.floor(uniqueComponentIds.length / 2);
      uniqueComponentIds.slice(0, halfLength).forEach((id) => {
        unregisterAnimationTrigger(id);
      });

      const expectedRemainingLength = uniqueComponentIds.length - halfLength;
      expect(getAllTriggers()).toHaveLength(expectedRemainingLength);
    });
  });

  describe("边界情况和错误处理", () => {
    it("注销不存在的触发器不应该报错", () => {
      const { unregisterAnimationTrigger } = useGlobalAnimation();
      const nonExistentId = "non-existent-component";

      expect(() => {
        unregisterAnimationTrigger(nonExistentId);
      }).not.toThrow();
    });

    it("空字符串ID应该正常工作", () => {
      const { registerAnimationTrigger, triggerRegistry } = useGlobalAnimation();
      const mockTrigger: AnimationTrigger = vi.fn();
      const emptyId = "";

      expect(() => {
        registerAnimationTrigger(emptyId, mockTrigger);
      }).not.toThrow();

      expect(triggerRegistry.has(emptyId)).toBe(true);
    });

    it("特殊字符ID应该正常处理", () => {
      const { registerAnimationTrigger, triggerRegistry, getAllTriggers } = useGlobalAnimation();
      const mockTrigger: AnimationTrigger = vi.fn();
      const specialIds = ["comp@123", "comp#456", "comp$789", "comp%000"];

      specialIds.forEach((id) => {
        registerAnimationTrigger(id, mockTrigger);
      });

      expect(getAllTriggers()).toHaveLength(4);
      specialIds.forEach((id) => {
        expect(triggerRegistry.has(id)).toBe(true);
      });
    });

    it("大量注册和注销操作应该正常工作", () => {
      const { registerAnimationTrigger, unregisterAnimationTrigger, getAllTriggers } = useGlobalAnimation();
      const componentCount = 100;
      const mockTrigger: AnimationTrigger = vi.fn();

      // 大量注册
      for (let i = 0; i < componentCount; i++) {
        registerAnimationTrigger(`component-${i}`, mockTrigger);
      }

      expect(getAllTriggers()).toHaveLength(componentCount);

      // 大量注销
      for (let i = 0; i < componentCount; i++) {
        unregisterAnimationTrigger(`component-${i}`);
      }

      expect(getAllTriggers()).toHaveLength(0);
    });

    it("重复触发相同动画应该正常工作", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];
      const { registerAnimationTrigger, triggerRegistry } = useGlobalAnimation();

      const mockTrigger = vi.fn();
      const testAnimation: Animation = {
        type: "fade",
        direction: "in",
        duration: 1000,
        delay: 0,
        timingFunction: "ease-in-out"
      };

      registerAnimationTrigger(testComponent.id.toString(), mockTrigger);
      const trigger = triggerRegistry.get(testComponent.id.toString())!;

      // 快速连续触发多次
      for (let i = 0; i < 5; i++) {
        trigger({
          animation: testAnimation,
          triggerType: "preview"
        });
      }

      await nextTick();

      expect(mockTrigger).toHaveBeenCalledTimes(5);
    });
  });
});
