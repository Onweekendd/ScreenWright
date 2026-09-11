import type { CaptureLayer, ComponentList, DesignSize, ModuleDescriptor } from "../types/captureInternal";

/** 模块级截图策略种类（容器维度：面板 / 组 / 特殊单组件 / 普通 DOM） */
export enum CaptureModuleStrategyKind {
  PANEL = "panel",
  GROUP = "group",
  SPECIAL = "special",
  VIDEO = "video",
  FONT_DOM = "fontDom",
  DOM = "dom"
}

export interface CaptureModuleContext {
  module: ModuleDescriptor;
  viewWrapper: HTMLElement;
  designSize: DesignSize;
  componentList: ComponentList;
}

export interface ICaptureModuleStrategy {
  readonly kind: CaptureModuleStrategyKind;
  /** 是否由本策略处理该模块 */
  matches(ctx: CaptureModuleContext): boolean;
  /** 返回单个图层或图层数组；失败返回 null */
  capture(ctx: CaptureModuleContext): Promise<CaptureLayer | CaptureLayer[] | null>;
}

export type CaptureModuleStrategyFactory = (deps: Record<string, unknown>) => ICaptureModuleStrategy;
