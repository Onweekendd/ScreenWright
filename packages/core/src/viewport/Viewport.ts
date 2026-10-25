export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

/**
 * 相机状态：世界原点在视口内的偏移（屏幕 px）+ 缩放。
 * 屏幕坐标 = 世界坐标 * zoom + (x, y)，对应 CSS `translate(x, y) scale(zoom)`（transform-origin: 0 0）。
 */
export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface ViewportOptions {
  minZoom?: number;
  maxZoom?: number;
  zoom?: number;
}

export interface FitOptions {
  /** 目标矩形占视口的比例，默认 0.8（四周留白） */
  fill?: number;
  /** 适配后的缩放上限，默认不超过 maxZoom */
  maxZoom?: number;
}

export type CameraListener = (camera: CameraState) => void;

const DEFAULT_MIN_ZOOM = 0.02;
const DEFAULT_MAX_ZOOM = 8;

/**
 * 无限画布的相机。纯视图状态：不进编辑器的文档状态，也不参与撤销重做。
 * 视口尺寸（屏幕像素）由外部通过 setSize 注入，所有屏幕坐标都以视口左上角为原点。
 */
export class Viewport {
  readonly minZoom: number;
  readonly maxZoom: number;

  private camera: CameraState;
  private size: Size = { width: 0, height: 0 };
  private readonly listeners = new Set<CameraListener>();

  constructor(options: ViewportOptions = {}) {
    this.minZoom = options.minZoom ?? DEFAULT_MIN_ZOOM;
    this.maxZoom = options.maxZoom ?? DEFAULT_MAX_ZOOM;
    this.camera = { x: 0, y: 0, zoom: this.clampZoom(options.zoom ?? 1) };
  }

  getCamera(): CameraState {
    return { ...this.camera };
  }

  getSize(): Size {
    return { ...this.size };
  }

  setSize(width: number, height: number): void {
    this.size = { width: Math.max(0, width), height: Math.max(0, height) };
  }

  setCamera(patch: Partial<CameraState>): void {
    const next: CameraState = {
      x: Number.isFinite(patch.x) ? (patch.x as number) : this.camera.x,
      y: Number.isFinite(patch.y) ? (patch.y as number) : this.camera.y,
      zoom: patch.zoom === undefined ? this.camera.zoom : this.clampZoom(patch.zoom)
    };
    if (next.x === this.camera.x && next.y === this.camera.y && next.zoom === this.camera.zoom) {
      return;
    }
    this.camera = next;
    this.listeners.forEach((listener) => listener(this.getCamera()));
  }

  /** 平移，dx/dy 为屏幕像素（正数 = 内容向右/下移动） */
  panBy(dx: number, dy: number): void {
    this.setCamera({ x: this.camera.x + dx, y: this.camera.y + dy });
  }

  /** 以屏幕上的某一点为锚点缩放，该点下的世界坐标保持不动 */
  zoomAt(anchor: Point, nextZoom: number): void {
    const zoom = this.clampZoom(nextZoom);
    if (zoom === this.camera.zoom) {
      return;
    }
    const world = this.screenToWorld(anchor);
    this.setCamera({ x: anchor.x - world.x * zoom, y: anchor.y - world.y * zoom, zoom });
  }

  /** 以锚点为中心按倍率缩放（factor > 1 放大） */
  zoomBy(anchor: Point, factor: number): void {
    this.zoomAt(anchor, this.camera.zoom * factor);
  }

  screenToWorld(point: Point): Point {
    const { x, y, zoom } = this.camera;
    return { x: (point.x - x) / zoom, y: (point.y - y) / zoom };
  }

  worldToScreen(point: Point): Point {
    const { x, y, zoom } = this.camera;
    return { x: point.x * zoom + x, y: point.y * zoom + y };
  }

  /** 当前视口覆盖的世界矩形，用于只渲染可视区内的元素 */
  visibleWorldRect(): Rect {
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: this.size.width / this.camera.zoom,
      height: this.size.height / this.camera.zoom
    };
  }

  /** 把世界矩形居中放进视口，缩放到 fill 比例。视口尺寸为 0 时不动。 */
  fitRect(rect: Rect, options: FitOptions = {}): void {
    const { width, height } = this.size;
    if (width <= 0 || height <= 0 || rect.width <= 0 || rect.height <= 0) {
      return;
    }
    const fill = options.fill ?? 0.8;
    const fitted = Math.min(width / rect.width, height / rect.height) * fill;
    const zoom = Math.min(this.clampZoom(fitted), options.maxZoom ?? this.maxZoom);
    this.centerOn({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }, zoom);
  }

  /** 把世界坐标点放到视口正中，可同时指定缩放 */
  centerOn(world: Point, zoom: number = this.camera.zoom): void {
    const nextZoom = this.clampZoom(zoom);
    this.setCamera({
      x: this.size.width / 2 - world.x * nextZoom,
      y: this.size.height / 2 - world.y * nextZoom,
      zoom: nextZoom
    });
  }

  subscribe(listener: CameraListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private clampZoom(zoom: number): number {
    if (!Number.isFinite(zoom)) {
      return this.camera?.zoom ?? 1;
    }
    return Math.min(this.maxZoom, Math.max(this.minZoom, zoom));
  }
}
