import type { ComponentType, ParsedLargeScreenInfo } from "@screenwright/types";

import { flattenComponents, summarizeSubtree } from "./component-tree";
import type { LayoutFile, LayoutGrid, LayoutNode, NestedLayoutFile } from "./types";

/**
 * _layout.json 骨架构建（无状态纯函数）：坐标量化到网格 + ASCII 占位图 + 主题采样。
 * 顶层用 24×12 网格，嵌套容器（分组/动态面板状态）用同规格的更简洁版本。
 */

/** 网格列数 / 行数（24×12 既能表达等分/三分，又够覆盖纵向堆叠） */
const GRID_COLS = 24;
const GRID_ROWS = 12;

/** 嵌套容器（分组 / 动态面板状态）内部 _layout.json 用的网格，规模更小以保持简洁 */
const NESTED_GRID_COLS = 24;
const NESTED_GRID_ROWS = 12;

const round3 = (v: number) => Math.round(v * 1000) / 1000;

/**
 * 把组件列表渲染成 ASCII 占位图，确定性生成，供 agent 一眼建立空间认知。
 * cols/rows 决定网格分辨率：根目录用 24×12，嵌套容器用 12×6。
 *
 * 规则：画布 = rows 行 × cols×CELL_W 列；按面积降序绘制（大块先画，小块后覆盖）；空白用「·」；末尾附 legend。
 */
const CELL_W = 2;
const ASCII_KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const buildAsciiMap = (components: LayoutNode[], cols = GRID_COLS, rows = GRID_ROWS): string => {
  if (!components.length) {
    return "";
  }

  const width = cols * CELL_W;
  const canvas: string[][] = Array.from({ length: rows }, () => Array<string>(width).fill("·"));

  const items = components.map((n, i) => ({ n, key: ASCII_KEYS[i] ?? "#" }));

  // zIndex 小的先画（底层），大的后画（前景覆盖），与运行时渲染顺序一致
  for (const { n, key } of [...items].sort((a, b) => a.n.zIndex - b.n.zIndex)) {
    const c0 = Math.max(1, n.grid.colStart);
    const c1 = Math.min(cols, n.grid.colEnd);
    const r0 = Math.max(1, n.grid.rowStart);
    const r1 = Math.min(rows, n.grid.rowEnd);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        for (let w = 0; w < CELL_W; w++) {
          canvas[r - 1][(c - 1) * CELL_W + w] = key;
        }
      }
    }
  }

  // 检测被遮：像素矩形包含判断——某个更高 zIndex 的组件的 rectPx 完全包含当前组件时才标 [被遮]
  // 不用网格判断，避免网格粗糙导致误判（格子共用 ≠ 实际像素重叠）
  const sortedByZ = [...items].sort((a, b) => a.n.zIndex - b.n.zIndex);
  const coveredIds = new Set<string | number>();
  for (let i = 0; i < sortedByZ.length; i++) {
    const { x, y, w, h } = sortedByZ[i].n.rectPx;
    const higher = sortedByZ.slice(i + 1).map((e) => e.n);
    if (
      higher.some(
        (o) =>
          o.rectPx.x <= x && o.rectPx.y <= y && o.rectPx.x + o.rectPx.w >= x + w && o.rectPx.y + o.rectPx.h >= y + h
      )
    ) {
      coveredIds.add(sortedByZ[i].n.id);
    }
  }

  const isFull = (n: LayoutNode) =>
    n.grid.colStart <= 1 && n.grid.colEnd >= cols && n.grid.rowStart <= 1 && n.grid.rowEnd >= rows;

  const posStr = (n: LayoutNode) => {
    if (isFull(n)) {
      return "铺满";
    }
    if (n.grid.rowStart === n.grid.rowEnd) {
      return `行${n.grid.rowStart}`;
    }
    return `行${n.grid.rowStart}-${n.grid.rowEnd}`;
  };

  const childrenStr = (n: LayoutNode) => {
    if (!n.childrenSummary) {
      return "";
    }
    const { descendants, byType } = n.childrenSummary;
    const types = Object.entries(byType)
      .map(([k, v]) => `${k}×${v}`)
      .join(" ");
    return `，含${descendants}子: ${types}`;
  };

  const gridStr = canvas.map((row) => row.join("")).join("\n");
  const legend = items
    .map(({ n, key }) => {
      const covered = coveredIds.has(n.id) ? " [被遮]" : "";
      return `${key} = ${n.name || n.id}（${n.type || n.prop}，z${n.zIndex}${isFull(n) ? "，铺满" : ""}${childrenStr(n)}，id ${n.id}）${covered}`;
    })
    .join("\n");

  const stackOrder = [...items]
    .sort((a, b) => a.n.zIndex - b.n.zIndex)
    .map(({ n, key }) => `${key}-${n.name || n.id}(z${n.zIndex},${posStr(n)})`)
    .join(" → ");

  return `${gridStr}\n\n图例（· = 空白）：\n${legend}\n\n层叠顺序（底→顶）：${stackOrder}`;
};

/**
 * 把单个组件转成 _layout 节点：percent 单位换算 → 像素矩形 + 网格占位 + 子树摘要。
 * 顶层与嵌套容器共用同一套换算（container 的 width/height 即换算基准与网格总尺寸）。
 *
 * unitPavenType="percent" 时 left/top 与 width/height 是相对 width/height 的百分比而非像素，
 * 需先换算成像素，否则铺满全屏的背景（如 3D 场景 threescene、地图）会被量化成角落小窗。
 * 常见于 left:0/top:0/width:100/height:100 = 100%×100% 全屏。
 */
const buildLayoutNode = (comp: ComponentType, width: number, height: number, grid: LayoutGrid): LayoutNode => {
  const isPercent = (comp as { unitPavenType?: string }).unitPavenType === "percent";
  const left = isPercent ? (comp.left / 100) * width : comp.left;
  const top = isPercent ? (comp.top / 100) * height : comp.top;
  const compW = isPercent ? (comp.component.width / 100) * width : comp.component.width;
  const compH = isPercent ? (comp.component.height / 100) * height : comp.component.height;

  const node: LayoutNode = {
    id: comp.id,
    type: comp.title ?? "",
    prop: comp.component.prop,
    name: comp.name ?? comp.title ?? "",
    zIndex: comp.zIndex ?? 0,
    rectPx: { x: round3(left), y: round3(top), w: compW, h: compH },
    grid: {
      colStart: Math.floor(left / grid.colPx) + 1,
      colEnd: Math.ceil((left + compW) / grid.colPx),
      rowStart: Math.floor(top / grid.rowPx) + 1,
      rowEnd: Math.ceil((top + compH) / grid.rowPx)
    }
  };

  const summary = summarizeSubtree(comp);
  if (summary) {
    node.childrenSummary = summary;
  }

  return node;
};

/**
 * 构建 _layout.json：顶层（depth=0）组件骨架，坐标转为屏幕绝对值并量化到网格。
 * 不再递归展开子组件——每个容器组件用 childrenSummary 概括子树规模，深层逐个坐标按需读 component/*.json。
 * （顶层组件无祖先偏移，分组/动态面板的偏移规则只影响其内部子组件坐标，已不在 _layout 内展开，故无需累加。）
 */
export const buildLayout = (layers: ComponentType[], detail: ParsedLargeScreenInfo["detail"]): LayoutFile => {
  const width = Number(detail?.width) || 0;
  const height = Number(detail?.height) || 0;
  const grid: LayoutGrid = {
    cols: GRID_COLS,
    rows: GRID_ROWS,
    colPx: width > 0 ? width / GRID_COLS : 1,
    rowPx: height > 0 ? height / GRID_ROWS : 1
  };

  const components = layers.map((comp) => buildLayoutNode(comp, width, height, grid));

  // theme 采样：统计叶子组件 option 的字体/颜色众数
  const flat = flattenComponents(layers);
  const fontFreq = new Map<string, number>();
  const colorFreq = new Map<string, number>();
  for (const comp of flat) {
    const opt = comp.option as Record<string, unknown> | undefined;
    if (!opt) {
      continue;
    }
    if (typeof opt.fontFamily === "string" && opt.fontFamily) {
      fontFreq.set(opt.fontFamily, (fontFreq.get(opt.fontFamily) ?? 0) + 1);
    }
    if (typeof opt.color === "string" && opt.color) {
      colorFreq.set(opt.color, (colorFreq.get(opt.color) ?? 0) + 1);
    }
  }
  const topByFreq = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const bg = detail?.backgroundColor ?? "";
  const isOpaqueColor = (c: string) => c !== bg && !/,\s*0(\.0+)?\s*\)\s*$/.test(c);
  const topColors = topByFreq(colorFreq).filter(isOpaqueColor);

  return {
    screen: { id: 0, width, height, bg },
    grid,
    ascii_map: buildAsciiMap(components),
    components,
    theme_hints: {
      fontFamily: topByFreq(fontFreq)[0] ?? "",
      colors: { bg, accent: topColors[0] ?? "", highlight: topColors[1] ?? "" }
    }
  };
};

/**
 * 构建嵌套容器（分组 / 动态面板某一状态）目录下的 _layout.json。
 * 子组件坐标在 screenwright 中是相对于父容器的像素偏移，直接量化到 NESTED 网格即可。
 */
export const buildNestedLayout = (
  container: ComponentType,
  children: ComponentType[],
  state: { id: string; name: string } | undefined,
  dir: string
): NestedLayoutFile => {
  const width = container.component.width || 0;
  const height = container.component.height || 0;
  const grid: LayoutGrid = {
    cols: NESTED_GRID_COLS,
    rows: NESTED_GRID_ROWS,
    colPx: width > 0 ? width / NESTED_GRID_COLS : 1,
    rowPx: height > 0 ? height / NESTED_GRID_ROWS : 1
  };

  const components = children.map((comp) => buildLayoutNode(comp, width, height, grid));

  const containerInfo: NestedLayoutFile["container"] = {
    id: container.id,
    name: container.name ?? container.title ?? "",
    prop: container.component.prop,
    width,
    height,
    dir
  };
  if (state) {
    containerInfo.stateId = state.id;
    containerInfo.stateName = state.name;
  }

  return {
    container: containerInfo,
    grid,
    ascii_map: buildAsciiMap(components, NESTED_GRID_COLS, NESTED_GRID_ROWS),
    components
  };
};
