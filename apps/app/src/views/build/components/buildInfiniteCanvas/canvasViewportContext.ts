import type { InjectionKey, Ref } from "vue";

import type { Rect } from "@screenwright/core";

/**
 * 无限画布把「当前可视窗口」（世界坐标）告诉里面的编辑器代码。
 *
 * 画布可以同时挂多个（主画布 + 动态面板 / 终端交互编辑器的弹层），所以不能放一个全局变量：
 * - 渲染期（组件裁剪）走 provide / inject，每个画布给自己的子树；
 * - 事件期（拖拽开始时圈对齐参考范围）没有 setup 上下文可以 inject，按事件目标往上找
 *   最近的画布容器，查它登记的取值函数。
 */
export const VISIBLE_WORLD_RECT_KEY: InjectionKey<Ref<Rect | null>> = Symbol("canvas-visible-world-rect");

const getters = new WeakMap<Element, () => Rect | null>();

/** 画布挂载时登记自己的「当前可视窗口」取值函数，返回取消登记的函数 */
export const registerCanvasViewport = (container: Element, getVisibleRect: () => Rect | null): (() => void) => {
  getters.set(container, getVisibleRect);
  return () => {
    getters.delete(container);
  };
};

/**
 * 事件目标所在画布的当前可视窗口（世界坐标）。
 * 目标不在任何登记过的画布里、或画布还没量出尺寸时返回 null，由调用方回落到原有行为。
 */
export const findVisibleWorldRect = (target: EventTarget | null): Rect | null => {
  let node: Element | null = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
  while (node) {
    const getter = getters.get(node);
    if (getter) {
      return getter();
    }
    node = node.parentElement;
  }
  return null;
};
