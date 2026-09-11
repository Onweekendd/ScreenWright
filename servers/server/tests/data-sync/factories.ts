import type { ComponentType, ParsedLargeScreenInfo } from "@screenwright/types";

/**
 * 纯函数模块单测用的组件工厂：只填被测函数真正读取的字段，其余用 `as unknown as` 收口。
 * 避免每个用例手写庞大的 ComponentType 结构。
 */
export interface CompOpts {
  id: number;
  prop?: string;
  title?: string;
  name?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  option?: Record<string, unknown>;
  unitPavenType?: string;
  children?: ComponentType[];
  panelData?: Array<{ id: string; name: string; config: ComponentType[] }>;
  events?: unknown[];
  cbArgs?: unknown[];
  listenArgs?: unknown[];
  openFilter?: boolean;
}

export const comp = (o: CompOpts): ComponentType => {
  const {
    id,
    prop = "sw-text",
    title = "",
    name = "",
    left = 0,
    top = 0,
    width = 100,
    height = 100,
    zIndex = 0,
    ...rest
  } = o;
  return {
    id,
    title,
    name,
    left,
    top,
    zIndex,
    component: { prop, name: name || title, width, height },
    ...rest
  } as unknown as ComponentType;
};

/** 构造 buildLayout 的 detail 入参 */
export const detail = (d: {
  width: number;
  height: number;
  backgroundColor?: string;
}): ParsedLargeScreenInfo["detail"] => d as unknown as ParsedLargeScreenInfo["detail"];

/** 构造 buildCallbackFlowGraph 的 dataFilterArr 入参 */
export const filters = (
  f: Record<string, { callBack: string[] }> | undefined
): ParsedLargeScreenInfo["dataFilterArr"] => f as unknown as ParsedLargeScreenInfo["dataFilterArr"];
