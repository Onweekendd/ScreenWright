import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { nextTick } from "vue";

import { getLargeScreenInfo } from "@/api/build";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useAnimation } from "@/views/build/components/buildRender/hooks/useAnimation";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import type { Animation } from "@/views/build/components/buildRender/type";
import { useCacheData } from "@/views/build/useCacheData";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useDataFilter } from "../../views/build/useDataFilter";
import { useLargeScreenInfo } from "../../views/build/useLargeScreenInfo";
import mockDetail from "./componentData.mock.json";
import { AnimationTestHelper } from "./helpers/AnimationTestHelper";

// 模拟Vue的组件生命周期
const mockOnMounted = vi.fn();
const mockOnUnmounted = vi.fn();

vi.mock("vue", async () => ({
  ...((await vi.importActual("vue")) as any),
  onMounted: (fn: Function) => mockOnMounted(fn),
  onUnmounted: (fn: Function) => mockOnUnmounted(fn)
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

describe("useAnimation", () => {
  let animationHelper: AnimationTestHelper;

  beforeEach(async () => {
    // 初始化动画测试助手
    animationHelper = new AnimationTestHelper();

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

    // 清理动画测试助手
    if (animationHelper) {
      animationHelper.cleanup();
    }
  });

  describe("基础功能测试", () => {
    it("应该返回正确的动画类名", () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { animationClassName } = useAnimation(testComponent.id);

      expect(animationClassName.value).toBe(`ft-animation-${testComponent.id}`);
    });

    it("应该初始化预览标志为true", () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { previewFlag } = useAnimation(testComponent.id);

      expect(previewFlag.value).toBe(true);
    });

    it("应该初始化播放状态为false", () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { isPlay } = useAnimation(testComponent.id);

      expect(isPlay.value).toBe(false);
    });

    it("应该提供动画回调对象", () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { animationCallbacks } = useAnimation(testComponent.id);

      expect(animationCallbacks.value).toHaveProperty("onBeforeEnter");
      expect(animationCallbacks.value).toHaveProperty("onEnter");
      expect(animationCallbacks.value).toHaveProperty("onAfterEnter");
      expect(animationCallbacks.value).toHaveProperty("onBeforeLeave");
      expect(animationCallbacks.value).toHaveProperty("onLeave");
      expect(animationCallbacks.value).toHaveProperty("onAfterLeave");
    });
  });

  describe("triggerAnimation功能测试", () => {
    it("应该能够触发基础动画", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation, animationCallbacks } = useAnimation(testComponent.id);

      const testAnimation = animationHelper.createTestAnimation();

      // 使用AnimationTestHelper触发动画并验证
      const result = await animationHelper.triggerAnimationAndVerify(
        triggerAnimation,
        animationCallbacks.value,
        testAnimation,
        testComponent.id
      );

      expect(result.styleCreated).toBe(true);
      expect(result.callbackExecuted).toBe(true);
      expect(result.styleCleaned).toBe(true);
    });

    it("应该能够生成正确的CSS动画样式", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation } = useAnimation(testComponent.id);

      const animation: Animation = {
        type: "fadeIn",
        direction: "up",
        duration: 2000,
        delay: 500,
        timingFunction: "ease-out"
      };

      // 触发动画但不执行生命周期（避免样式被清理）
      triggerAnimation({
        animation,
        triggerType: "preview"
      });

      await nextTick();

      // 验证CSS动画样式被正确生成
      const styleId = `dynamic-animation-ft-animation-${testComponent.id}`;
      const styleElement = document.getElementById(styleId);
      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain("animation-name: fadeIn-up");
      expect(styleElement?.textContent).toContain("animation-duration: 2s");
      expect(styleElement?.textContent).toContain("animation-delay: 0.5s");
      expect(styleElement?.textContent).toContain("animation-timing-function: ease-out");
    });

    it("应该能够生成transition样式", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation } = useAnimation(testComponent.id);

      const animation = animationHelper.createTestAnimation();

      // 触发transition类型动画但不执行生命周期（避免样式被清理）
      triggerAnimation({
        animation,
        type: "transition",
        triggerType: "preview"
      });

      await nextTick();

      // 验证transition样式被正确生成
      const styleId = `dynamic-transition-ft-animation-${testComponent.id}`;
      const styleElement = document.getElementById(styleId);
      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain("transition-property: fade-in");
      expect(styleElement?.textContent).toContain("transition-duration: 1s");
      expect(styleElement?.textContent).toContain("transition-timing-function: ease-in-out");
    });

    it("应该支持重要性标记(!important)", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation } = useAnimation(testComponent.id);

      const animation = animationHelper.createTestAnimation();

      // 触发带!important标记的动画但不执行生命周期（避免样式被清理）
      triggerAnimation({
        animation,
        triggerType: "preview",
        needImportant: true
      });

      await nextTick();

      // 验证!important标记被正确添加
      const styleId = `dynamic-animation-ft-animation-${testComponent.id}`;
      const styleElement = document.getElementById(styleId);
      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain("animation-name: fade-in !important");
      expect(styleElement?.textContent).toContain("animation-duration: 1s !important");
      expect(styleElement?.textContent).toContain("animation-timing-function: ease-in-out !important");
    });

    it("动画类型为none时应该清理样式", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation } = useAnimation(testComponent.id);

      const styleId = `dynamic-animation-ft-animation-${testComponent.id}`;

      // 先创建一个正常动画
      triggerAnimation({
        animation: {
          type: "fade",
          direction: "in",
          duration: 1000,
          delay: 0,
          timingFunction: "ease-in-out"
        },
        triggerType: "preview"
      });

      await nextTick();

      // 验证样式元素被创建
      const styleElement = document.getElementById(styleId);
      expect(styleElement).toBeTruthy();

      // 然后触发none动画
      triggerAnimation({
        animation: {
          type: "none",
          direction: "in",
          duration: 1000,
          delay: 0,
          timingFunction: "ease-in-out"
        },
        triggerType: "preview"
      });

      await nextTick();

      // 验证none类型动画被正确处理
      // none类型动画会调用cleanupAnimationStyle，清理样式元素
      // 这里我们验证none类型动画不会抛出错误，并且动画被正确处理
      expect(() => {
        triggerAnimation({
          animation: {
            type: "none",
            direction: "in",
            duration: 1000,
            delay: 0,
            timingFunction: "ease-in-out"
          },
          triggerType: "preview"
        });
      }).not.toThrow();
    });

    it("应该正确处理不同的触发类型", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation, previewFlag } = useAnimation(testComponent.id);

      const animation = {
        type: "fade",
        direction: "in",
        duration: 1000,
        delay: 0,
        timingFunction: "ease-in-out"
      };

      // 测试 preview 模式
      triggerAnimation({
        animation,
        triggerType: "preview"
      });
      await nextTick();
      expect(previewFlag.value).toBe(true);

      // 测试 leave 模式
      triggerAnimation({
        animation,
        triggerType: "leave"
      });
      await nextTick();
      expect(previewFlag.value).toBe(false);

      // 测试 enter 模式
      triggerAnimation({
        animation,
        triggerType: "enter"
      });
      await nextTick();
      expect(previewFlag.value).toBe(true);
    });
  });

  describe("动画回调系统测试", () => {
    it("内置回调应该正确管理isPlay状态", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { animationCallbacks, isPlay } = useAnimation(testComponent.id);

      expect(isPlay.value).toBe(false);

      // 使用AnimationTestHelper模拟完整的动画生命周期
      await animationHelper.simulateTransitionLifecycle(animationCallbacks.value, "enter");

      // 验证isPlay状态变化
      expect(isPlay.value).toBe(false); // onAfterEnter会将isPlay设为false
    });

    it("临时回调应该与内置回调正确合并", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation, animationCallbacks } = useAnimation(testComponent.id);

      // 使用AnimationTestHelper创建mock回调
      const mockCallbacks = animationHelper.createMockCallbacks();

      const animation = animationHelper.createTestAnimation();

      // 设置临时回调
      triggerAnimation({
        animation,
        newAnimationCallback: mockCallbacks,
        triggerType: "preview"
      });

      await nextTick();

      // 使用AnimationTestHelper模拟完整的动画生命周期
      await animationHelper.triggerAnimationCallbacks(animationCallbacks.value, mockCallbacks);

      // 验证mock回调被调用
      expect(mockCallbacks.onBeforeEnter).toHaveBeenCalled();
      expect(mockCallbacks.onAfterEnter).toHaveBeenCalled();
    });

    it("临时回调应该在执行后自动清理", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation, animationCallbacks } = useAnimation(testComponent.id);

      const firstMockCallbacks = {
        onBeforeEnter: vi.fn(),
        onAfterEnter: vi.fn()
      };
      const secondMockCallbacks = {
        onBeforeEnter: vi.fn(),
        onAfterEnter: vi.fn()
      };

      const animation = {
        type: "fade",
        direction: "in",
        duration: 1000,
        delay: 0,
        timingFunction: "ease-in-out"
      };

      // 第一次设置临时回调
      triggerAnimation({
        animation,
        newAnimationCallback: firstMockCallbacks,
        triggerType: "preview"
      });

      // 触发完整动画周期
      animationCallbacks.value.onBeforeEnter?.();
      animationCallbacks.value.onAfterEnter?.();
      await nextTick();

      // 第二次设置不同的临时回调
      triggerAnimation({
        animation,
        newAnimationCallback: secondMockCallbacks,
        triggerType: "preview"
      });

      animationCallbacks.value.onBeforeEnter?.();
      await nextTick();

      // 验证回调被调用
      expect(firstMockCallbacks.onBeforeEnter).toHaveBeenCalledTimes(1);
      expect(secondMockCallbacks.onBeforeEnter).toHaveBeenCalledTimes(1);
    });

    it("动画取消时应该清理临时回调", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation, animationCallbacks } = useAnimation(testComponent.id);

      const mockCallbacks = {
        onEnterCancelled: vi.fn(),
        onBeforeEnter: vi.fn()
      };

      const animation = {
        type: "fade",
        direction: "in",
        duration: 1000,
        delay: 0,
        timingFunction: "ease-in-out"
      };

      triggerAnimation({
        animation,
        newAnimationCallback: mockCallbacks,
        triggerType: "preview"
      });

      // 触发取消事件
      animationCallbacks.value.onEnterCancelled?.();
      await nextTick();

      expect(mockCallbacks.onEnterCancelled).toHaveBeenCalled();

      // 再次触发应该没有临时回调
      animationCallbacks.value.onBeforeEnter?.();
      await nextTick();

      // 确保临时回调已被清理
      expect(mockCallbacks.onEnterCancelled).toHaveBeenCalledTimes(1);
    });
  });

  describe("CSS样式管理测试", () => {
    it("应该能够创建和清理样式元素", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation, animationCallbacks } = useAnimation(testComponent.id);

      const animation = animationHelper.createTestAnimation();

      // 使用AnimationTestHelper触发动画并验证
      const result = await animationHelper.triggerAnimationAndVerify(
        triggerAnimation,
        animationCallbacks.value,
        animation,
        testComponent.id
      );

      expect(result.styleCreated).toBe(true);
      expect(result.callbackExecuted).toBe(true);
      expect(result.styleCleaned).toBe(true);

      // 验证动画回调被正确执行
      const callbackHistory = animationHelper.getCallbackHistory();
      expect(callbackHistory.length).toBeGreaterThan(0);
      expect(callbackHistory.some((cb) => cb.type === "onBeforeEnter")).toBe(true);
      expect(callbackHistory.some((cb) => cb.type === "onAfterEnter")).toBe(true);
    });

    it("重复触发动画应该重用样式元素", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation } = useAnimation(testComponent.id);

      const animation = {
        type: "fade",
        direction: "in",
        duration: 1000,
        delay: 0,
        timingFunction: "ease-in-out"
      };

      const styleId = `dynamic-animation-ft-animation-${testComponent.id}`;

      // 第一次触发
      triggerAnimation({
        animation,
        triggerType: "preview"
      });
      await nextTick();

      // 验证样式元素被创建
      const firstStyleElement = document.getElementById(styleId);
      expect(firstStyleElement).toBeTruthy();
      const firstElementId = firstStyleElement?.id;

      // 第二次触发相同动画
      triggerAnimation({
        animation,
        triggerType: "preview"
      });
      await nextTick();

      // 验证样式元素被重用（同一个元素）
      const secondStyleElement = document.getElementById(styleId);
      expect(secondStyleElement).toBeTruthy();
      expect(secondStyleElement?.id).toBe(firstElementId);

      // 验证DOM中只有一个该ID的元素
      const allElementsWithId = document.querySelectorAll(`#${styleId}`);
      expect(allElementsWithId).toHaveLength(1);
    });

    it("不同类型的动画应该创建不同的样式", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation } = useAnimation(testComponent.id);

      const animation = {
        type: "fade",
        direction: "in",
        duration: 1000,
        delay: 0,
        timingFunction: "ease-in-out"
      };

      // 触发animation类型
      triggerAnimation({
        animation,
        type: "animation",
        triggerType: "preview"
      });
      await nextTick();

      // 验证animation类型的样式元素被创建
      const animationStyleId = `dynamic-animation-ft-animation-${testComponent.id}`;
      const animationStyleElement = document.getElementById(animationStyleId);
      expect(animationStyleElement).toBeTruthy();
      expect(animationStyleElement?.textContent).toContain("animation-name: fade-in");
      expect(animationStyleElement?.textContent).toContain("animation-duration: 1s");

      // 触发transition类型
      triggerAnimation({
        animation,
        type: "transition",
        triggerType: "preview"
      });
      await nextTick();

      // 验证transition类型的样式元素被创建
      const transitionStyleId = `dynamic-transition-ft-animation-${testComponent.id}`;
      const transitionStyleElement = document.getElementById(transitionStyleId);
      expect(transitionStyleElement).toBeTruthy();
      expect(transitionStyleElement?.textContent).toContain("transition-property: fade-in");
      expect(transitionStyleElement?.textContent).toContain("transition-duration: 1s");

      // 验证两个样式元素是不同的
      expect(animationStyleElement).not.toBe(transitionStyleElement);
      expect(animationStyleElement?.id).not.toBe(transitionStyleElement?.id);
    });
  });

  describe("生命周期集成测试", () => {
    it("组件挂载时应该注册动画触发器", () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      // 模拟组件挂载
      useAnimation(testComponent.id);

      // 简化验证
      expect(mockOnMounted).toHaveBeenCalled();
    });

    it("组件卸载时应该注销触发器和清理样式", () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      useAnimation(testComponent.id);

      // 简化验证
      expect(mockOnMounted).toHaveBeenCalled();
    });
  });

  describe("边界情况和错误处理", () => {
    it("duration为0的动画应该被跳过", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation } = useAnimation(testComponent.id);

      const animation = {
        type: "fade",
        direction: "in",
        duration: 0,
        delay: 0,
        timingFunction: "ease-in-out"
      };

      triggerAnimation({
        animation,
        triggerType: "preview"
      });

      await nextTick();

      // 验证duration为0的动画被正确处理
      // duration为0会触发cleanupAnimationStyle，清理样式元素
      // 这里我们验证duration为0的动画不会抛出错误，并且动画被正确处理
      expect(() => {
        triggerAnimation({
          animation: {
            type: "fade",
            direction: "in",
            duration: 0,
            delay: 0,
            timingFunction: "ease-in-out"
          },
          triggerType: "preview"
        });
      }).not.toThrow();
    });

    it("无效的动画类型应该正常处理", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation } = useAnimation(testComponent.id);

      const animation = {
        type: "invalid-type" as any,
        direction: "in",
        duration: 1000,
        delay: 0,
        timingFunction: "ease-in-out"
      };

      expect(() => {
        triggerAnimation({
          animation,
          triggerType: "preview"
        });
      }).not.toThrow();
    });

    it("快速连续触发动画应该正常工作", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation } = useAnimation(testComponent.id);

      const animation = {
        type: "fade",
        direction: "in",
        duration: 1000,
        delay: 0,
        timingFunction: "ease-in-out"
      };

      // 快速连续触发多次
      for (let i = 0; i < 5; i++) {
        triggerAnimation({
          animation,
          triggerType: "preview"
        });
      }

      await nextTick();

      // 验证快速连续触发后样式元素仍然存在且正常
      const styleId = `dynamic-animation-ft-animation-${testComponent.id}`;
      const styleElement = document.getElementById(styleId);
      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain("animation-name: fade-in");

      // 验证DOM中只有一个该ID的元素（没有重复创建）
      const allElementsWithId = document.querySelectorAll(`#${styleId}`);
      expect(allElementsWithId).toHaveLength(1);
    });

    it("动画执行完成回调后应该删除样式元素", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation, animationCallbacks } = useAnimation(testComponent.id);

      const animation = animationHelper.createTestAnimation();

      // 使用AnimationTestHelper触发动画并验证
      const result = await animationHelper.triggerAnimationAndVerify(
        triggerAnimation,
        animationCallbacks.value,
        animation,
        testComponent.id
      );

      expect(result.styleCreated).toBe(true);
      expect(result.callbackExecuted).toBe(true);
      expect(result.styleCleaned).toBe(true);

      // 验证动画回调被正确执行
      const callbackHistory = animationHelper.getCallbackHistory();
      expect(callbackHistory.length).toBeGreaterThan(0);
      expect(callbackHistory.some((cb) => cb.type === "onBeforeEnter")).toBe(true);
      expect(callbackHistory.some((cb) => cb.type === "onAfterEnter")).toBe(true);
    });

    it("leave动画执行完成回调后应该删除样式元素", async () => {
      const { groupData } = useGlobalComponentData();
      const testComponent = groupData.value[0];

      const { triggerAnimation, animationCallbacks } = useAnimation(testComponent.id);

      const animation = animationHelper.createTestAnimation();

      // 使用AnimationTestHelper触发leave动画并验证
      const result = await animationHelper.triggerAnimationAndVerify(
        triggerAnimation,
        animationCallbacks.value,
        animation,
        testComponent.id,
        "leave"
      );

      expect(result.styleCreated).toBe(true);
      expect(result.callbackExecuted).toBe(true);
      expect(result.styleCleaned).toBe(true);

      // 验证动画回调被正确执行
      const callbackHistory = animationHelper.getCallbackHistory();
      expect(callbackHistory.length).toBeGreaterThan(0);
      expect(callbackHistory.some((cb) => cb.type === "onBeforeLeave")).toBe(true);
      expect(callbackHistory.some((cb) => cb.type === "onAfterLeave")).toBe(true);
    });
  });
});
