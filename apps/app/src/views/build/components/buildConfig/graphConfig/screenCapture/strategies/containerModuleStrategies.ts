import type { CaptureLayer, ComponentList, DesignSize, ModuleDescriptor } from "../types/captureInternal";
import { createContainerModuleStrategy } from "./createContainerModuleStrategy";
import { type CaptureModuleContext, CaptureModuleStrategyKind, type ICaptureModuleStrategy } from "./types";

export interface PanelStrategyDeps {
  buildLayer(
    module: ModuleDescriptor,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList: ComponentList
  ): Promise<CaptureLayer | null>;
  isPanelModule(ctx: CaptureModuleContext): boolean;
}

export interface GroupComponentStrategyDeps {
  isGroupModule(ctx: CaptureModuleContext): boolean;
  buildLayer(
    module: ModuleDescriptor,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList: ComponentList
  ): Promise<CaptureLayer | null>;
  capturePerComponent(
    module: ModuleDescriptor,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList: ComponentList
  ): Promise<CaptureLayer | null>;
}

export interface DomStrategyDeps {
  capturePerComponent(
    module: ModuleDescriptor,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList: ComponentList
  ): Promise<CaptureLayer | null>;
}

/** 动态面板 / 引用面板 / 专题面板 */
export function createPanelStrategy(deps: PanelStrategyDeps): ICaptureModuleStrategy {
  return createContainerModuleStrategy({
    kind: CaptureModuleStrategyKind.PANEL,
    matches: deps.isPanelModule,
    buildLayer: deps.buildLayer
  });
}

/** 组组件：data 栅格整层，失败回退 html2canvas 整盒 */
export function createGroupComponentStrategy(deps: GroupComponentStrategyDeps): ICaptureModuleStrategy {
  return createContainerModuleStrategy({
    kind: CaptureModuleStrategyKind.GROUP,
    matches: deps.isGroupModule,
    buildLayer: deps.buildLayer,
    capturePerComponent: deps.capturePerComponent,
    fallbackToPerComponent: true
  });
}

/** 普通单组件 DOM（html2canvas 逐块） */
export function createDomStrategy(deps: DomStrategyDeps): ICaptureModuleStrategy {
  return createContainerModuleStrategy({
    kind: CaptureModuleStrategyKind.DOM,
    capturePerComponent: deps.capturePerComponent
  });
}
