import { type MaybeRef, ref, unref } from "vue";

// 定义滑动方向的类型（强类型约束，替代原数字/字符串）
export type TouchDirection = "up" | "down" | "left" | "right" | "click";
// 定义Hook的回调函数类型
export type TouchCallback = (direction: TouchDirection) => void;
// 定义Hook的入参配置类型
export interface UseDomTouchOptions {
  // 强制开启触摸模式（替代原isTouched）
  forceTouch?: boolean;
  // 滑动最小距离阈值（原2，支持自定义）
  minDistance?: number;
}

/**
 * @param target 绑定的DOM元素（支持Ref/直接传元素，Vue常用MaybeRef）
 * @param cb 滑动/点击回调，返回方向
 * @param options 配置项（可选）
 * @returns 包含解绑方法、触摸状态的对象
 */
export function useDomTouch(
  target: MaybeRef<HTMLElement | null | undefined>,
  cb: TouchCallback,
  options: UseDomTouchOptions = {}
) {
  // 解构配置，设置默认值
  const { forceTouch = false, minDistance = 2 } = options;
  // 起始坐标
  let startX = 0;
  let startY = 0;
  // 缓存目标元素原始的user-select样式（用于后续还原）
  let originalUserSelect = "";
  // 判断是否为触摸设备（缓存结果，避免重复判断）
  const isTouch = ref("ontouchend" in document);
  // 最终的触摸模式（设备原生触摸 || 强制开启）
  const finalIsTouch = isTouch.value || forceTouch;

  // 计算滑动角度
  const getAngle = (angX: number, angY: number): number => {
    return (Math.atan2(angY, angX) * 180) / Math.PI;
  };

  // 根据起始/结束坐标获取滑动方向（核心逻辑保留，优化变量名）
  const getDirection = (startX: number, startY: number, endX: number, endY: number): TouchDirection => {
    const diffX = endX - startX;
    const diffY = endY - startY;

    // 滑动距离小于阈值，判定为点击
    if (Math.abs(diffX) < minDistance && Math.abs(diffY) < minDistance) {
      return "click";
    }

    const angle = getAngle(diffX, diffY);
    if (angle >= -135 && angle <= -45) return "up";
    if (angle > 45 && angle < 135) return "down";
    if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
      return "left";
    }
    if (angle >= -45 && angle <= 45) return "right";
    // 兜底判定为点击
    return "click";
  };

  // 禁止文字选择：设置user-select为none，同时缓存原始样式
  const disableUserSelect = (el: HTMLElement) => {
    // 缓存原始样式（只缓存一次，避免重复覆盖）
    if (!originalUserSelect) {
      originalUserSelect = el.style.userSelect || getComputedStyle(el).userSelect;
    }
    // 兼容webkit内核（如Chrome/Safari）
    el.style.userSelect = "none";
    el.style.webkitUserSelect = "none";
  };

  // 恢复文字选择：还原为元素原始的user-select样式
  const restoreUserSelect = (el: HTMLElement) => {
    el.style.userSelect = originalUserSelect;
    el.style.webkitUserSelect = originalUserSelect;
  };

  // 触摸/鼠标开始事件处理（整合原startFun，优化兼容）
  const handleStart = (e: TouchEvent | PointerEvent) => {
    const el = unref(target);
    if (!el) return;
    // 开始时禁止文字选择
    disableUserSelect(el);

    if (finalIsTouch) {
      // 触摸模式：取touches[0]
      const touch = (e as TouchEvent).touches[0];
      startX = touch.pageX;
      startY = touch.pageY;
    } else {
      // 鼠标模式：取pointer事件的pageX/Y
      startX = (e as PointerEvent).pageX;
      startY = (e as PointerEvent).pageY;
    }
  };

  // 触摸/鼠标结束事件处理（整合原endFun，优化事件处理）
  const handleEnd = (e: TouchEvent | PointerEvent) => {
    const el = unref(target);
    if (!el) return;
    // 结束时恢复文字选择
    restoreUserSelect(el);

    let endX = 0;
    let endY = 0;

    if (finalIsTouch) {
      const touch = (e as TouchEvent).changedTouches[0];
      endX = touch.pageX;
      endY = touch.pageY;
    } else {
      endX = (e as PointerEvent).pageX;
      endY = (e as PointerEvent).pageY;
    }

    // 获取方向并执行回调
    const direction = getDirection(startX, startY, endX, endY);
    cb(direction);
    // 阻止冒泡（保留原逻辑，可根据需求移除）
    e.stopPropagation();
    // 阻止默认行为（可选补充，避免触摸时的浏览器默认滚动）
    // e.preventDefault()
  };

  // 绑定事件（核心：处理Vue的MaybeRef，兼容Ref/原始元素）
  const bindEvents = () => {
    const el = unref(target);
    if (!el) return; // 元素不存在则不绑定

    if (finalIsTouch) {
      el.addEventListener("touchstart", handleStart, false);
      el.addEventListener("touchend", handleEnd, false);
    } else {
      el.addEventListener("pointerdown", handleStart, false);
      el.addEventListener("pointerup", handleEnd, false);
    }
  };

  // 解绑事件（Hook 必备：防止内存泄漏，组件卸载时执行）
  const unbindEvents = () => {
    const el = unref(target);
    if (!el) return;
    // 解绑时兜底恢复样式，防止异常情况未执行handleEnd
    restoreUserSelect(el);

    if (finalIsTouch) {
      el.removeEventListener("touchstart", handleStart, false);
      el.removeEventListener("touchend", handleEnd, false);
    } else {
      el.removeEventListener("pointerdown", handleStart, false);
      el.removeEventListener("pointerup", handleEnd, false);
    }
  };

  // 初始化绑定事件
  bindEvents();

  // 返回Hook的暴露方法/状态（遵循Vue Hook规范，暴露解绑方法为核心）
  return {
    isTouch,
    finalIsTouch,
    unbindEvents, // 手动解绑事件（组件卸载/销毁时必须调用）
    handleStart,
    handleEnd
  };
}
