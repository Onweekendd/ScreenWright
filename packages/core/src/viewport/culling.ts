import type { Rect } from "./Viewport";

/**
 * 视口裁剪：判断世界坐标里的矩形是否还在可视窗口内。
 * 纯几何，不碰 DOM，也不关心矩形属于什么组件——算出哪些组件该隐藏是调用方的事。
 */

/** 两个矩形是否相交。只是边挨着（相接）不算相交 */
export const rectsIntersect = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

/** 把矩形四周各向外扩 pad（pad 可以是 0；负数视为 0） */
export const expandRect = (rect: Rect, pad: number): Rect => {
  const p = Math.max(0, pad);
  return { x: rect.x - p, y: rect.y - p, width: rect.width + p * 2, height: rect.height + p * 2 };
};

/**
 * 矩形是否在可视窗口内。
 *
 * @param margin 可视窗口向外多留的世界距离：刚滑出屏幕的组件先不隐藏，避免边缘一滚就闪；
 *               也兜住阴影、发光这类画在包围盒之外的内容
 */
export const isRectVisible = (rect: Rect, visible: Rect, margin = 0): boolean =>
  rectsIntersect(rect, expandRect(visible, margin));
