import { nextTick } from "vue";

import { extractComponentId } from "@/utils/utils";
import { ActionTypeEnum } from "@/views/build/components/buildConfig/constants/action";
import type { AnimationTrigger } from "@/views/build/components/buildRender/hooks/useGlobalAnimation";
import type {
  Action,
  ActionAnimation,
  ComponentType,
  Scale,
  Translate
} from "@/views/build/components/buildRender/type";

import {
  calculateTranslateValues,
  createMoveTransform,
  createScaleTransform,
  createTransformOriginStyle,
  getTargetDomElement
} from "./utils";

/**
 * 设置组件的显隐状态
 * @param params 动画参数对象
 * @param params.componentRootDoms 组件DOM元素
 * @param params.animation 动画配置
 * @param params.isHidden 动画状态 隐藏:true, 显示:false
 * @param params.isToggle 是否为显隐切换
 * @param params.globalComponentMap 全局组件配置
 * @returns Promise<void> 当awaitAnimation为true时返回Promise
 */
const setComponentShowAndHide = ({
  componentRootDoms,
  animation,
  isHidden = false,
  isToggle = false,
  globalAnimationTriggers,
  globalComponentMap
}: {
  componentRootDoms: NodeListOf<HTMLElement>;
  animation: ActionAnimation;
  isHidden?: boolean;
  isToggle?: boolean;
  globalComponentMap: Map<string, ComponentType>;
  globalAnimationTriggers?: Map<string, AnimationTrigger>;
}): Promise<void> | void => {
  componentRootDoms.forEach((element) => {
    const component = globalComponentMap.get(element.id);
    if (!component) {
      console.error("组件不存在", element.id);
      return;
    }

    if (!isHidden && !isToggle) {
      component.display = true;
    }

    // 确定需要设置的显隐状态
    const targetVisibilityState = isToggle ? component.display : isHidden;

    const trigger = globalAnimationTriggers?.get(element.id);

    if (trigger) {
      const targetDom = getTargetDomElement(element);
      const generateAnimation = () => {
        return {
          ...animation,
          type: animation.type + (targetVisibilityState ? "1" : "0"),
          delay: 0
        };
      };
      trigger({
        animation: generateAnimation(),
        triggerType: targetVisibilityState ? "leave" : "enter",
        newAnimationCallback: {
          onLeave: () => {
            console.log("onLeave callback executed for", element.id);
          },
          onEnter: () => {
            const scale = {
              lock: true,
              origin: "100% 100%",
              originGrid: {
                left: "center",
                top: "center"
              },
              x: 100,
              y: 100
            };
            targetDom.style.transformOrigin = createTransformOriginStyle(scale);
            targetDom.style.transform = createScaleTransform(scale);
            console.log("onEnter callback executed for", element.id);
          }
        }
      });
    }

    if (isToggle) {
      component.display = !targetVisibilityState;
    } else if (isHidden) {
      component.display = false;
    }
  });
};

/**
 * 设置组件的缩放动画
 * @param params 缩放参数对象
 * @param params.componentRootDoms 组件DOM元素
 * @param params.animation 动画配置
 * @param params.scale 缩放选项
 * @param params.action 动作类型
 * @param params.globalAnimationTriggers 全局动画触发器
 */
const setComponentScaling = async ({
  componentRootDoms,
  animation,
  scale,
  action,
  globalAnimationTriggers,
  globalComponentMap
}: {
  componentRootDoms: NodeListOf<HTMLElement>;
  animation: ActionAnimation;
  scale: Scale;
  action: ActionTypeEnum.ScalingHide | ActionTypeEnum.Scaling;
  globalComponentMap: Map<string, ComponentType>;
  globalAnimationTriggers?: Map<string, AnimationTrigger>;
}): Promise<void> => {
  const isScalingHide = action === ActionTypeEnum.ScalingHide;
  componentRootDoms.forEach(async (element: HTMLElement) => {
    const trigger = globalAnimationTriggers?.get(element.id);
    const component = globalComponentMap.get(element.id);
    if (!component) {
      return;
    }

    if (trigger) {
      const targetDom = getTargetDomElement(element);
      const styleId = `scaling-animation-style-${element.id}`;
      const duration = animation.duration || 500;
      const timingFunction = animation.timingFunction || "linear";

      requestAnimationFrame(() => {
        // 创建 transition 样式（在 trigger 前注入，Vue 应用 -enter-active class 之前已就绪）
        const style = document.createElement("style");
        style.id = styleId;
        const transitionProps = [
          `transform ${duration}ms ${timingFunction}`,
          `transform-origin ${duration}ms ${timingFunction}`
        ];
        if (isScalingHide) {
          transitionProps.unshift(`opacity ${duration / 2}ms ease-out`);
        }
        style.textContent = `
          .ft-animation-${element.id}-enter-active {
            transition: ${transitionProps.join(", ")} !important;
          }
        `;
        document.head.appendChild(style);

        trigger({
          animation: {
            ...animation,
            type: "transform"
          },
          type: "transition",
          newAnimationCallback: {
            onBeforeEnter: async () => {
              await nextTick();
              // 设置 transform-origin 和初始变换
              targetDom.style.transformOrigin = createTransformOriginStyle(scale);
              targetDom.style.transform = createScaleTransform(scale);
            },
            onAfterEnter: () => {
              // 清理样式
              const style = document.getElementById(styleId);
              if (style) {
                style.remove();
              }

              if (action === ActionTypeEnum.ScalingHide) {
                component.display = false;
              }
            }
          },
          triggerType: "preview"
        });
      });
    }
  });
};

/**
 * 设置移动动画
 * @param params 移动参数对象
 * @param params.componentRootDoms 组件DOM元素
 * @param params.animation 动画配置
 * @param params.translate 移动选项
 * @param params.globalComponentMap 全局组件配置
 * @param params.globalAnimationTriggers 全局动画触发器
 */
const setMovingInDoms = ({
  componentRootDoms,
  animation,
  translate,
  globalComponentMap,
  globalAnimationTriggers
}: {
  componentRootDoms: NodeListOf<HTMLElement>;
  animation: ActionAnimation;
  translate: Translate;
  globalComponentMap: Map<string, ComponentType>;
  globalAnimationTriggers?: Map<string, AnimationTrigger>;
}): void => {
  componentRootDoms.forEach(async (element) => {
    const dataId = extractComponentId(element.getAttribute("data-id") || "");
    const componentConfig = globalComponentMap.get(`${dataId}`) || { top: 0, left: 0 };

    // 计算移动变换值
    const { transformX, transformY } = calculateTranslateValues(translate, componentConfig);

    const trigger = globalAnimationTriggers?.get(element.id);

    if (trigger) {
      const targetDom = getTargetDomElement(element);

      requestAnimationFrame(() => {
        trigger({
          animation: {
            ...animation,
            type: "transform",
            delay: 0
          },
          type: "transition",
          newAnimationCallback: {
            onBeforeEnter: async () => {
              await nextTick();
              // 应用移动变换
              targetDom.style.transform = createMoveTransform(transformX, transformY);
            }
          },
          triggerType: "preview"
        });
      });
    } else {
      // 降级处理：直接应用样式
      const targetDom = getTargetDomElement(element);
      setTimeout(() => {
        targetDom.style.transition = `transform ${animation.duration / 1000}s ${animation.timingFunction}`;
        targetDom.style.transform = createMoveTransform(transformX, transformY);
      }, animation.delay || 0);
    }
  });
};

/**
 * 设置默认动作动画（特殊处理：只限单个动态面板专用）
 * @param params 参数对象
 */
const setAnimationOnDynamicPanelStateChange = ({
  componentRootDoms,
  animation,
  globalAnimationTriggers
}: {
  componentRootDoms: NodeListOf<HTMLElement>;
  animation: ActionAnimation;
  globalAnimationTriggers: Map<string, AnimationTrigger>;
}): void => {
  const trigger = globalAnimationTriggers?.get(componentRootDoms[0].id);
  if (trigger) {
    trigger({
      animation: {
        ...animation,
        type: animation.type + "0"
      },
      triggerType: "preview"
    });
  }
};

/**
 * 设置组件配置更新动画
 * @param params 参数对象
 * @param params.componentConfig 组件配置
 * @param params.delay 动画延迟
 * @param params.updateComponentConfigCallback 组件配置更新回调
 */
const updateComponentConfig = ({
  componentConfig,
  delay,
  updateComponentConfigCallback
}: {
  componentConfig: Pick<Action, "componentConfig">["componentConfig"];
  delay: number;
  updateComponentConfigCallback: (params: Pick<Action, "componentConfig">["componentConfig"]) => void;
}): void => {
  setTimeout(() => {
    updateComponentConfigCallback(componentConfig);
  }, delay);
};

export {
  setAnimationOnDynamicPanelStateChange,
  setComponentScaling,
  setComponentShowAndHide,
  setMovingInDoms,
  updateComponentConfig
};
