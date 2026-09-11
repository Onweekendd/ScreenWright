import type { NormalizedNode } from "@/mastra/types/normalized-node-types";

import type { SemanticBounds } from "./semantic-layout-types";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const getNodeRect = (node: NormalizedNode): Rect | undefined => {
  const position = node.layout?.absolutePosition;
  const dimensions = node.layout?.dimensions;
  const width = dimensions?.width;
  const height = dimensions?.height;

  if (
    !position ||
    typeof width !== "number" ||
    typeof height !== "number" ||
    !Number.isFinite(position.x) ||
    !Number.isFinite(position.y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return undefined;
  }

  return { x: position.x, y: position.y, width, height };
};

export const semanticBoundsToRect = (bounds: SemanticBounds, canvasWidth: number, canvasHeight: number): Rect => ({
  x: (bounds.x / 1000) * canvasWidth,
  y: (bounds.y / 1000) * canvasHeight,
  width: (bounds.width / 1000) * canvasWidth,
  height: (bounds.height / 1000) * canvasHeight
});

export const intersectionArea = (a: Rect, b: Rect): number => {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
};

export const unionRects = (rects: Rect[]): Rect => {
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
};

export const toRelativeSemanticBounds = (rect: Rect, container: Rect): SemanticBounds => {
  const x = Math.max(0, Math.min(1000, ((rect.x - container.x) / container.width) * 1000));
  const y = Math.max(0, Math.min(1000, ((rect.y - container.y) / container.height) * 1000));
  const right = Math.max(x, Math.min(1000, ((rect.x + rect.width - container.x) / container.width) * 1000));
  const bottom = Math.max(y, Math.min(1000, ((rect.y + rect.height - container.y) / container.height) * 1000));

  return {
    x,
    y,
    width: Math.max(0.01, right - x),
    height: Math.max(0.01, bottom - y)
  };
};
