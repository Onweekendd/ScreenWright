import { batchByNodeIds } from "@/mastra/services/figma-node-asset.server";
import {
  extractLayout,
  FT_SUBTABS_MODULE_ID,
  getComponentDefaultConfigByModuleId,
  rgbaToCss,
  setComponentBaseProps
} from "@/mastra/tools/utils";
import type { ComponentType } from "@/mastra/types";
import type { NormalizedNode } from "@/mastra/types/normalized-node-types";

import type { ConvertParams, ConvertResult, ConvertStrategy } from "./types";

export interface TextShadow {
  x: number;
  y: number;
  blur: number;
  color: string;
  extend: number;
}

export interface BaseStyleObj {
  textTranslateX: number;
  textTranslateY: number;
  isBorder: boolean;
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
  backgroundImage: string;
  backgroundImageType: "100% 100%";
  backgroundType: "color" | "custom";
  fontSize: number;
  fontWeight: boolean | "normal" | "bold" | number;
  fontStyle: boolean | "normal" | "italic" | "oblique";
  fontFamily: string;
  fontColor: string;
  isTextShadow: boolean;
  textShadow: TextShadow;
}

export interface SeriesTabsItem {
  defaultObj: BaseStyleObj;
  activeObj: BaseStyleObj;
  hoverObj: BaseStyleObj;
  [key: string]: any;
}

export interface SubtabsOption {
  active: number;
  rows: number;
  columns: number;
  rowGap: number;
  columnGap: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  writingMode: "horizontal-tb" | "vertical-rl" | "vertical-lr";
  alignItems: "flex-start" | "flex-end" | "center" | "baseline" | "stretch";
  textAlign: "left" | "right" | "center" | "justify";
  playVisible: boolean;
  playDelay: number;
  playDuration: number;
  scrollVisible: boolean;
  scrollGap: number;
  scrollTrack: string;
  scrollSlide: string;
  componentLink: boolean;
  isCallback: boolean;
  related: boolean;
  isIsolated: boolean;
  isCancelSelected: boolean;
  isHovered: boolean;
  defaultObj: BaseStyleObj;
  activeObj: BaseStyleObj;
  hoverObj: BaseStyleObj;
  setMinHeight?: boolean;
  isSeriesFirst?: boolean;
  seriesTabsList?: SeriesTabsItem[];
  followCanvasSlide?: boolean;
  isFixedSelectedItem?: boolean;
}

export interface TabItem {
  label: string;
  value: string | number;
}

export type SubtabsData = TabItem[];
export type FtSubtabs = ComponentType<any, SubtabsOption, SubtabsData>;

function createEmptyStyleObj(): BaseStyleObj {
  return {
    textTranslateX: 0,
    textTranslateY: 0,
    isBorder: false,
    borderWidth: 0,
    borderColor: "",
    backgroundColor: "",
    backgroundImage: "",
    backgroundImageType: "100% 100%",
    backgroundType: "color",
    fontSize: 14,
    fontWeight: false,
    fontStyle: false,
    fontFamily: "",
    fontColor: "",
    isTextShadow: false,
    textShadow: { x: 0, y: 0, blur: 0, color: "", extend: 0 }
  };
}

/** 从 componentProperties（[{name,value,type}] 数组形式）中找值为 active / noActive 的 VARIANT 属性。
 *  属性名不固定（Figma 默认是 "Property 1"），只能靠 value 识别。 */
function getVariantState(node: NormalizedNode): "active" | "noActive" | undefined {
  const props = node.componentProperties;
  if (!Array.isArray(props)) {
    return undefined;
  }
  for (const p of props) {
    if (p?.type === "VARIANT" && (p.value === "active" || p.value === "noActive")) {
      return p.value;
    }
  }
  return undefined;
}

function findFirstTextChild(node: NormalizedNode): NormalizedNode | null {
  const stack: NormalizedNode[] = [...(node.children ?? [])];
  while (stack.length) {
    const cur = stack.shift()!;
    if (cur.type === "TEXT") {
      return cur;
    }
    if (cur.children?.length) {
      stack.push(...cur.children);
    }
  }
  return null;
}

function findFirstImageChild(node: NormalizedNode): NormalizedNode | null {
  const stack: NormalizedNode[] = [...(node.children ?? [])];
  while (stack.length) {
    const cur = stack.shift()!;
    if (cur.name?.endsWith("-image")) {
      return cur;
    }
    if (cur.children?.length) {
      stack.push(...cur.children);
    }
  }
  return null;
}

function extractTextStyleFromTextNode(textNode: NormalizedNode | null): {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  fontWeight: boolean | number;
  fontStyle: boolean | "normal" | "italic" | "oblique";
  textShadow?: TextShadow;
} | null {
  if (!textNode) {
    return null;
  }
  const style = (textNode.textStyle ?? {}) as Record<string, unknown>;
  const fontFamily = (style.fontFamily as string) || "sans-serif";
  const fontSize = (style.fontSize as number) || 14;

  let fontColor = "";
  const fills = textNode.fills ?? [];
  if (fills.length > 0) {
    const firstFill = fills[0];
    if (typeof firstFill === "string") {
      fontColor = firstFill;
    } else if (typeof firstFill === "object" && firstFill !== null) {
      const fillObj = firstFill as any;
      if (fillObj.type === "SOLID" && fillObj.color && fillObj.visible !== false) {
        fontColor = rgbaToCss({
          r: fillObj.color.r,
          g: fillObj.color.g,
          b: fillObj.color.b,
          a: fillObj.opacity ?? fillObj.color.a ?? 1
        });
      } else if (fillObj.type === "GRADIENT_LINEAR" && fillObj.gradientStops?.length > 0) {
        fontColor = rgbaToCss(fillObj.gradientStops[0].color);
      }
    }
  }

  let fontWeight: boolean | number = false;
  const fw = style.fontWeight as number | undefined;
  if (fw) {
    fontWeight = fw >= 700 ? true : fw;
  }

  let fontStyle: boolean | "normal" | "italic" | "oblique" = false;
  const fs = style.fontStyle as string | undefined;
  if (fs && ["normal", "italic", "oblique"].includes(fs)) {
    fontStyle = fs as "normal" | "italic" | "oblique";
  }

  let textShadow: TextShadow | undefined;
  const effects = (textNode as { effects?: unknown }).effects;
  if (Array.isArray(effects)) {
    for (const effect of effects) {
      if (typeof effect === "object" && effect.type === "DROP_SHADOW" && effect.visible !== false) {
        const offset = effect.offset || { x: 0, y: 0 };
        const color = effect.color || { r: 0, g: 0, b: 0, a: 1 };
        textShadow = {
          x: offset.x || 0,
          y: offset.y || 0,
          blur: effect.radius || 0,
          color: rgbaToCss(color),
          extend: effect.spread || 0
        };
        break;
      }
    }
  }

  return { fontFamily, fontSize, fontColor, fontWeight, fontStyle, textShadow };
}

function fillStyleFromTabItem(
  styleObj: BaseStyleObj,
  tabitem: NormalizedNode,
  imagePathMap: Map<string, string>
): void {
  const imageChild = findFirstImageChild(tabitem);
  if (imageChild) {
    const imageUrl = imagePathMap.get(imageChild.id);
    if (imageUrl) {
      styleObj.backgroundImage = imageUrl;
      styleObj.backgroundType = "custom";
      styleObj.backgroundImageType = "100% 100%";
    }
  }
  const textChild = findFirstTextChild(tabitem);
  const textStyle = extractTextStyleFromTextNode(textChild);
  if (textStyle) {
    styleObj.fontFamily = textStyle.fontFamily;
    styleObj.fontSize = textStyle.fontSize;
    styleObj.fontColor = textStyle.fontColor;
    styleObj.fontWeight = textStyle.fontWeight;
    styleObj.fontStyle = textStyle.fontStyle;
    if (textStyle.textShadow) {
      styleObj.isTextShadow = true;
      styleObj.textShadow = textStyle.textShadow;
    }
  }
}

function mode(nums: number[]): number | undefined {
  if (nums.length === 0) {
    return undefined;
  }
  const counts = new Map<number, number>();
  for (const n of nums) {
    counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  let best: number | undefined;
  let bestCount = 0;
  for (const [n, c] of counts) {
    if (c > bestCount) {
      best = n;
      bestCount = c;
    }
  }
  return best;
}

/**
 * 按 absolutePosition 推算 rows/columns/gaps/padding：
 *  - y 接近的 tabitem 归为同一行（容差 = min(height)/2）
 *  - 行内按 x 排序，相邻水平 gap 的众数 = columnGap
 *  - 相邻行的垂直 gap 的众数 = rowGap
 *  - subtab 容器边界 vs 所有 tabitem 包络框的差 = padding
 */
function computeSubtabLayout(subtab: NormalizedNode, tabitems: NormalizedNode[]) {
  const subtabBox = extractLayout(subtab);
  interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
  }
  const boxes: Box[] = tabitems.map((t) => {
    const l = extractLayout(t);
    return { x: l.left, y: l.top, w: l.width, h: l.height };
  });
  if (boxes.length === 0) {
    return {
      rows: 1,
      columns: 0,
      columnGap: 0,
      rowGap: 0,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0
    };
  }

  const minH = Math.min(...boxes.map((b) => b.h));
  const tolerance = Math.max(2, minH / 2);

  const sortedByY = [...boxes].sort((a, b) => a.y - b.y);
  const rowGroups: Box[][] = [];
  for (const box of sortedByY) {
    const lastGroup = rowGroups[rowGroups.length - 1];
    if (lastGroup && Math.abs(box.y - lastGroup[0].y) <= tolerance) {
      lastGroup.push(box);
    } else {
      rowGroups.push([box]);
    }
  }
  rowGroups.forEach((g) => g.sort((a, b) => a.x - b.x));

  const rows = rowGroups.length;
  const columns = Math.max(...rowGroups.map((g) => g.length));

  const colGaps: number[] = [];
  for (const g of rowGroups) {
    for (let i = 1; i < g.length; i++) {
      colGaps.push(Math.round(g[i].x - (g[i - 1].x + g[i - 1].w)));
    }
  }
  const columnGap = mode(colGaps) ?? 0;

  const rowGaps: number[] = [];
  for (let i = 1; i < rowGroups.length; i++) {
    const prevMaxBottom = Math.max(...rowGroups[i - 1].map((b) => b.y + b.h));
    const curMinTop = Math.min(...rowGroups[i].map((b) => b.y));
    rowGaps.push(Math.round(curMinTop - prevMaxBottom));
  }
  const rowGap = mode(rowGaps) ?? 0;

  const allMinX = Math.min(...boxes.map((b) => b.x));
  const allMaxX = Math.max(...boxes.map((b) => b.x + b.w));
  const allMinY = Math.min(...boxes.map((b) => b.y));
  const allMaxY = Math.max(...boxes.map((b) => b.y + b.h));
  return {
    rows,
    columns,
    columnGap: Math.max(0, columnGap),
    rowGap: Math.max(0, rowGap),
    paddingLeft: Math.max(0, Math.round(allMinX - subtabBox.left)),
    paddingRight: Math.max(0, Math.round(subtabBox.left + subtabBox.width - allMaxX)),
    paddingTop: Math.max(0, Math.round(allMinY - subtabBox.top)),
    paddingBottom: Math.max(0, Math.round(subtabBox.top + subtabBox.height - allMaxY))
  };
}

async function querySubtabImageUrls(tabitems: NormalizedNode[]): Promise<Map<string, string>> {
  const imagePathMap = new Map<string, string>();
  try {
    const nodeIds: string[] = [];
    for (const tabitem of tabitems) {
      const img = findFirstImageChild(tabitem);
      if (img) {
        nodeIds.push(img.id);
      }
    }
    if (nodeIds.length === 0) {
      return imagePathMap;
    }

    const result = await batchByNodeIds({ nodeIds });
    if (!result?.data || !Array.isArray(result.data)) {
      return imagePathMap;
    }

    const records = result.data as Array<{ nodeId: string; url: string }>;
    records.forEach((record) => {
      if (record.nodeId && record.url) {
        imagePathMap.set(record.nodeId, record.url);
      }
    });
  } catch (error) {
    console.error(`[SubtabsConversion] ❌ 图片查询异常:`, error);
  }
  return imagePathMap;
}

export class FtSubtabStrategy implements ConvertStrategy {
  async convert({ node }: ConvertParams): Promise<ConvertResult> {
    const { node: subtab } = node;

    const defaultConfig: FtSubtabs = (await getComponentDefaultConfigByModuleId(FT_SUBTABS_MODULE_ID)) as FtSubtabs;
    if (!defaultConfig) {
      throw new Error(
        `未能获取 Subtabs 组件默认配置 (moduleId: ${FT_SUBTABS_MODULE_ID})，请确认数据库中已存入该模块配置`
      );
    }

    const layout = extractLayout(subtab);

    const tabitems: NormalizedNode[] = (subtab.children ?? []).filter(
      (c) => c.type === "INSTANCE" && c.name?.endsWith("-tabitem")
    );

    if (tabitems.length === 0) {
      setComponentBaseProps(defaultConfig as ComponentType, subtab, layout);
      return { component: defaultConfig, message: "未识别到 -tabitem 子节点，保留默认配置" };
    }

    const imagePathMap = await querySubtabImageUrls(tabitems);

    const tabsData: TabItem[] = [];
    let activeIndex = -1;
    const activeTabs: NormalizedNode[] = [];
    const noActiveTabs: NormalizedNode[] = [];

    tabitems.forEach((tab, index) => {
      const textChild = findFirstTextChild(tab);
      const label = textChild?.text ?? tab.name ?? `选项${index + 1}`;
      tabsData.push({ label, value: String(index) });

      const state = getVariantState(tab);
      if (state === "active") {
        if (activeIndex === -1) {
          activeIndex = index;
        }
        activeTabs.push(tab);
      } else if (state === "noActive") {
        noActiveTabs.push(tab);
      }
    });

    // 缺一态时用另一态兜底
    const activeRef = activeTabs[0] ?? noActiveTabs[0] ?? tabitems[0];
    const noActiveRef = noActiveTabs[0] ?? activeRef;

    const activeObj = createEmptyStyleObj();
    const defaultObj = createEmptyStyleObj();
    const hoverObj = createEmptyStyleObj();

    fillStyleFromTabItem(activeObj, activeRef, imagePathMap);
    fillStyleFromTabItem(defaultObj, noActiveRef, imagePathMap);
    fillStyleFromTabItem(hoverObj, noActiveRef, imagePathMap);

    const computedLayout = computeSubtabLayout(subtab, tabitems);

    defaultConfig.data = tabsData;
    defaultConfig.option.rows = computedLayout.rows;
    defaultConfig.option.columns = computedLayout.columns;
    defaultConfig.option.columnGap = computedLayout.columnGap;
    defaultConfig.option.rowGap = computedLayout.rowGap;
    defaultConfig.option.paddingLeft = computedLayout.paddingLeft;
    defaultConfig.option.paddingRight = computedLayout.paddingRight;
    defaultConfig.option.paddingTop = computedLayout.paddingTop;
    defaultConfig.option.paddingBottom = computedLayout.paddingBottom;

    if (activeIndex >= 0) {
      defaultConfig.option.active = activeIndex;
    }

    defaultConfig.option.defaultObj = defaultObj;
    defaultConfig.option.activeObj = activeObj;
    defaultConfig.option.hoverObj = hoverObj;

    setComponentBaseProps(defaultConfig as ComponentType, subtab, layout);

    return { component: defaultConfig, message: "成功转换为 FtSubtabs" };
  }
}
