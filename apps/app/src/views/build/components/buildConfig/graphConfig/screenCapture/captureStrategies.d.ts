import type { CaptureMimeType, ComponentList, VideoPlaybackEntry } from "./types/captureInternal";
import type { CaptureScope, LayerCaptureOptions } from "./types";

/** captureStrategies.ts 对外 API 类型（实现文件为 legacy DOM，使用 @ts-nocheck） */
export declare const BiCaptureEntry: {
  resolveScope(options: LayerCaptureOptions): Promise<CaptureScope>;
  markCaptureWrapper(canvas: HTMLElement): () => void;
};

export declare const ChartCapture: {
  waitReady(root: HTMLElement): Promise<void>;
};

export declare const DomOverlayCapture: {
  captureOnce(scope: CaptureScope, outMime: CaptureMimeType, componentList: ComponentList): Promise<string | null>;
};

export declare const Readiness: {
  waitFonts(): Promise<void>;
  waitImagesReady(root: HTMLElement, timeoutMs?: number): Promise<void>;
  waitComplexDomReady(root: HTMLElement): Promise<void>;
  waitPanelContentReady(root: HTMLElement, componentList: ComponentList): Promise<void>;
  waitPageContentReady(root: HTMLElement): Promise<void>;
};

export declare const ScreenCompositor: {
  capturePanelStitch(
    scope: CaptureScope,
    componentList: ComponentList,
    zMap: Map<string, number>,
    outMime: CaptureMimeType
  ): Promise<string | null>;
  capture(
    canvas: HTMLElement,
    root: HTMLElement,
    zMap: Map<string, number>,
    componentList: ComponentList,
    outMime: CaptureMimeType
  ): Promise<string | null>;
};

export declare const VideoNormal: {
  _playbackRestoreQueue: VideoPlaybackEntry[];
  waitReady(root: HTMLElement): Promise<void>;
  restoreAfterCapture(): Promise<void>;
};

export declare const CaptureStrategyFactory: {
  captureModule(ctx: unknown): Promise<unknown[] | null>;
};

export declare const Transform3DCapture: Record<string, unknown>;
export declare const CaptureNodeClassifier: Record<string, unknown>;
export declare const CaptureTreeWalker: Record<string, unknown>;
export declare const ContentStrategies: Record<string, unknown>;
export declare const ImageCapture: Record<string, unknown>;
export declare const ModuleAnalyzer: Record<string, unknown>;
export declare const ModuleComposer: Record<string, unknown>;
export declare const PanelCapture: Record<string, unknown>;
export declare const PanelEntryResolver: Record<string, unknown>;
export declare const SingleComponentCapture: Record<string, unknown>;
export declare const FontDomCapture: Record<string, unknown>;
/** @deprecated 使用 FontDomCapture */
export declare const TextDomCapture: Record<string, unknown>;
export declare const VideoStrategy: Record<string, unknown> | null;
export declare const UeStreamCapture: Record<string, unknown>;
