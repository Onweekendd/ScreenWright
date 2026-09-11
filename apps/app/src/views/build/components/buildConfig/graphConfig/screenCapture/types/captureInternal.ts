import type { CaptureScope, LayerCaptureOptions } from "./index";

/** 面板状态项（panelData 元素） */
export interface PanelStatusEntry {
  id?: number | string;
  config?: CaptureComponentItem[];
  backgroundColor?: string;
  display?: string;
  [key: string]: unknown;
}

/** 大屏组件树节点（构建页 componentList 项） */
export interface CaptureComponentItem {
  id?: number | string;
  zIndex?: number;
  left?: number;
  top?: number;
  status?: number;
  activeStatusId?: number | string;
  activeStatus?: { id?: number | string };
  children?: CaptureComponentItem[];
  data?: Array<{ value?: string; cover?: string }>;
  option?: {
    url?: string;
    src?: string;
    cover?: string;
    prop?: string;
    backgroundImage?: string;
    [key: string]: unknown;
  };
  component?: {
    width?: number;
    height?: number;
    prop?: string;
  };
  panelData?: PanelStatusEntry[];
}

export type ComponentList = CaptureComponentItem[] | undefined;

export interface DesignSize {
  width: number;
  height: number;
}

export interface DesignRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface OutputBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type CaptureLayerKind = "ue" | "ui" | "dom" | "panel" | "image" | "video";

export interface CaptureLayer {
  id: string;
  kind: CaptureLayerKind | string;
  zIndex: number;
  designRect: DesignRect;
  dataUrl: string;
  pixelW?: number;
  pixelH?: number;
}

export interface SnapshotPayload {
  dataUrl: string | null;
  rect: DOMRect;
  tag: string;
  url?: string;
}

export type SnapshotMap = Map<string, SnapshotPayload>;

export type SnapshotMarkFn = (el: Element, payload: SnapshotPayload) => void;

/** 构建快照时的中间 payload（dataUrl 可能尚未就绪） */
export interface SnapshotBuildPayload {
  dataUrl: string | null;
  rect: DOMRect;
  tag: string;
  url?: string;
}

export interface VideoPlaybackEntry {
  video: HTMLVideoElement;
  wasPlaying: boolean;
  savedTime: number;
}

export type RestoreFn = () => void;

export type CaptureMimeType = "image/png" | "image/jpeg";

export interface ModuleDescriptor {
  id: string;
  host: HTMLElement;
  box: HTMLElement;
  designRect: DesignRect;
  zIndex: number;
  primaryMode: string;
  strategies: string[];
  panelItem?: CaptureComponentItem | null;
  groupItem?: CaptureComponentItem | null;
  content?: Record<string, boolean>;
  kind?: CaptureLayerKind | string;
  inPanel?: boolean;
}

export interface CapturePlanNode {
  id: string;
  kind: string;
  prop?: string;
  zIndex: number;
  contentRoot?: boolean;
  innerCount?: number;
  childIds?: string[];
}

export interface GradientStop {
  offset?: number;
  position?: number;
  color: string;
}

export interface Html2CanvasOptions {
  scale?: number;
  width?: number;
  height?: number;
  backgroundColor?: string | null;
  onClone?: (clonedDoc: Document, element: HTMLElement) => void;
}

export interface SnapdomCaptureOptions {
  scale?: number;
  width?: number;
  height?: number;
  backgroundColor?: string | null;
  afterCloneFn?: (cloneRoot: Document | HTMLElement, liveElement: HTMLElement) => void;
  filter?: (el: Element) => boolean;
  filterMode?: string;
}

export type ConsoleLogLevel = "info" | "warn" | "error" | "log";

export type { CaptureScope, LayerCaptureOptions };
