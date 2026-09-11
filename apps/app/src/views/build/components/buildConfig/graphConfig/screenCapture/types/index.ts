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
