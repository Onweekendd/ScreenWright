/** video 标签 / 视频组件 DOM 分类（供 videoStrategy 路由） */
import { Utils } from "../captureUtils";
export const VideoKind = {
  FT_VIDEO: "ftVideo",
  OPEN_VIDEO: "openVideo",
  PIXEL_STREAM: "pixelStream",
  PLAIN: "plain",
  OTHER: "other"
} as const;

export type VideoKindType = (typeof VideoKind)[keyof typeof VideoKind];

export const VIDEO_HOST_SELECTOR = [
  ".ft-video",
  ".ft-open-video",
  ".ft-unreal-engine",
  ".default-uePixelStreaming",
  "[data-pixel-streaming]",
  "[data-stream-host]",
  "video"
].join(", ");

const STREAM_HOST_SELECTOR = ".ft-unreal-engine, .default-uePixelStreaming, [data-pixel-streaming], [data-stream-host]";

/** 是否为 UE / 像素流送 video */
export function isStreamVideoElement(video: HTMLVideoElement | null | undefined): boolean {
  if (!video) {
    return false;
  }
  return !!video.closest(STREAM_HOST_SELECTOR) || video.dataset.pixelStreaming != null || video.dataset.stream != null;
}

export function isStreamVideoHost(host: HTMLElement | null | undefined): boolean {
  if (!host) {
    return false;
  }
  return !!(
    host.querySelector(STREAM_HOST_SELECTOR) ||
    host.matches(".ft-unreal-engine") ||
    host.classList.contains("ft-unreal-engine")
  );
}

export function getVisibleVideos(host: HTMLElement): HTMLVideoElement[] {
  return Array.from(host.querySelectorAll("video")).filter((v) =>
    Utils.isVisible(v as HTMLElement)
  ) as HTMLVideoElement[];
}

export function hostHasVideo(host: HTMLElement | null | undefined): boolean {
  if (!host) {
    return false;
  }
  try {
    if (host.matches(".ft-video, .ft-open-video")) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return !!host.querySelector(".ft-video, .ft-open-video, video");
}

/** 模块是否以 video 为主内容（独立层 / videoStrategy 优先） */
export function isVideoPrimaryHost(host: HTMLElement): boolean {
  if (isStreamVideoHost(host)) {
    return true;
  }
  const videos = getVisibleVideos(host);
  if (!videos.length) {
    return !!host.querySelector(".ft-video, .ft-open-video");
  }
  const hasChart = !!host.querySelector("[_echarts_instance_]");
  const hasSpecial3d = !!host.querySelector(".imagesList3d, .ft-swiperCard, .ft-swiper, .ringIndicator3d, .cube-main");
  if (hasChart || hasSpecial3d) {
    return false;
  }
  return true;
}

export function detectVideoKind(host: HTMLElement): VideoKindType | null {
  if (!hostHasVideo(host)) {
    return null;
  }
  if (host.querySelector(".ft-open-video") || host.matches(".ft-open-video")) {
    return VideoKind.OPEN_VIDEO;
  }
  if (host.querySelector(".ft-video") || host.matches(".ft-video")) {
    return VideoKind.FT_VIDEO;
  }
  if (isStreamVideoHost(host)) {
    return VideoKind.PIXEL_STREAM;
  }
  const videos = getVisibleVideos(host);
  const streamVideos = videos.filter((v) => isStreamVideoElement(v));
  if (streamVideos.length) {
    return VideoKind.PIXEL_STREAM;
  }
  if (videos.length) {
    return VideoKind.PLAIN;
  }
  return VideoKind.OTHER;
}
