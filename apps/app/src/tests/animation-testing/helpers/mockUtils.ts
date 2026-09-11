import type { Mock } from "vitest";
import { vi } from "vitest";

import { nextTick } from "vue";

import type { AnimationCallbacks } from "@/views/build/components/buildRender/hooks/useGlobalAnimation";

/**
 * Vue3 Transition 模拟器
 * @description 模拟Vue3 Transition组件的生命周期行为，用于测试动画回调
 */
export class Vue3TransitionMock {
  private isEntering = false;
  private isLeaving = false;
  private currentCallbacks: AnimationCallbacks | null = null;
  private animationDuration = 1000;
  private timers: NodeJS.Timeout[] = [];

  constructor(defaultDuration = 1000) {
    this.animationDuration = defaultDuration;
  }

  /**
   * 设置当前动画回调
   */
  setCallbacks(callbacks: AnimationCallbacks): void {
    this.currentCallbacks = callbacks;
  }

  /**
   * 设置动画持续时间
   */
  setDuration(duration: number): void {
    this.animationDuration = duration;
  }

  /**
   * 模拟进入动画
   */
  async simulateEnter(): Promise<void> {
    if (this.isEntering || this.isLeaving) {
      await this.cancelCurrentAnimation();
    }

    this.isEntering = true;

    // 1. onBeforeEnter
    await this.triggerCallback("onBeforeEnter");
    await nextTick();

    // 2. onEnter (立即触发)
    await this.triggerCallback("onEnter");
    await nextTick();

    // 3. 等待动画时间，然后触发 onAfterEnter
    await this.waitForAnimation();

    if (this.isEntering) {
      // 检查是否被取消
      await this.triggerCallback("onAfterEnter");
      this.isEntering = false;
    }
  }

  /**
   * 模拟离开动画
   */
  async simulateLeave(): Promise<void> {
    if (this.isEntering || this.isLeaving) {
      await this.cancelCurrentAnimation();
    }

    this.isLeaving = true;

    // 1. onBeforeLeave
    await this.triggerCallback("onBeforeLeave");
    await nextTick();

    // 2. onLeave
    await this.triggerCallback("onLeave");
    await nextTick();

    // 3. 等待动画时间，然后触发 onAfterLeave
    await this.waitForAnimation();

    if (this.isLeaving) {
      // 检查是否被取消
      await this.triggerCallback("onAfterLeave");
      this.isLeaving = false;
    }
  }

  /**
   * 模拟动画取消
   */
  async cancelCurrentAnimation(): Promise<void> {
    this.clearTimers();

    if (this.isEntering) {
      await this.triggerCallback("onEnterCancelled");
      this.isEntering = false;
    }

    if (this.isLeaving) {
      await this.triggerCallback("onLeaveCancelled");
      this.isLeaving = false;
    }
  }

  /**
   * 模拟快速的enter-leave循环
   */
  async simulateToggle(count = 1): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.simulateEnter();
      await this.simulateLeave();
    }
  }

  /**
   * 检查动画状态
   */
  getState(): { isEntering: boolean; isLeaving: boolean; isActive: boolean } {
    return {
      isEntering: this.isEntering,
      isLeaving: this.isLeaving,
      isActive: this.isEntering || this.isLeaving
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.clearTimers();
    this.isEntering = false;
    this.isLeaving = false;
    this.currentCallbacks = null;
  }

  /**
   * 等待动画时间
   */
  private waitForAnimation(): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, this.animationDuration);
      this.timers.push(timer);
    });
  }

  /**
   * 触发回调
   */
  private async triggerCallback(callbackName: keyof AnimationCallbacks): Promise<void> {
    const callback = this.currentCallbacks?.[callbackName];
    if (callback) {
      callback();
      await nextTick();
    }
  }

  /**
   * 清理定时器
   */
  private clearTimers(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }
}

/**
 * 简化的Transition模拟函数
 */
export const mockTransition = {
  /**
   * 快速模拟完整的进入动画
   */
  async enter(callbacks: AnimationCallbacks, duration = 100): Promise<void> {
    const mock = new Vue3TransitionMock(duration);
    mock.setCallbacks(callbacks);
    await mock.simulateEnter();
    mock.cleanup();
  },

  /**
   * 快速模拟完整的离开动画
   */
  async leave(callbacks: AnimationCallbacks, duration = 100): Promise<void> {
    const mock = new Vue3TransitionMock(duration);
    mock.setCallbacks(callbacks);
    await mock.simulateLeave();
    mock.cleanup();
  },

  /**
   * 模拟进入-离开循环
   */
  async toggle(callbacks: AnimationCallbacks, cycles = 1, duration = 100): Promise<void> {
    const mock = new Vue3TransitionMock(duration);
    mock.setCallbacks(callbacks);
    await mock.simulateToggle(cycles);
    mock.cleanup();
  },

  /**
   * 模拟动画中断
   */
  async interrupt(callbacks: AnimationCallbacks, interruptAt: "enter" | "leave" = "enter"): Promise<void> {
    const mock = new Vue3TransitionMock(1000); // 较长的时间，便于中断
    mock.setCallbacks(callbacks);

    if (interruptAt === "enter") {
      // 开始进入动画，但不等待完成
      const enterPromise = mock.simulateEnter();
      await new Promise((resolve) => setTimeout(resolve, 50)); // 等待一小段时间
      await mock.cancelCurrentAnimation();
      await enterPromise.catch(() => {}); // 忽略可能的错误
    } else {
      // 先完成进入，再中断离开
      await mock.simulateEnter();
      const leavePromise = mock.simulateLeave();
      await new Promise((resolve) => setTimeout(resolve, 50));
      await mock.cancelCurrentAnimation();
      await leavePromise.catch(() => {});
    }

    mock.cleanup();
  }
};

/**
 * 动画测试场景生成器
 */
export const animationScenarios = {
  /**
   * 正常动画场景
   */
  normal: (callbacks: AnimationCallbacks) => mockTransition.enter(callbacks),

  /**
   * 快速切换场景
   */
  rapidToggle: (callbacks: AnimationCallbacks) => mockTransition.toggle(callbacks, 3, 50),

  /**
   * 中断场景
   */
  interrupted: (callbacks: AnimationCallbacks) => mockTransition.interrupt(callbacks),

  /**
   * 长时间动画场景
   */
  longAnimation: (callbacks: AnimationCallbacks) => mockTransition.enter(callbacks, 2000),

  /**
   * 批量并发场景
   */
  async concurrent(callbacksList: AnimationCallbacks[], duration = 100): Promise<void> {
    const promises = callbacksList.map((callbacks) => mockTransition.enter(callbacks, duration));
    await Promise.all(promises);
  }
};

/**
 * 创建测试用的Mock回调，带有执行跟踪
 */
export function createTrackedMockCallbacks(): {
  callbacks: AnimationCallbacks & { [key: string]: Mock };
  getExecutionOrder: () => string[];
  getExecutionCount: (callbackName: string) => number;
  reset: () => void;
} {
  const executionOrder: string[] = [];
  const executionCounts: Record<string, number> = {};

  const trackExecution = (name: string) => {
    executionOrder.push(name);
    executionCounts[name] = (executionCounts[name] || 0) + 1;
  };

  const callbacks = {
    onBeforeEnter: vi.fn(() => trackExecution("onBeforeEnter")),
    onEnter: vi.fn(() => trackExecution("onEnter")),
    onAfterEnter: vi.fn(() => trackExecution("onAfterEnter")),
    onBeforeLeave: vi.fn(() => trackExecution("onBeforeLeave")),
    onLeave: vi.fn(() => trackExecution("onLeave")),
    onAfterLeave: vi.fn(() => trackExecution("onAfterLeave")),
    onEnterCancelled: vi.fn(() => trackExecution("onEnterCancelled")),
    onLeaveCancelled: vi.fn(() => trackExecution("onLeaveCancelled"))
  };

  return {
    callbacks,
    getExecutionOrder: () => [...executionOrder],
    getExecutionCount: (callbackName: string) => executionCounts[callbackName] || 0,
    reset: () => {
      executionOrder.length = 0;
      Object.keys(executionCounts).forEach((key) => delete executionCounts[key]);
      Object.values(callbacks).forEach((mock) => mock.mockClear());
    }
  };
}

/**
 * 验证动画回调执行顺序的工具函数
 */
export const callbackOrderValidators = {
  /**
   * 验证正常进入动画的回调顺序
   */
  validateEnterOrder(executionOrder: string[]): boolean {
    const expectedOrder = ["onBeforeEnter", "onEnter", "onAfterEnter"];
    return JSON.stringify(executionOrder) === JSON.stringify(expectedOrder);
  },

  /**
   * 验证正常离开动画的回调顺序
   */
  validateLeaveOrder(executionOrder: string[]): boolean {
    const expectedOrder = ["onBeforeLeave", "onLeave", "onAfterLeave"];
    return JSON.stringify(executionOrder) === JSON.stringify(expectedOrder);
  },

  /**
   * 验证完整切换的回调顺序
   */
  validateToggleOrder(executionOrder: string[]): boolean {
    const expectedOrder = ["onBeforeEnter", "onEnter", "onAfterEnter", "onBeforeLeave", "onLeave", "onAfterLeave"];
    return JSON.stringify(executionOrder) === JSON.stringify(expectedOrder);
  },

  /**
   * 验证中断动画的回调顺序
   */
  validateInterruptedOrder(executionOrder: string[], interruptType: "enter" | "leave"): boolean {
    if (interruptType === "enter") {
      // 进入动画被中断：onBeforeEnter -> onEnter -> onEnterCancelled
      const pattern = /^onBeforeEnter,onEnter,onEnterCancelled$/;
      return pattern.test(executionOrder.join(","));
    } else {
      // 离开动画被中断：完整进入 -> onBeforeLeave -> onLeave -> onLeaveCancelled
      const pattern = /^onBeforeEnter,onEnter,onAfterEnter,onBeforeLeave,onLeave,onLeaveCancelled$/;
      return pattern.test(executionOrder.join(","));
    }
  }
};
