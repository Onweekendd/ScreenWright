import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";

import type { Animation } from "../type";
import type { AnimationCallbacks } from "./useGlobalAnimation";
import { useGlobalAnimation } from "./useGlobalAnimation";

/**
 * 动画相关的组合式函数
 * @param props 组件属性
 * @returns 动画相关的响应式数据和方法
 */
export function useAnimation(componentId: string | number) {
  const { registerAnimationTrigger, unregisterAnimationTrigger } = useGlobalAnimation();
  /**
   * 动画类名
   */
  const animationClassName = computed(() => {
    return `ft-animation-${componentId}`;
  });

  const previewFlag = ref(true);

  const isPlay = ref(false);

  /**
   * 存储已创建的样式元素ID，用于清理
   */
  const createdStyleId = ref("");

  /**
   * 内置的动画回调逻辑，负责管理 isPlay 状态和清理样式
   */
  const internalCallbacks: AnimationCallbacks = {
    onBeforeEnter: () => {
      isPlay.value = true;
    },
    onEnter: () => {},
    onAfterEnter: () => {
      isPlay.value = false;
      // 动画结束后清理样式，避免残留样式
      cleanupAnimationStyle();
    },
    onBeforeLeave: () => {
      isPlay.value = true;
    },
    onLeave: () => {},
    onAfterLeave: () => {
      isPlay.value = false;
      // 动画结束后清理样式，避免残留样式
      cleanupAnimationStyle();
    },
    onEnterCancelled: () => {
      isPlay.value = false;
    },
    onLeaveCancelled: () => {
      isPlay.value = false;
    }
  };

  /**
   * 临时的一次性回调队列
   */
  const temporaryCallbacks = ref<AnimationCallbacks | null>(null);

  /**
   * 计算最终的动画回调，内置逻辑 + 临时回调
   */
  const animationCallbacks = computed<AnimationCallbacks>(() => {
    const temp = temporaryCallbacks.value;
    return {
      onBeforeEnter: () => {
        internalCallbacks.onBeforeEnter?.();
        temp?.onBeforeEnter?.();
      },
      onEnter: () => {
        internalCallbacks.onEnter?.();
        temp?.onEnter?.();
      },
      onAfterEnter: () => {
        temp?.onAfterEnter?.();
        internalCallbacks.onAfterEnter?.();
        // 执行完毕后清理临时回调
        temporaryCallbacks.value = null;
      },
      onBeforeLeave: () => {
        internalCallbacks.onBeforeLeave?.();
        temp?.onBeforeLeave?.();
      },
      onLeave: () => {
        internalCallbacks.onLeave?.();
        temp?.onLeave?.();
      },
      onAfterLeave: () => {
        temp?.onAfterLeave?.();
        internalCallbacks.onAfterLeave?.();
        // 执行完毕后清理临时回调
        temporaryCallbacks.value = null;
      },
      onEnterCancelled: () => {
        temp?.onEnterCancelled?.();
        internalCallbacks.onEnterCancelled?.();
        // 取消时也清理临时回调
        temporaryCallbacks.value = null;
      },
      onLeaveCancelled: () => {
        temp?.onLeaveCancelled?.();
        internalCallbacks.onLeaveCancelled?.();
        // 取消时也清理临时回调
        temporaryCallbacks.value = null;
      }
    };
  });

  const generateAnimationName = (animationType: string, direction?: string) => {
    return animationType.startsWith("opacity-") || !direction ? animationType : `${animationType}-${direction}`;
  };

  /**
   * 生成CSS样式
   * @param {Animation} animation 动画配置
   * @param {string} className CSS类名
   * @param {"animation" | "transition"} type 样式类型
   * @returns {string} CSS样式字符串
   */
  function generateCSS({
    animation,
    className,
    triggerType,
    type,
    needImportant
  }: {
    animation: Animation;
    className: string;
    triggerType: "enter" | "leave";
    type: "animation" | "transition";
    needImportant?: boolean;
  }): string {
    const { type: animationType, direction, duration, timingFunction, delay } = animation;
    const name = generateAnimationName(animationType, direction);
    const important = needImportant ? " !important" : "";

    let cssStr = `.${className}-${triggerType}-active {\n`;

    if (type === "animation") {
      cssStr += `  animation-name: ${name}${important};\n`;
      cssStr += `  animation-duration: ${duration / 1000}s${important};\n`;
      cssStr += `  animation-timing-function: ${timingFunction}${important};\n`;
      cssStr += `  animation-delay: ${delay / 1000}s${important};\n`;
      cssStr += `  animation-fill-mode: both${important};\n`;
    } else {
      cssStr += `  transition-property: ${name}${important};\n`;
      cssStr += `  transition-duration: ${duration / 1000}s${important};\n`;
      cssStr += `  transition-timing-function: ${timingFunction}${important};\n`;
      cssStr += `  transition-delay: ${delay / 1000}s${important};\n`;
    }

    cssStr += "}\n";
    return cssStr;
  }

  /**
   * 清理动画样式
   */
  function cleanupAnimationStyle(): void {
    const element = document.getElementById(createdStyleId.value);
    if (element) {
      element.remove();
    }

    // 重置动画播放状态
    isPlay.value = false;
  }

  /**
   * 创建或获取样式元素
   * @param styleId 样式元素ID
   * @returns HTMLStyleElement
   */
  function getOrCreateStyleElement(styleId: string): HTMLStyleElement {
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
      createdStyleId.value = styleId;
    }

    return styleElement;
  }

  /**
   * 设置临时的一次性动画回调
   * @param newAnimationCallback 新的动画回调，执行完一次后自动清理
   */
  function updateAnimationCallbacks(newAnimationCallback?: AnimationCallbacks): void {
    temporaryCallbacks.value = newAnimationCallback || null;
  }

  /**
   * 处理预览模式
   */
  function handlePreviewMode(): void {
    previewFlag.value = false;
    nextTick(() => {
      previewFlag.value = true;
    });
  }

  function handleLeaveMode(): void {
    previewFlag.value = false;
  }

  function handleEnterMode(): void {
    previewFlag.value = true;
  }

  const triggerByType = (triggerType: string) => {
    if (triggerType === "preview") {
      handlePreviewMode();
    } else if (triggerType === "leave") {
      handleLeaveMode();
    } else if (triggerType === "enter") {
      handleEnterMode();
    }
  };

  /**
   * 应用样式
   * @param animation 动画配置
   * @param triggerType 触发类型
   * @param type 样式类型
   * @param needImportant css属性 是否需要 !important
   */
  function applyStyle(
    animation: Animation,
    triggerType: "enter" | "leave",
    type: "animation" | "transition",
    needImportant = false
  ): void {
    const cssContent = generateCSS({
      animation,
      className: animationClassName.value,
      triggerType,
      type,
      needImportant
    });

    const styleId = `dynamic-${type}-${animationClassName.value}`;
    const styleElement = getOrCreateStyleElement(styleId);
    styleElement.textContent = cssContent;
  }

  function triggerAnimation({
    animation,
    type = "animation",
    newAnimationCallback,
    triggerType,
    needImportant
  }: {
    animation: Animation;
    type?: "animation" | "transition";
    newAnimationCallback?: AnimationCallbacks;
    triggerType: "enter" | "leave" | "preview";
    needImportant?: boolean;
  }): void {
    // 如果动画类型是none，清理样式并退出
    if (animation.type === "none" || animation.duration === 0) {
      cleanupAnimationStyle();
      return;
    }

    // 应用样式
    const actualTriggerType = triggerType === "preview" ? "enter" : triggerType;
    applyStyle(animation, actualTriggerType, type, needImportant);

    // 更新动画回调
    updateAnimationCallbacks(newAnimationCallback);

    triggerByType(triggerType);
  }

  onMounted(() => {
    registerAnimationTrigger(componentId.toString(), triggerAnimation);
  });

  // 组件卸载时清理动态样式
  onUnmounted(() => {
    unregisterAnimationTrigger(componentId.toString());
    cleanupAnimationStyle();
  });

  return {
    animationClassName,
    animationCallbacks,
    previewFlag,
    isPlay,
    triggerAnimation
  };
}
