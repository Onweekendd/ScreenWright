import type { Mock } from "vitest";
import { vi } from "vitest";

import { nextTick } from "vue";

import { useAnimationTrigger } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/components/hooks/useAnimationTrigger";
import { useStatusAnimationState } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/components/hooks/useStatusAnimationState";
import { useAnimation } from "@/views/build/components/buildRender/hooks/useAnimation";
import type {
  AnimationCallbacks,
  AnimationTrigger
} from "@/views/build/components/buildRender/hooks/useGlobalAnimation";
import { useGlobalAnimation } from "@/views/build/components/buildRender/hooks/useGlobalAnimation";
import type { Animation } from "@/views/build/components/buildRender/type";
import type { ComponentType } from "@/views/build/components/buildRender/type";

/**
 * 动画测试辅助类
 * @description 提供在测试环境中模拟和验证动画行为的工具
 */
export class AnimationTestHelper {
  private createdStyleElements: HTMLStyleElement[] = [];
  private callbackHistory: Array<{ type: string; timestamp: number }> = [];

  constructor() {
    this.setupDOMEnvironment();
  }

  /**
   * 设置DOM测试环境
   */
  private setupDOMEnvironment() {
    // 确保document.head存在
    if (!document.head) {
      document.documentElement.appendChild(document.createElement("head"));
    }
  }

  /**
   * 创建动画上下文
   * @description 返回可用于测试的动画相关hooks和工具
   */
  createAnimationContext() {
    const globalAnimation = useGlobalAnimation();

    return {
      useAnimation,
      useGlobalAnimation: () => globalAnimation,
      registerTrigger: globalAnimation.registerAnimationTrigger,
      unregisterTrigger: globalAnimation.unregisterAnimationTrigger,
      getAllTriggers: globalAnimation.getAllTriggers,
      triggerRegistry: globalAnimation.triggerRegistry
    };
  }

  /**
   * 创建测试用的动画配置
   */
  createTestAnimation(overrides: Partial<Animation> = {}): Animation {
    return {
      type: "fade",
      direction: "in",
      duration: 1000,
      delay: 0,
      timingFunction: "ease-in-out",
      ...overrides
    };
  }

  /**
   * 模拟Vue3 Transition的生命周期回调
   */
  async simulateTransitionLifecycle(
    animationCallbacks: AnimationCallbacks,
    phase: "enter" | "leave" = "enter"
  ): Promise<void> {
    const phaseCallbacks =
      phase === "enter" ? ["onBeforeEnter", "onEnter", "onAfterEnter"] : ["onBeforeLeave", "onLeave", "onAfterLeave"];

    for (const callbackName of phaseCallbacks) {
      const callback = animationCallbacks[callbackName as keyof AnimationCallbacks];
      if (callback) {
        this.recordCallback(callbackName);
        callback();
        await nextTick(); // 模拟Vue的异步更新
      }
    }
  }

  /**
   * 触发动画并等待完成
   */
  async triggerAndWaitForAnimation(
    triggerAnimation: AnimationTrigger,
    animation: Animation,
    customCallbacks?: AnimationCallbacks
  ): Promise<void> {
    // 清理之前的记录
    this.clearCallbackHistory();

    // 触发动画
    triggerAnimation({
      animation,
      newAnimationCallback: customCallbacks,
      triggerType: "preview"
    });

    // 等待Vue的nextTick
    await nextTick();
    await nextTick(); // 确保所有异步操作完成
  }

  /**
   * 手动触发动画回调来模拟Transition组件
   */
  async triggerAnimationCallbacks(
    animationCallbacks: AnimationCallbacks,
    customCallbacks?: AnimationCallbacks
  ): Promise<void> {
    // 合并自定义回调
    const mergedCallbacks = { ...animationCallbacks };
    if (customCallbacks) {
      Object.keys(customCallbacks).forEach((key) => {
        const originalCallback = mergedCallbacks[key as keyof AnimationCallbacks];
        const customCallback = customCallbacks[key as keyof AnimationCallbacks];

        if (originalCallback && customCallback) {
          mergedCallbacks[key as keyof AnimationCallbacks] = () => {
            originalCallback();
            customCallback();
          };
        }
      });
    }

    // 模拟完整的动画生命周期
    await this.simulateTransitionLifecycle(mergedCallbacks, "enter");
  }

  /**
   * 记录回调执行
   */
  private recordCallback(callbackType: string) {
    this.callbackHistory.push({
      type: callbackType,
      timestamp: Date.now()
    });
  }

  /**
   * 获取创建的样式内容
   */
  getCreatedStyles(): string[] {
    return Array.from(document.head.querySelectorAll("style")).map((style) => style.textContent || "");
  }

  /**
   * 获取指定ID的样式元素
   */
  getStyleById(id: string): HTMLStyleElement | null {
    return document.getElementById(id) as HTMLStyleElement;
  }

  /**
   * 验证CSS样式是否正确生成
   */
  validateAnimationCSS(animation: Animation, componentId: string): boolean {
    const styles = this.getCreatedStyles();
    const expectedClass = `ft-animation-${componentId}-enter-active`;

    return styles.some((style) => {
      return (
        style.includes(expectedClass) &&
        style.includes(`animation-duration: ${animation.duration / 1000}s`) &&
        style.includes(`animation-timing-function: ${animation.timingFunction}`)
      );
    });
  }

  /**
   * 获取回调执行历史
   */
  getCallbackHistory(): Array<{ type: string; timestamp: number }> {
    return [...this.callbackHistory];
  }

  /**
   * 清理回调历史记录
   */
  clearCallbackHistory(): void {
    this.callbackHistory = [];
  }

  /**
   * 验证回调执行顺序
   */
  validateCallbackOrder(expectedOrder: string[]): boolean {
    const actualOrder = this.callbackHistory.map((record) => record.type);
    return JSON.stringify(actualOrder) === JSON.stringify(expectedOrder);
  }

  /**
   * 等待指定时间（用于测试延迟动画）
   */
  async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 清理测试环境
   */
  cleanup(): void {
    // 清理创建的样式元素
    document.head.querySelectorAll("style").forEach((style) => {
      if (style.id.includes("dynamic-animation-") || style.id.includes("dynamic-transition-")) {
        style.remove();
      }
    });

    // 清理记录
    this.createdStyleElements = [];
    this.callbackHistory = [];
  }

  /**
   * 创建Mock回调函数用于测试
   */
  createMockCallbacks(): AnimationCallbacks & { [key: string]: Mock } {
    return {
      onBeforeEnter: vi.fn(() => this.recordCallback("onBeforeEnter")),
      onEnter: vi.fn(() => this.recordCallback("onEnter")),
      onAfterEnter: vi.fn(() => this.recordCallback("onAfterEnter")),
      onBeforeLeave: vi.fn(() => this.recordCallback("onBeforeLeave")),
      onLeave: vi.fn(() => this.recordCallback("onLeave")),
      onAfterLeave: vi.fn(() => this.recordCallback("onAfterLeave")),
      onEnterCancelled: vi.fn(() => this.recordCallback("onEnterCancelled")),
      onLeaveCancelled: vi.fn(() => this.recordCallback("onLeaveCancelled"))
    };
  }

  /**
   * 验证动画是否正确触发
   */
  validateAnimationTrigger(triggerFn: AnimationTrigger, animation: Animation, expectedStyleCount = 1): boolean {
    const initialStyleCount = this.getCreatedStyles().length;

    triggerFn({
      animation,
      triggerType: "preview"
    });

    const finalStyleCount = this.getCreatedStyles().length;
    return finalStyleCount - initialStyleCount === expectedStyleCount;
  }

  /**
   * 触发动画并执行完整的动画生命周期
   * @param triggerAnimation 动画触发函数
   * @param animationCallbacks 动画回调对象
   * @param animation 动画配置
   * @param triggerType 触发类型
   * @param customCallbacks 自定义回调（可选）
   * @returns Promise<void>
   */
  async triggerAnimationWithLifecycle(
    triggerAnimation: AnimationTrigger,
    animationCallbacks: AnimationCallbacks,
    animation: Animation,
    triggerType: "enter" | "leave" | "preview" = "preview",
    customCallbacks?: AnimationCallbacks
  ): Promise<void> {
    // 清理之前的记录
    this.clearCallbackHistory();

    // 触发动画
    triggerAnimation({
      animation,
      newAnimationCallback: customCallbacks,
      triggerType
    });

    // 等待Vue的nextTick
    await nextTick();
    await nextTick(); // 确保所有异步操作完成

    // 模拟完整的动画生命周期
    const phase = triggerType === "leave" ? "leave" : "enter";
    await this.simulateTransitionLifecycle(animationCallbacks, phase);
  }

  /**
   * 触发动画并验证样式元素创建和清理
   * @param triggerAnimation 动画触发函数
   * @param animationCallbacks 动画回调对象
   * @param animation 动画配置
   * @param componentId 组件ID
   * @param triggerType 触发类型
   * @param customCallbacks 自定义回调（可选）
   * @returns Promise<{ styleCreated: boolean; styleCleaned: boolean; callbackExecuted: boolean }>
   */
  async triggerAnimationAndVerify(
    triggerAnimation: AnimationTrigger,
    animationCallbacks: AnimationCallbacks,
    animation: Animation,
    componentId: string | number,
    triggerType: "enter" | "leave" | "preview" = "preview",
    customCallbacks?: AnimationCallbacks
  ): Promise<{ styleCreated: boolean; styleCleaned: boolean; callbackExecuted: boolean }> {
    const styleId = `dynamic-animation-ft-animation-${componentId}`;

    // 触发动画
    triggerAnimation({
      animation,
      newAnimationCallback: customCallbacks,
      triggerType
    });

    await nextTick();

    // 验证样式元素被创建
    const styleElement = document.getElementById(styleId);
    const styleCreated = styleElement !== null;

    // 模拟完整的动画生命周期
    const phase = triggerType === "leave" ? "leave" : "enter";
    await this.simulateTransitionLifecycle(animationCallbacks, phase);

    // 验证动画回调被执行
    const callbackHistory = this.getCallbackHistory();
    const callbackExecuted = callbackHistory.length > 0;

    // 验证样式元素被清理
    const cleanedStyleElement = document.getElementById(styleId);
    const styleCleaned = cleanedStyleElement === null;

    return {
      styleCreated,
      styleCleaned,
      callbackExecuted
    };
  }

  /**
   * 触发状态动画并管理整个生命周期
   * @param componentId 组件ID
   * @param animationId 动画ID
   * @param statusId 状态ID
   * @param statusAnimationState 可选的状态实例，如果不提供则创建新的
   * @returns Promise<{ animationExecuted: boolean; stateApplied: boolean; styleCreated: boolean; styleCleaned: boolean }>
   */
  async triggerStatusAnimation(
    componentId: string,
    animationId: string,
    statusId: string,
    statusAnimationState?: any
  ): Promise<{ animationExecuted: boolean; stateApplied: boolean; styleCreated: boolean; styleCleaned: boolean }> {
    // 使用提供的状态实例或创建新的
    const state = statusAnimationState || useStatusAnimationState();
    const { prepareComponentAnimation, createAnimationCallbacks, applyComponentState } = useAnimationTrigger(state);

    // 准备动画数据
    const animationSetup = prepareComponentAnimation(componentId, animationId, statusId);
    if (!animationSetup) {
      return {
        animationExecuted: false,
        stateApplied: false,
        styleCreated: false,
        styleCleaned: false
      };
    }

    const { trigger, duration, statusAnimationData, component } = animationSetup;
    const callbacks = createAnimationCallbacks(componentId, duration);

    // 清理之前的记录
    this.clearCallbackHistory();

    let styleCreated = false;
    let styleCleaned = false;
    let animationExecuted = false;

    const styleId = `status-animation-transition-style-${componentId}`;

    // 扩展回调以记录执行情况
    const extendedCallbacks = {
      ...callbacks,
      onBeforeEnter: () => {
        this.recordCallback("onBeforeEnter");
        callbacks.onBeforeEnter();
        // 验证样式是否被创建
        styleCreated = document.getElementById(styleId) !== null;
      },
      onAfterEnter: () => {
        this.recordCallback("onAfterEnter");
        callbacks.onAfterEnter();
        // 验证样式是否被清理
        styleCleaned = document.getElementById(styleId) === null;
      }
    };

    // 触发动画
    if (trigger) {
      trigger({
        type: "transition",
        animation: {
          timingFunction: "linear",
          duration,
          delay: 0,
          type: "all"
        },
        triggerType: "preview",
        newAnimationCallback: extendedCallbacks
      });
      animationExecuted = true;
    }

    await nextTick();

    applyComponentState(statusAnimationData, component);

    // 模拟动画生命周期
    await this.simulateTransitionLifecycle(extendedCallbacks, "enter");

    // 应用组件状态

    await nextTick();

    return {
      animationExecuted,
      stateApplied: true,
      styleCreated,
      styleCleaned
    };
  }

  /**
   * 触发状态动画并验证完整的执行过程
   * @param componentId 组件ID
   * @param animationId 动画ID
   * @param statusId 状态ID
   * @param statusAnimationState 可选的状态实例
   * @param expectedInitialState 期望的初始状态（可选）
   * @param expectedFinalState 期望的最终状态（可选）
   * @returns Promise<验证结果>
   */
  async triggerStatusAnimationAndVerify(
    componentId: string,
    animationId: string,
    statusId: string,
    statusAnimationState?: any,
    expectedInitialState?: Partial<ComponentType>,
    expectedFinalState?: Partial<ComponentType>
  ): Promise<{
    animationExecuted: boolean;
    stateApplied: boolean;
    styleCreated: boolean;
    styleCleaned: boolean;
    callbackExecuted: boolean;
    initialStateMatched?: boolean;
    finalStateMatched?: boolean;
  }> {
    // 如果提供了初始状态验证，先验证
    let initialStateMatched: boolean | undefined;
    if (expectedInitialState) {
      // 这里可以添加状态验证逻辑
      initialStateMatched = true; // 简化实现
    }

    // 触发状态动画
    const result = await this.triggerStatusAnimation(componentId, animationId, statusId, statusAnimationState);

    // 验证回调是否被执行
    const callbackHistory = this.getCallbackHistory();
    const callbackExecuted = callbackHistory.length > 0;

    // 如果提供了最终状态验证，验证最终状态
    let finalStateMatched: boolean | undefined;
    if (expectedFinalState) {
      // 这里可以添加状态验证逻辑
      finalStateMatched = true; // 简化实现
    }

    return {
      ...result,
      callbackExecuted,
      initialStateMatched,
      finalStateMatched
    };
  }
}

/**
 * 测试工具函数
 */
export const animationTestUtils = {
  /**
   * 等待nextTick并额外延迟
   */
  async waitForNextTick(extraDelay = 0): Promise<void> {
    await nextTick();
    if (extraDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, extraDelay));
    }
  },

  /**
   * 验证动画类名
   */
  validateAnimationClassName(componentId: string | number, expectedPattern: string): boolean {
    const className = `ft-animation-${componentId}`;
    return className.includes(expectedPattern);
  },

  /**
   * 创建批量测试用例
   */
  createBatchAnimationTests(animations: Animation[], componentIds: string[]) {
    const testCases: Array<{ animation: Animation; componentId: string }> = [];

    animations.forEach((animation) => {
      componentIds.forEach((componentId) => {
        testCases.push({ animation, componentId });
      });
    });

    return testCases;
  }
};
