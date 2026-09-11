/**
 * 缩放锚点的几何计算 —— 从 EditShapeBox.vue 抽出，供 SelectionTransformer 复用。
 *
 * 锚点尺寸随「框」的宽高变化（最小边的一定比例，夹在上下限内），保证不论组件大小锚点都好点中。
 */
import { direction } from "../type";

/** 8 个锚点方向，顺序与 ANCHOR_CURSORS 一一对应 */
export const ANCHOR_POINTS: direction[] = [
  direction.t,
  direction.r,
  direction.b,
  direction.l,
  direction.lt,
  direction.rt,
  direction.lb,
  direction.rb
];

/** 与 ANCHOR_POINTS 同序的 resize 光标前缀（`${x}-resize`） */
export const ANCHOR_CURSORS = ["n", "e", "s", "w", "nw", "ne", "sw", "se"] as const;

const THEME_COLOR = "#5e62fb";

export interface AnchorSize {
  size: number;
  borderWidth: number;
  scale: number;
  longSideSize: number;
  offset: number;
}

/** 依据框宽高算锚点基础尺寸 */
export function computeAnchorSize(width: number, height: number): AnchorSize {
  const w = Number(width) || 100;
  const h = Number(height) || 100;

  const baseSize = Math.min(w, h) * 0.05; // 最小边的 5%
  const size = Math.max(8, Math.min(16, baseSize)); // 夹在 [8,16]
  const borderWidth = Math.max(2, size * 0.2);
  const scale = 1.4;
  const longSideSize = Math.max(20, Math.min(40, Math.min(w, h) * 0.15)); // 长边把手 [20,40]

  return {
    size: Math.round(size),
    borderWidth: Math.round(borderWidth * 10) / 10,
    scale,
    longSideSize: Math.round(longSideSize),
    offset: Math.round(((size + borderWidth * 2) * scale) / 2) // 让锚点中心落在框边线上
  };
}

/** 依据框宽高算每个方向锚点的绝对定位样式（相对 `.sw-transform` / `.go-shape-box`） */
export function computeAnchorStyles(width: number, height: number): Record<direction, Record<string, string>> {
  const { size, borderWidth, scale, longSideSize, offset } = computeAnchorSize(width, height);
  const borderRadius = Math.round(size * 0.4) + "px";

  const base: Record<string, string> = {
    width: size + "px",
    height: size + "px",
    border: borderWidth + "px solid " + THEME_COLOR,
    borderRadius,
    backgroundColor: "#fff",
    transform: "scale(" + scale + ")"
  };

  return {
    [direction.lt]: { ...base, left: "-" + offset + "px", top: "-" + offset + "px" },
    [direction.rt]: { ...base, top: "-" + offset + "px", right: "-" + offset + "px" },
    [direction.rb]: { ...base, right: "-" + offset + "px", bottom: "-" + offset + "px" },
    [direction.lb]: { ...base, left: "-" + offset + "px", bottom: "-" + offset + "px" },
    [direction.t]: {
      ...base,
      left: "50%",
      width: longSideSize + "px",
      top: "-" + offset + "px",
      transform: "translateX(-50%) scale(" + scale + ")"
    },
    [direction.b]: {
      ...base,
      width: longSideSize + "px",
      bottom: "-" + offset + "px",
      left: "50%",
      transform: "translateX(-50%) scale(" + scale + ")"
    },
    [direction.l]: {
      ...base,
      height: longSideSize + "px",
      top: "50%",
      left: "-" + offset + "px",
      transform: "translateY(-50%) scale(" + scale + ")"
    },
    [direction.r]: {
      ...base,
      height: longSideSize + "px",
      right: "-" + offset + "px",
      top: "50%",
      transform: "translateY(-50%) scale(" + scale + ")"
    }
  } as Record<direction, Record<string, string>>;
}
