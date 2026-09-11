/**
 * DOM 截图前统一 sanitize 流水线：
 * snapshots → live media patches → video 数据层 sanitize → img CORS sanitize
 */
import { CorsMediaFallback } from "../corsMediaFallback";
import type { ComponentList, SnapshotMap } from "../types/captureInternal";
import { VideoDataCapture } from "../videoDataCapture";

export interface DomSanitizeLiveDeps {
  buildSnapshotsAsync(root: HTMLElement, componentList: ComponentList): Promise<SnapshotMap>;
  applyLiveMediaPatches(root: HTMLElement, snapshots: SnapshotMap): () => void;
}

export interface DomCaptureSanitizeOptions {
  root: HTMLElement;
  componentList: ComponentList;
  deps: DomSanitizeLiveDeps;
  /** 默认 true；snapdom 等轻量路径可关闭 */
  sanitizeVideo?: boolean;
  sanitizeImg?: boolean;
}

export interface DomCaptureSanitizeSession {
  snapshots: SnapshotMap;
  restore: () => void;
}

export async function runDomCaptureSanitizePipeline(
  options: DomCaptureSanitizeOptions
): Promise<DomCaptureSanitizeSession> {
  const { root, componentList, deps, sanitizeVideo = true, sanitizeImg = true } = options;

  const snapshots = await deps.buildSnapshotsAsync(root, componentList);
  const restoreLiveFrames = deps.applyLiveMediaPatches(root, snapshots);

  let restoreVideoSanitize = () => {};
  let restoreImgSanitize = () => {};

  if (sanitizeVideo) {
    restoreVideoSanitize = await CorsMediaFallback.applyLiveVideoSanitize(root, (video) =>
      VideoDataCapture.captureVideoFromElement(video, componentList)
    );
  }
  if (sanitizeImg) {
    restoreImgSanitize = await CorsMediaFallback.applyLiveImgSanitize(root);
  }

  return {
    snapshots,
    restore: () => {
      restoreLiveFrames();
      restoreVideoSanitize();
      restoreImgSanitize();
    }
  };
}
