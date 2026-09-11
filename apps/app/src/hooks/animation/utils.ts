import { extractComponentId } from "@/utils/utils";
import { ActionTypeEnum } from "@/views/build/components/buildConfig/constants/action";
import type { ActionAnimation, ComponentType, Scale, Translate } from "@/views/build/components/buildRender/type";

/**
 * 获取动画类型
 * @param element DOM元素
 * @returns 动画类型
 */
export const getAnimationType = (element: HTMLElement): string => {
  const animations = {
    animation: "animationend",
    OAnimation: "oAnimationEnd",
    MozAnimation: "animationend",
    WebkitAnimation: "webkitAnimationEnd"
  };

  for (const i in animations) {
    if (element.style[i as keyof CSSStyleDeclaration] !== undefined) {
      return animations[i as keyof typeof animations];
    }
  }
  return animations.animation;
};

/**
 * 判断元素当前是否处于隐藏状态
 * @param element DOM元素
 * @returns 是否隐藏
 */
export const determineElementVisibility = (element: HTMLElement): boolean => {
  if (element.style.display === "none") {
    return true;
  } else if (element.style.opacity) {
    return element.style.opacity === "0";
  }

  return false;
};

/**
 * 处理隐藏元素的显示
 * @param element DOM元素
 * @param animation 动画配置
 */
export const changeHiddenElementToVisible = (element: HTMLElement, animation: ActionAnimation): void => {
  if (animation.delay) {
    element.style.opacity = "0";
    setTimeout(() => {
      element.style.opacity = "1";
    }, animation.delay);
  }
};

/**
 * 设置元素的动画属性
 * @param element DOM元素
 * @param animation 动画配置
 * @param isHidden 是否隐藏
 */
export const applyAnimationProperties = (element: HTMLElement, animation: ActionAnimation, isHidden: boolean): void => {
  const animationType = animation.type + (isHidden ? "1" : "0");
  const animationValue = `${animationType} ${animation.duration / 1000 || 0}s ${animation.timingFunction} 0s`;

  element.style.setProperty("--animation", animationValue);
  element.style.setProperty("animation", "var(--animation)");
};

/**
 * 处理动画结束后的元素状态更新
 * @param element DOM元素
 * @param isHidden 是否隐藏
 */
export const updateElementStateAfterAnimation = (element: HTMLElement, isHidden: boolean): void => {
  element.style.setProperty("display", isHidden ? "none" : "block");
  element.style.setProperty("--animation", "none");
};

/**
 * 设置动画结束事件
 * @param element DOM元素
 * @param isHidden 动画状态：false-显示，true-隐藏
 * @param componentsMap 组件映射表
 * @returns Promise<boolean> 动画是否被取消
 */
export const setupAnimationEndEvent = (
  element: HTMLElement,
  isHidden: boolean,
  componentsMap?: Map<string, ComponentType>
): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const eventType = getAnimationType(element);
    if (!eventType) {
      // 如果没有动画类型，直接resolve
      resolve(false);
      return;
    }

    const handleAnimationEnd = () => {
      element.removeEventListener(eventType, handleAnimationEnd);

      /**
       * 处理动画结束后的元素状态
       * @param element DOM元素
       * @param isHidden 是否隐藏
       */
      const handleAnimationEndState = (element: HTMLElement, isHidden: boolean): void => {
        // element.style.setProperty("display", isHidden ? "none" : "block")
        element.style.setProperty("--animation", "none");

        if (componentsMap) {
          const componentId = extractComponentId(element.getAttribute("data-id") || "");
          const currentComponent = componentsMap.get(`${componentId}`);

          if (currentComponent) {
            if (currentComponent.parentId || currentComponent.title == "动态面板") {
              element.style.setProperty("opacity", isHidden ? "0" : "1");
            }
          }
        }
      };

      handleAnimationEndState(element, isHidden);

      // 动画结束后resolve Promise
      resolve(false);
    };

    element.addEventListener("animationcancel", () => {
      resolve(true);
    });

    element.addEventListener(eventType, handleAnimationEnd, false);
  });
};

/**
 * 获取实际需要应用动画的DOM元素
 * @param element 原始DOM元素
 * @returns 目标DOM元素
 */
export const getTargetDomElement = (element: HTMLElement): HTMLElement => {
  return element.className === "ft-panel" ? (element.querySelector(".panel-layout") as HTMLElement) : element;
};

/**
 * 创建变换原点样式
 * @param scale 缩放选项
 * @returns 变换原点样式值
 */
export const createTransformOriginStyle = (scale: Scale): string => {
  const { left, top } = scale.originGrid || {};
  return scale.originGrid
    ? `${left !== undefined ? left : "right"} ${top !== undefined ? top : "bottom"}`
    : scale.origin;
};

/**
 * 创建过渡样式
 * @param animation 动画配置
 * @param isScalingHide 是否为缩放隐藏动作
 * @returns 过渡样式值
 */
export const createTransitionStyle = (animation: ActionAnimation, isScalingHide: boolean): string => {
  const duration = animation.duration || 500;
  const timingFunction = animation.timingFunction || "linear";

  const transformTransition = `transform ${duration / 1000}s ${timingFunction}`;
  const transformOriginTransition = `transform-origin ${duration / 1000}s ${timingFunction}`;
  const opacityTransition = `opacity ${duration / 2000}s ease-out`;

  const transitions = [transformTransition, transformOriginTransition];
  if (isScalingHide) {
    transitions.unshift(opacityTransition);
  }

  return transitions.join(", ");
};

/**
 * 创建缩放变换样式
 * @param scale 缩放选项
 * @returns 缩放样式值
 */
export const createScaleTransform = (scale: Scale): string => {
  return `scale(${scale.x / 100}, ${scale.y / 100})`;
};

/**
 * 应用缩放动画属性
 * @param params 缩放动画参数对象
 * @param params.element DOM元素
 * @param params.animation 动画配置
 * @param params.scale 缩放选项
 * @param params.action 动作类型
 */
export const applyScalingProperties = ({
  element,
  animation,
  scale,
  action
}: {
  element: HTMLElement;
  animation: ActionAnimation;
  scale: Scale;
  action: ActionTypeEnum.ScalingHide | ActionTypeEnum.Scaling;
}): void => {
  // 获取目标DOM元素
  const targetDom = getTargetDomElement(element);

  // 检查是否为缩放隐藏动作
  const isScalingHide = action === ActionTypeEnum.ScalingHide;

  // 应用样式
  targetDom.style.transition = createTransitionStyle(animation, isScalingHide);
  targetDom.style.transformOrigin = createTransformOriginStyle(scale);
  targetDom.style.transform = createScaleTransform(scale);

  if (isScalingHide) {
    targetDom.style.opacity = "0";
    handleScalingHideState({
      element: targetDom,
      animation
    });
  }
};

/**
 * 处理缩放隐藏后的元素状态
 * @param element DOM元素
 * @param animation 动画配置
 */
export const handleScalingHideState = ({
  element,
  animation
}: {
  element: HTMLElement;
  animation: ActionAnimation;
}): void => {
  setTimeout(() => {
    element.style.display = "none";
    element.style.opacity = "1";
    element.style.transform = "scale(1, 1)";
  }, animation.duration || 500);
};

/**
 * 计算移动变换值
 * @param translate 移动选项
 * @param componentConfig 组件配置
 * @returns 移动变换值对象
 */
export const calculateTranslateValues = (
  translate: Translate,
  componentConfig: { top: number; left: number }
): { transformX: string; transformY: string } => {
  const transformX = `${translate.toX - componentConfig.left}px`;
  const transformY = `${translate.toY - componentConfig.top}px`;

  return { transformX, transformY };
};

/**
 * 创建移动过渡样式
 * @param animation 动画配置
 * @returns 过渡样式值
 */
export const createMoveTransitionStyle = (animation: ActionAnimation): string => {
  return `transform ${animation.duration / 1000 || 0}s ${animation.timingFunction || "linear"}`;
};

/**
 * 创建移动变换样式
 * @param transformX X轴移动距离
 * @param transformY Y轴移动距离
 * @returns 移动变换样式值
 */
export const createMoveTransform = (transformX: string, transformY: string): string => {
  return `translate(${transformX}, ${transformY})`;
};

/**
 * 应用移动动画属性
 * @param element DOM元素
 * @param animation 动画配置
 * @param transformX X轴移动距离
 * @param transformY Y轴移动距离
 */
export const applyMovingProperties = (
  element: HTMLElement,
  animation: ActionAnimation,
  transformX: string,
  transformY: string
): void => {
  const targetDom = getTargetDomElement(element);
  const transition = createMoveTransitionStyle(animation);
  const transform = createMoveTransform(transformX, transformY);

  setTimeout(() => {
    targetDom.style.transition = transition;
    targetDom.style.transform = transform;
  }, animation.delay || 0);
};
