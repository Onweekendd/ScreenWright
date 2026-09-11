import type { ComponentType, ParsedLargeScreenInfo } from "@screenwright/types";

/**
 * 大屏元信息（已解析）。
 * = ParsedLargeScreenInfo 去掉 layers（组件树由 ComponentManager 单独管理）。
 * detail（大屏详细配置：尺寸/适配/终端通信等）已纳入共享状态，供 app 与 @screenwright/composables 共同读写，
 * 不再需要各自维护一份分裂的本地副本。
 */
export type NavInfo = Omit<ParsedLargeScreenInfo, "layers">;

/**
 * 画布选中目标。
 * hoverId：当前悬停的组件 id；selectId：当前选中的组件 id 列表。
 */
export interface TargetChart {
  hoverId?: string | number;
  selectId: string[];
}

/**
 * 编辑器核心状态。
 * 已包含：大屏元信息（navInfo，含 detail）、组件树（layers）、选区（componentList / targetChart）。
 */
export interface EditorCoreState {
  navInfo: NavInfo;
  /** 组件树（已解析的图层数组）。 */
  layers: ComponentType[];
  /** 当前编辑中的组件列表（选区模型用；与 layers 经 syncFromLayers 同步，语义独立）。 */
  componentList: ComponentType[];
  /** 画布选中目标（hover / select）。 */
  targetChart: TargetChart;
}
