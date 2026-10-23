import { findVisibleWorldRect } from "../../buildInfiniteCanvas/canvasViewportContext";

/**
 * 拖动 / 缩放开始时，圈出「哪些组件算对齐参考」的世界坐标范围：当前可视窗口。
 *
 * 无限画布上组件可以散得很远，对齐线只该跟眼前看得见的组件比——否则会被几千像素外
 * 看不见的组件吸住，用户既不知道为什么吸、也看不到那条线。
 * 事件不在任何无限画布里（或画布还没量出尺寸）时，回落到画板自身的范围。
 *
 * 返回值顺序对应 WASM 的 `cache_reference_shapes(min_x, min_y, max_x, max_y, ...)`。
 */
export const getAlignmentReferenceBounds = (
  event: Event | undefined,
  artboard: { width: number | string; height: number | string }
): [minX: number, minY: number, maxX: number, maxY: number] => {
  const visible = findVisibleWorldRect(event?.target ?? null);
  if (visible) {
    return [visible.x, visible.y, visible.x + visible.width, visible.y + visible.height];
  }
  return [0, 0, Number(artboard.width), Number(artboard.height)];
};
