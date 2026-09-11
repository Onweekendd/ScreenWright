/** ImageCapture 对外 API（供 singleComponentCapture 注入，避免循环依赖） */
import type { SnapshotMap } from "../types/captureInternal";

export interface ImageCaptureApi {
  detectInHost(host: HTMLElement, box: HTMLElement): boolean;
  hasNonRasterContent(host: HTMLElement): boolean;
  applyBgSnapshotsOnClone(clonedDoc: Document | HTMLElement, snapshots: SnapshotMap): void;
  applyImgSnapshotsOnClone(
    clonedDoc: Document | HTMLElement,
    snapshots: SnapshotMap,
    liveRoot?: HTMLElement
  ): void;
}
