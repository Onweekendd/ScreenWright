/** captureStrategies 遗留 DOM 截图共用：类型收窄与 canvas 工具 */

export interface StyleStashItem {
  el?: HTMLElement;
  opacity?: string;
  visibility?: string;
  display?: string;
  animation?: string;
  pointerEvents?: string;
  scrollTop?: number;
  transform?: string;
  webkitTransform?: string;
  innerHTML?: string;
  video?: HTMLVideoElement;
  img?: HTMLImageElement;
  parent?: ParentNode | null;
  replacement?: HTMLElement | null;
  node?: Node | null;
  crossOrigin?: string | null;
  src?: string;
}

export const errMsg = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** querySelector 等返回 Element，legacy 截图逻辑中按 HTMLElement 使用 */
export const castHtml = (el: Element | Document | null | undefined): HTMLElement => el as HTMLElement;

export const castVideo = (el: Element | null | undefined): HTMLVideoElement => el as HTMLVideoElement;

export const asDoc = (root: Document | HTMLElement): Document =>
  root instanceof Document ? root : (root.ownerDocument ?? document);

export const canvasCtx = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => canvas.getContext("2d")!;
