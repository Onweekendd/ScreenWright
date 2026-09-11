import type { HasFramePropertiesTrait, HasLayoutTrait, Node as FigmaDocumentNode } from "@figma/rest-api-spec";

import { generateCSSShorthand, pixelRound } from "@/mastra/mcp/figma-context-mcp/server/utils/common";
import { isFrame, isLayout, isRectangle } from "@/mastra/mcp/figma-context-mcp/server/utils/identity";

export interface SimplifiedLayout {
  mode: "none" | "row" | "column";
  justifyContent?: "flex-start" | "flex-end" | "center" | "space-between" | "baseline" | "stretch";
  alignItems?: "flex-start" | "flex-end" | "center" | "space-between" | "baseline" | "stretch";
  alignSelf?: "flex-start" | "flex-end" | "center" | "stretch";
  wrap?: boolean;
  gap?: string;
  absolutePosition?: {
    x: number;
    y: number;
  };
  dimensions?: {
    width?: number;
    height?: number;
    aspectRatio?: number;
  };
  padding?: string;
  sizing?: {
    horizontal?: "fixed" | "fill" | "hug";
    vertical?: "fixed" | "fill" | "hug";
  };
  overflowScroll?: ("x" | "y")[];
  position?: "absolute";
}

// Convert Figma's layout config into a more typical flex-like schema
export function buildSimplifiedLayout(n: FigmaDocumentNode, root?: FigmaDocumentNode): SimplifiedLayout {
  const frameValues = buildSimplifiedFrameValues(n);
  const layoutValues = buildSimplifiedLayoutValues(n, frameValues.mode) || {};

  // Always try to extract position info, even for non-layout nodes like VECTOR
  const positionInfo = extractPositionInfo(n, root);

  return { ...frameValues, ...layoutValues, ...positionInfo };
}

/**
 * Extract position information for any node type (including VECTOR, BOOLEAN_OPERATION children, etc.)
 */
function extractPositionInfo(n: FigmaDocumentNode, root?: FigmaDocumentNode): Partial<SimplifiedLayout> {
  const result: Partial<SimplifiedLayout> = {};

  // Include absolute positioning flag if the node is absolutely positioned
  if ("layoutPositioning" in n && n.layoutPositioning === "ABSOLUTE") {
    result.position = "absolute";
  }

  // Always include absolutePosition if we have bounding box data
  if (
    "absoluteBoundingBox" in n &&
    n.absoluteBoundingBox &&
    root &&
    "absoluteBoundingBox" in root &&
    root.absoluteBoundingBox
  ) {
    result.absolutePosition = {
      x: pixelRound(n.absoluteBoundingBox.x - root.absoluteBoundingBox.x),
      y: pixelRound(n.absoluteBoundingBox.y - root.absoluteBoundingBox.y)
    };
  }

  return result;
}

// For flex layouts, process alignment and sizing
function convertAlign(
  axisAlign?: HasFramePropertiesTrait["primaryAxisAlignItems"] | HasFramePropertiesTrait["counterAxisAlignItems"],
  stretch?: {
    children: FigmaDocumentNode[];
    axis: "primary" | "counter";
    mode: "row" | "column" | "none";
  }
) {
  if (stretch && stretch.mode !== "none") {
    const { children, mode, axis } = stretch;

    // Compute whether to check horizontally or vertically based on axis and direction
    const direction = getDirection(axis, mode);

    const shouldStretch =
      children.length > 0 &&
      children.reduce((shouldStretch, c) => {
        if (!shouldStretch) {
          return false;
        }
        if ("layoutPositioning" in c && c.layoutPositioning === "ABSOLUTE") {
          return true;
        }
        if (direction === "horizontal") {
          return "layoutSizingHorizontal" in c && c.layoutSizingHorizontal === "FILL";
        } else if (direction === "vertical") {
          return "layoutSizingVertical" in c && c.layoutSizingVertical === "FILL";
        }
        return false;
      }, true);

    if (shouldStretch) {
      return "stretch";
    }
  }

  switch (axisAlign) {
    case "MIN":
      // MIN, AKA flex-start, is the default alignment
      return undefined;
    case "MAX":
      return "flex-end";
    case "CENTER":
      return "center";
    case "SPACE_BETWEEN":
      return "space-between";
    case "BASELINE":
      return "baseline";
    default:
      return undefined;
  }
}

function convertSelfAlign(align?: HasLayoutTrait["layoutAlign"]) {
  switch (align) {
    case "MIN":
      // MIN, AKA flex-start, is the default alignment
      return undefined;
    case "MAX":
      return "flex-end";
    case "CENTER":
      return "center";
    case "STRETCH":
      return "stretch";
    default:
      return undefined;
  }
}

// interpret sizing
function convertSizing(s?: HasLayoutTrait["layoutSizingHorizontal"] | HasLayoutTrait["layoutSizingVertical"]) {
  if (s === "FIXED") {
    return "fixed";
  }
  if (s === "FILL") {
    return "fill";
  }
  if (s === "HUG") {
    return "hug";
  }
  return undefined;
}

function getDirection(axis: "primary" | "counter", mode: "row" | "column"): "horizontal" | "vertical" {
  // 两个分支各自 return，不再靠内层 switch 的穷尽性隐式收尾：mode 将来多一个取值时，
  // 原写法会让 "primary" 静默贯穿进 "counter"（eslint no-fallthrough 报的就是这个）。
  // 保留 axis 的分支结构而不合并，是为了以后两轴真要分化时有地方落。
  switch (axis) {
    case "primary":
      return mode === "row" ? "horizontal" : "vertical";
    case "counter":
      return mode === "row" ? "horizontal" : "vertical";
  }
}

function buildSimplifiedFrameValues(n: FigmaDocumentNode): SimplifiedLayout | { mode: "none" } {
  if (!isFrame(n)) {
    return { mode: "none" };
  }

  const frameValues: SimplifiedLayout = {
    mode: !n.layoutMode || n.layoutMode === "NONE" ? "none" : n.layoutMode === "HORIZONTAL" ? "row" : "column"
  };

  const overflowScroll: SimplifiedLayout["overflowScroll"] = [];
  if (n.overflowDirection?.includes("HORIZONTAL")) {
    overflowScroll.push("x");
  }
  if (n.overflowDirection?.includes("VERTICAL")) {
    overflowScroll.push("y");
  }
  if (overflowScroll.length > 0) {
    frameValues.overflowScroll = overflowScroll;
  }

  if (frameValues.mode === "none") {
    return frameValues;
  }

  // TODO: convertAlign should be two functions, one for justifyContent and one for alignItems
  frameValues.justifyContent = convertAlign(n.primaryAxisAlignItems ?? "MIN", {
    children: n.children,
    axis: "primary",
    mode: frameValues.mode
  });
  frameValues.alignItems = convertAlign(n.counterAxisAlignItems ?? "MIN", {
    children: n.children,
    axis: "counter",
    mode: frameValues.mode
  });
  frameValues.alignSelf = convertSelfAlign(n.layoutAlign);

  // Only include wrap if it's set to WRAP, since flex layouts don't default to wrapping
  frameValues.wrap = n.layoutWrap === "WRAP" ? true : undefined;
  frameValues.gap = n.itemSpacing ? `${n.itemSpacing ?? 0}px` : undefined;
  // gather padding
  if (n.paddingTop || n.paddingBottom || n.paddingLeft || n.paddingRight) {
    frameValues.padding = generateCSSShorthand({
      top: n.paddingTop ?? 0,
      right: n.paddingRight ?? 0,
      bottom: n.paddingBottom ?? 0,
      left: n.paddingLeft ?? 0
    });
  }

  return frameValues;
}

function buildSimplifiedLayoutValues(
  n: FigmaDocumentNode,
  mode: "row" | "column" | "none"
): SimplifiedLayout | undefined {
  if (!isLayout(n)) {
    return undefined;
  }

  const layoutValues: SimplifiedLayout = { mode };

  layoutValues.sizing = {
    horizontal: convertSizing(n.layoutSizingHorizontal),
    vertical: convertSizing(n.layoutSizingVertical)
  };

  // Note: position and locationRelativeToParent are now extracted in extractPositionInfo()
  // to support all node types including VECTOR, BOOLEAN_OPERATION children, etc.

  // Handle dimensions based on layout growth and alignment
  if (isRectangle("absoluteBoundingBox", n)) {
    const dimensions: { width?: number; height?: number; aspectRatio?: number } = {};

    // Only include dimensions that aren't meant to stretch
    if (mode === "row") {
      // AutoLayout row, only include dimensions if the node is not growing
      if (!n.layoutGrow && n.layoutSizingHorizontal == "FIXED") {
        dimensions.width = n.absoluteBoundingBox.width;
      }
      if (n.layoutAlign !== "STRETCH" && n.layoutSizingVertical == "FIXED") {
        dimensions.height = n.absoluteBoundingBox.height;
      }
    } else if (mode === "column") {
      // AutoLayout column, only include dimensions if the node is not growing
      if (n.layoutAlign !== "STRETCH" && n.layoutSizingHorizontal == "FIXED") {
        dimensions.width = n.absoluteBoundingBox.width;
      }
      if (!n.layoutGrow && n.layoutSizingVertical == "FIXED") {
        dimensions.height = n.absoluteBoundingBox.height;
      }

      if (n.preserveRatio) {
        dimensions.aspectRatio = n.absoluteBoundingBox?.width / n.absoluteBoundingBox?.height;
      }
    } else {
      // Node is not an AutoLayout. Include dimensions if the node is not growing (which it should never be)
      if (!n.layoutSizingHorizontal || n.layoutSizingHorizontal === "FIXED") {
        dimensions.width = n.absoluteBoundingBox.width;
      }
      if (!n.layoutSizingVertical || n.layoutSizingVertical === "FIXED") {
        dimensions.height = n.absoluteBoundingBox.height;
      }
    }

    if (Object.keys(dimensions).length > 0) {
      if (dimensions.width) {
        dimensions.width = pixelRound(dimensions.width);
      }
      if (dimensions.height) {
        dimensions.height = pixelRound(dimensions.height);
      }
      layoutValues.dimensions = dimensions;
    }
  }

  return layoutValues;
}
