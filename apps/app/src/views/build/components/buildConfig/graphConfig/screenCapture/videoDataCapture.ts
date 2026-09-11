/**
 * 统一 video 抓帧（与动态面板 buildRaster 同路径）
 *
 * 优先级（全部数据层，不依赖 live DOM drawImage）：
 * 1. componentList 配置 URL → 离屏抓帧
 * 2. cover 封面图
 * 3. previewImg（host 上可见时）
 */
import { setMinioUrl } from "@/utils/config";
import { getVideoBase64 } from "@/utils/utils";

import { LOG } from "./captureConfig";
import { ComponentTreeCapture, Utils } from "./captureUtils";
import { CorsMediaFallback } from "./corsMediaFallback";
import type { CaptureComponentItem, ComponentList } from "./types/captureInternal";

const DEFAULT_VIDEO_MARKERS = ["defaultimg/video.mp4", "defaultimg/video", "/defaultimg/"];

export const VIDEO_COMPONENT_PROPS = new Set(["swvideo", "sw-video", "ftVideo"]);

export function isVideoComponentItem(item: CaptureComponentItem | null | undefined): boolean {
  const prop = item?.component?.prop;
  return !!prop && VIDEO_COMPONENT_PROPS.has(prop);
}

export function isDefaultDemoVideoUrl(url: string): boolean {
  if (!url) {
    return false;
  }
  const s = String(url).toLowerCase();
  return DEFAULT_VIDEO_MARKERS.some((m) => s.includes(m));
}

export function normalizeVideoMediaUrl(raw: string): string | null {
  if (!raw || String(raw).includes("ws")) {
    return null;
  }
  const s = String(raw);
  if (s.startsWith("blob:") || s.startsWith("data:")) {
    return s;
  }
  return s.includes("http") ? s : setMinioUrl(s);
}

export function resolveConfiguredVideoUrl(item: CaptureComponentItem | null | undefined): string {
  if (!item) {
    return "";
  }
  return (Array.isArray(item.data) && item.data[0] && item.data[0].value) || item.option?.url || item.option?.src || "";
}

export function resolveCoverUrl(item: CaptureComponentItem | null | undefined): string | null {
  if (!item) {
    return null;
  }
  const cover =
    (Array.isArray(item.data) && item.data[0] && item.data[0].cover) ||
    item.option?.cover ||
    item.option?.backgroundImage ||
    "";
  return cover ? normalizeVideoMediaUrl(cover) : null;
}

/** 配置 URL 离屏抓帧（面板核心路径） */
export async function captureFromConfiguredUrl(rawUrl: string, seekTime = 0): Promise<string | null> {
  const url = normalizeVideoMediaUrl(rawUrl);
  if (!url || isDefaultDemoVideoUrl(url)) {
    return null;
  }
  const t = Number(seekTime) || 0;
  if (t <= 0.05) {
    try {
      const base64 = await Promise.race([
        getVideoBase64(url, "png"),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error("timeout")), 15000))
      ]);
      if (base64 && base64 !== "data:,") {
        return base64;
      }
    } catch {
      /* seek below */
    }
  }
  let frame = await CorsMediaFallback.loadVideoFrameAsDataUrl(url, t);
  if (!frame && t > 0.05) {
    frame = await CorsMediaFallback.loadVideoFrameAsDataUrl(url, 0);
  }
  return frame;
}

export async function captureFromComponentItem(
  item: CaptureComponentItem | null | undefined,
  seekTime = 0
): Promise<string | null> {
  const configured = resolveConfiguredVideoUrl(item);
  if (!configured || isDefaultDemoVideoUrl(configured)) {
    return null;
  }
  return captureFromConfiguredUrl(configured, seekTime);
}

export async function captureFromComponentId(
  hostId: string | number | null | undefined,
  componentList: ComponentList | undefined,
  seekTime = 0
): Promise<string | null> {
  if (!hostId || !componentList) {
    return null;
  }
  const item = ComponentTreeCapture.findComponentById(componentList, hostId);
  return captureFromComponentItem(item, seekTime);
}

async function loadCoverDataUrl(item: CaptureComponentItem | null | undefined): Promise<string | null> {
  const coverUrl = resolveCoverUrl(item);
  if (!coverUrl) {
    return null;
  }
  if (coverUrl.startsWith("data:")) {
    return coverUrl;
  }
  return CorsMediaFallback.loadImageAsDataUrl(coverUrl);
}

async function loadPreviewImgDataUrl(host: HTMLElement): Promise<string | null> {
  const preview = host.querySelector(".previewImg[src], .ft-open-video .previewImg[src]");
  if (!(preview instanceof HTMLImageElement) || !Utils.isVisible(preview)) {
    return null;
  }
  const src = preview.currentSrc || preview.src;
  if (!src || isDefaultDemoVideoUrl(src)) {
    return null;
  }
  if (src.startsWith("data:")) {
    return src;
  }
  return CorsMediaFallback.loadImageAsDataUrl(src);
}

export interface VideoCaptureOptions {
  componentId: string | number;
  componentList: ComponentList;
  seekTime?: number;
  /** 组件 host，用于 previewImg */
  host?: HTMLElement | null;
}

/**
 * 全平台统一 video 抓帧入口（面板 / 组 / 普通层级 / overlay 共用）
 */
export async function captureVideoDataUrl(options: VideoCaptureOptions): Promise<string | null> {
  const { componentId, componentList, seekTime = 0, host } = options;
  const id = String(componentId);
  const item = ComponentTreeCapture.findComponentById(componentList, id);

  const fromConfig = await captureFromComponentItem(item, seekTime);
  if (fromConfig) {
    console.info(LOG, "video 数据层抓帧", id);
    return fromConfig;
  }

  const fromCover = await loadCoverDataUrl(item);
  if (fromCover) {
    console.info(LOG, "video cover 抓帧", id);
    return fromCover;
  }

  const searchHost = host || null;
  if (searchHost) {
    const fromPreview = await loadPreviewImgDataUrl(searchHost);
    if (fromPreview) {
      console.info(LOG, "video previewImg 抓帧", id);
      return fromPreview;
    }
  }

  console.warn(LOG, "video 数据层抓帧失败", id);
  return null;
}

/** 从 video 元素解析 hostId（video_${id} 或最近 data-id） */
export function resolveVideoHostId(video: HTMLVideoElement | null | undefined): string | null {
  if (!video) {
    return null;
  }
  if (video.id && String(video.id).startsWith("video_")) {
    return String(video.id).slice(6);
  }
  const host = video.closest("[data-id]");
  return host ? host.getAttribute("data-id") : null;
}

export async function captureVideoFromElement(
  video: HTMLVideoElement,
  componentList: ComponentList
): Promise<string | null> {
  if (!video) {
    return null;
  }
  const hostId = resolveVideoHostId(video);
  if (!hostId) {
    return null;
  }
  const seekTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
  const host = video.closest("[data-id]") as HTMLElement | null;
  return captureVideoDataUrl({
    componentId: hostId,
    componentList,
    seekTime,
    host
  });
}

/** 面板 / 组内子 video：与 buildRaster 同路径 */
export async function captureContainerChildVideo(
  child: CaptureComponentItem,
  componentList: ComponentList,
  host?: HTMLElement | null,
  seekTime = 0
): Promise<string | null> {
  if (child.id == null) {
    return null;
  }
  return captureVideoDataUrl({
    componentId: child.id,
    componentList,
    seekTime,
    host: host || undefined
  });
}

export const VideoDataCapture = {
  isVideoComponentItem,
  isDefaultDemoVideoUrl,
  normalizeVideoMediaUrl,
  resolveConfiguredVideoUrl,
  resolveCoverUrl,
  captureFromConfiguredUrl,
  captureFromComponentItem,
  captureFromComponentId,
  captureVideoDataUrl,
  captureVideoFromElement,
  captureContainerChildVideo,
  resolveVideoHostId
};
