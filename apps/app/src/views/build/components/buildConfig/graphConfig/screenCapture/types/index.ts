export type CaptureElementRef = string | HTMLElement;

export type { CaptureComponentItem, ComponentList } from "./captureInternal";

import type { ComponentList } from "./captureInternal";

export interface CaptureScope {
  root: HTMLElement;
  canvas: HTMLElement;
  editor: HTMLElement;
  designSize: { width: number; height: number };
}

export interface LayerCaptureOptions {
  componentList?: ComponentList;
  mode?: "editor" | "preview";
  root?: CaptureElementRef;
  canvas?: CaptureElementRef;
  editor?: CaptureElementRef;
  moduleSelector?: string;
  mimeType?: "image/png" | "image/jpeg";
  captureStrategy?: "panelStitch" | "single" | "composite";
}

/** 构建页封面截图模式 */
export type EditorScreenShotMode = "full" | "simple";

export interface ScreenShotOptions extends Omit<LayerCaptureOptions, "mimeType" | "mode"> {
  mimeType?: "image/jpeg" | "image/png";
  fileName?: string;
  /** 构建页封面截图模式：full=完整分层合成，simple=整屏快速截取 */
  screenShotMode?: EditorScreenShotMode;
  /** simple 模式：渲染倍率，默认 1 */
  scale?: number;
  /** simple 模式：透明区域的填充色（JPEG 不带透明通道，不填会变黑） */
  backgroundColor?: string;
  /** simple 模式：不进截图的节点选择器（编辑器选中框、对齐线等） */
  exclude?: string[];
  /** simple 模式：光栅化用的设备像素比，默认取 window.devicePixelRatio（浏览器缩放、系统缩放都会改它） */
  dpr?: number;
  /**
   * simple 模式：透传 snapdom 的 outerShadows。**snapdom 2.0.1 的实际行为与它的类型注释相反**：
   * true 按根节点的阴影/外描边/blur 扩大截图范围（输出比元素大、原点偏移）；false（默认）剥掉这些、输出严格等于元素尺寸
   */
  outerShadows?: boolean;
}

export interface ScreenShotResult {
  dataUrl: string;
  file: File;
}

export type CaptureStrategyName = "videoStream" | "videoNormal" | "chart" | "image" | "textDom" | "domOverlay";

export { type CaptureModuleContext, CaptureModuleStrategyKind, type ICaptureModuleStrategy } from "../strategies/types";

/** Strategy 模式：单组件内容策略接口 */
export interface ISingleComponentStrategy {
  readonly name: string;
}
