import type { Node as FigmaDocumentNode } from "@figma/rest-api-spec";

import { hasValue, isTruthy } from "@/mastra/mcp/figma-context-mcp/server/utils/identity";

export type SimplifiedTextStyle = Partial<{
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: string;
  letterSpacing: string;
  textCase: string;
  textAlignHorizontal: string;
  textAlignVertical: string;
}>;

export interface CharacterStyleOverride {
  start: number;
  end: number;
  styleId: string;
}

export function isTextNode(n: FigmaDocumentNode): n is Extract<FigmaDocumentNode, { type: "TEXT" }> {
  return n.type === "TEXT";
}

export function hasTextStyle(
  n: FigmaDocumentNode
): n is FigmaDocumentNode & { style: Extract<FigmaDocumentNode, { style: any }>["style"] } {
  return hasValue("style", n) && Object.keys(n.style).length > 0;
}

// Keep other simple properties directly
export function extractNodeText(n: FigmaDocumentNode) {
  if (hasValue("characters", n, isTruthy)) {
    return n.characters;
  }
  return undefined;
}

/**
 * 把 style 上的行高换算成真实像素值。
 * lineHeightUnit === "FONT_SIZE_%" 时，lineHeightPx 字段里存的其实是百分比数字
 * （如 130 代表 130%），不是像素，必须乘以 fontSize / 100 才是真正的行高像素值；
 * lineHeightUnit === "PIXELS" 时 lineHeightPx 才是可以直接使用的像素值。
 */
function resolveLineHeightPx(style: {
  lineHeightPx?: number;
  lineHeightUnit?: string;
  fontSize?: number;
}): number | undefined {
  if (!("lineHeightPx" in style) || !style.lineHeightPx || !style.fontSize) {
    return undefined;
  }
  if (style.lineHeightUnit === "PIXELS") {
    return style.lineHeightPx;
  }
  if (style.lineHeightUnit === "FONT_SIZE_%") {
    return (style.fontSize * style.lineHeightPx) / 100;
  }
  return undefined;
}

export function extractTextStyle(n: FigmaDocumentNode) {
  if (hasTextStyle(n)) {
    // Plugin 端会回传 letterSpacingUnit，但官方 TypeStyle 类型未声明，这里放宽到 any 读取
    const style = n.style as typeof n.style & {
      letterSpacingUnit?: "PIXELS" | "PERCENT";
    };
    const lineHeightPx = resolveLineHeightPx(style);
    const textStyle: SimplifiedTextStyle = {
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      fontSize: style.fontSize,
      // 行高输出规则：
      // 1. lineHeightUnit 为 "INTRINSIC_%"（或缺省，即 Figma 默认 Auto）时不输出，
      //    避免把字体内置行高（CJK 字体常 >2x fontSize）当成显式值导致 CSS 行框过高
      // 2. 换算后的真实像素 < fontSize 时不输出，避免 CSS 行框压扁裁切字形
      lineHeight: lineHeightPx !== undefined && lineHeightPx >= style.fontSize! ? `${lineHeightPx}px` : undefined,
      // 字间距单位以 Plugin/REST API 的 letterSpacingUnit 为准：
      // 1. PERCENT → 直接输出 "{value}%"
      // 2. PIXELS（或缺省）→ 输出 "{value}px"，避免 px↔% 来回换算丢精度
      letterSpacing:
        style.letterSpacing && style.letterSpacing !== 0
          ? style.letterSpacingUnit === "PERCENT"
            ? `${style.letterSpacing}%`
            : `${style.letterSpacing}px`
          : undefined,
      textCase: style.textCase,
      textAlignHorizontal: style.textAlignHorizontal,
      textAlignVertical: style.textAlignVertical
    };
    return textStyle;
  }
  return undefined;
}

/**
 * Extract character-level style overrides from a text node.
 * This captures styles applied to specific character ranges (like gradient fills on certain words).
 */
export function extractCharacterStyleOverrides(
  n: FigmaDocumentNode
): { ranges: CharacterStyleOverride[]; styleTable: Record<string, any> } | undefined {
  if (!isTextNode(n)) {
    return undefined;
  }

  const characterStyleOverrides = hasValue("characterStyleOverrides", n) ? n.characterStyleOverrides : undefined;
  const styleOverrideTable = hasValue("styleOverrideTable", n) ? n.styleOverrideTable : undefined;

  if (!characterStyleOverrides || !styleOverrideTable) {
    return undefined;
  }

  // Convert the array of override indices to ranges
  const ranges: CharacterStyleOverride[] = [];
  let currentStyleId: number | undefined;
  let currentStart = 0;

  for (let i = 0; i < characterStyleOverrides.length; i++) {
    const styleId = characterStyleOverrides[i];

    if (styleId !== currentStyleId) {
      // End of current range
      if (currentStyleId !== undefined && currentStyleId !== 0) {
        ranges.push({
          start: currentStart,
          end: i,
          styleId: currentStyleId.toString()
        });
      }

      // Start new range
      currentStyleId = styleId;
      currentStart = i;
    }
  }

  // Add the last range
  if (currentStyleId !== undefined && currentStyleId !== 0) {
    ranges.push({
      start: currentStart,
      end: characterStyleOverrides.length,
      styleId: currentStyleId.toString()
    });
  }

  if (ranges.length === 0) {
    return undefined;
  }

  return {
    ranges,
    styleTable: styleOverrideTable as Record<string, any>
  };
}
