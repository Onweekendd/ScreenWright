/**
 * bi-data-sync 内部共享类型定义。
 * 仅类型，无运行时逻辑；各拆分模块从此处引入，避免类型在多文件间复制。
 */

export interface ScreenMeta {
  updatedTime: string;
  componentIds: number[];
}

export interface DataFlowEntry {
  emittedBy: Array<{ id: string; name: string; originField: string; onEvents: string[] }>;
  consumedBy: Array<{ filterName: string; boundTo: Array<{ id: string; name: string }> }>;
}

export interface EventFlowEntry {
  sourceId: string;
  sourceName: string;
  trigger: string;
  conditions: Array<{ field?: string; compare?: string; expected?: string }>;
  targets: Array<{ id: string; name: string; actionType: string }>;
}

/** 网格元信息：把屏幕切成 cols×rows，单元格像素尺寸供下游反算 */
export interface LayoutGrid {
  cols: number;
  rows: number;
  colPx: number;
  rowPx: number;
}

export interface LayoutRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 组件在网格中的占位（1-based，便于人类阅读"第几列/行"） */
export interface LayoutGridArea {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
}

/** 子树规模摘要：把嵌套子组件折叠成「后代总数 + 按中文类型计数」，避免 _layout 递归展开撑爆上下文 */
export interface ChildrenSummary {
  /** 整棵子树的后代数量（含各层子组件与动态面板状态） */
  descendants: number;
  /** 按组件中文类型标识（title）计数，动态面板的状态计入「状态」键，便于一眼读出嵌套构成 */
  byType: Record<string, number>;
}

/**
 * _layout.json 中的单个节点：坐标已转为容器绝对值（顶层为屏幕绝对值，嵌套层为相对父容器）。
 * 不再递归展开子组件——子树以 childrenSummary 概括，深层逐个坐标按需读 component/*.json。
 */
export interface LayoutNode {
  id: string | number;
  type: string;
  prop: string;
  name: string;
  zIndex: number;
  rectPx: LayoutRect;
  grid: LayoutGridArea;
  /** 仅容器组件（分组/动态面板）有；叶子组件无此字段 */
  childrenSummary?: ChildrenSummary;
}

export interface LayoutFile {
  screen: { id: number; width: number; height: number; bg: string };
  grid: LayoutGrid;
  /** 24×12 网格占位的 ASCII 占位图（确定性生成，供 agent 一眼建立空间认知）；配 legend 映射回组件 */
  ascii_map: string;
  components: LayoutNode[];
  theme_hints: {
    fontFamily: string;
    colors: { bg: string; accent: string; highlight: string };
  };
}

/** 嵌套容器（分组 / 动态面板状态）目录下的 _layout.json；比根目录版更简洁，无 screen/theme_hints */
export interface NestedLayoutFile {
  /** 容器组件的基本信息；动态面板时额外含 stateId / stateName */
  container: {
    id: number;
    name: string;
    prop: string;
    width: number;
    height: number;
    stateId?: string;
    stateName?: string;
    /** 本 _layout.json 所在目录相对于 component/ 的路径（正斜杠），用于直接拼接子组件文件路径 */
    dir: string;
  };
  grid: LayoutGrid;
  ascii_map: string;
  components: LayoutNode[];
}
