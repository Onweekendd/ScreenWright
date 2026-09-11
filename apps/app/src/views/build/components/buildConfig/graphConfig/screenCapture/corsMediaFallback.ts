/**
 * 跨域污染（tainted canvas）兼容层
 * 优先级：已有 data/blob → fetch 转 blob/dataURL → crossOrigin 离屏加载 → 原 URL 兜底
 */
import { setMinioUrl } from "@/utils/config";
import { getVideoBase64 } from "@/utils/utils";

import { CFG, LOG } from "./captureConfig";
import { isStreamVideoElement } from "./strategies/videoRegistry";
import type { CaptureMimeType } from "./types/captureInternal";

function isVisibleVideo(el: Element): el is HTMLVideoElement {
  if (!(el instanceof HTMLVideoElement)) {
    return false;
  }
  const s = getComputedStyle(el);
  if (s.display === "none" || s.visibility === "hidden") {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

const errMsg = (error: unknown): string => (error instanceof Error ? error.message : String(error));

function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(typeof result === "string" && result !== "data:," ? result : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

function normalizeHttpUrl(raw: string): string {
  if (!raw) {
    return "";
  }
  if (raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return setMinioUrl(String(raw));
}

function isInlineUrl(url: string) {
  return url.startsWith("data:") || url.startsWith("blob:");
}

export const CorsMediaFallback = {
  /** fetch → blob → dataURL（绕过 canvas 污染，需服务端 CORS 或同源） */
  async fetchAsDataUrl(rawUrl: string, timeoutMs = CFG.imageLoadTimeout): Promise<string | null> {
    const blob = await this.fetchAsBlob(rawUrl, timeoutMs);
    return blob ? blobToDataUrl(blob) : null;
  },

  async fetchAsBlob(rawUrl: string, timeoutMs = CFG.imageLoadTimeout): Promise<Blob | null> {
    const url = normalizeHttpUrl(rawUrl);
    if (!url || url.startsWith("data:")) {
      return null;
    }

    if (url.startsWith("blob:")) {
      try {
        const res = await fetch(url);
        return res.ok ? res.blob() : null;
      } catch {
        return null;
      }
    }

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    const tryFetch = async (mode: RequestMode, credentials: RequestCredentials) => {
      const res = await fetch(url, {
        mode,
        credentials,
        signal: controller?.signal
      });
      return res.ok ? res.blob() : null;
    };

    try {
      let blob = await tryFetch("cors", "omit");
      if (!blob) {
        blob = await tryFetch("cors", "include");
      }
      if (!blob) {
        blob = await tryFetch("same-origin", "include");
      }
      if (!blob) {
        console.warn(LOG, "fetch 视频 blob 失败:", url.slice(0, 96));
      }
      return blob;
    } catch {
      return null;
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  },

  /** 图片：fetch → CORS Image → 非 CORS Image（仅同源） */
  async loadImageAsDataUrl(rawUrl: string): Promise<string | null> {
    const url = normalizeHttpUrl(rawUrl);
    if (!url) {
      return null;
    }
    if (url.startsWith("data:")) {
      return url;
    }

    const fromFetch = await this.fetchAsDataUrl(url);
    if (fromFetch) {
      return fromFetch;
    }

    const drawImageToDataUrl = (img: HTMLImageElement): string | null => {
      try {
        const c = document.createElement("canvas");
        c.width = Math.max(1, img.naturalWidth || img.width);
        c.height = Math.max(1, img.naturalHeight || img.height);
        const ctx = c.getContext("2d");
        if (!ctx) {
          return null;
        }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL("image/png");
        return dataUrl && dataUrl !== "data:," ? dataUrl : null;
      } catch {
        return null;
      }
    };

    const loadImg = (useCors: boolean) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const timer = setTimeout(() => resolve(null), CFG.imageLoadTimeout);
        const img = new Image();
        if (useCors) {
          img.crossOrigin = "anonymous";
        }
        img.onload = () => {
          clearTimeout(timer);
          resolve(img);
        };
        img.onerror = () => {
          clearTimeout(timer);
          resolve(null);
        };
        img.src = url;
      });

    for (const useCors of [true, false]) {
      const img = await loadImg(useCors);
      if (!img) {
        continue;
      }
      const dataUrl = drawImageToDataUrl(img);
      if (dataUrl) {
        return dataUrl;
      }
    }
    return null;
  },

  /**
   * 从页面上已在播放的 video 抓帧（最可靠：fetch 其 currentSrc → blob URL，与浏览器播放同源资源）
   */
  async captureFrameFromVideoElement(video: HTMLVideoElement): Promise<string | null> {
    if (!video) {
      return null;
    }
    const rawSrc = video.currentSrc || video.src || video.querySelector("source[src]")?.getAttribute("src") || "";
    if (!rawSrc) {
      return null;
    }
    const seekTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;

    if (rawSrc.startsWith("data:")) {
      return rawSrc;
    }

    if (rawSrc.startsWith("blob:")) {
      return this.loadVideoFrameAsDataUrl(rawSrc, seekTime);
    }

    const url = normalizeHttpUrl(rawSrc);
    if (!url) {
      return null;
    }

    console.info(LOG, "video fetch 当前播放地址", url.slice(0, 96));

    const blob = await this.fetchAsBlob(url);
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const frame = await this._captureOffscreenVideo(blobUrl, seekTime);
      URL.revokeObjectURL(blobUrl);
      if (frame) {
        return frame;
      }
    }

    return this.loadVideoFrameAsDataUrl(url, seekTime);
  },

  _captureOffscreenVideo(videoUrl: string, seekTime = 0): Promise<string | null> {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      if (!videoUrl.startsWith("blob:")) {
        video.crossOrigin = "anonymous";
      }

      let settled = false;
      const finish = (result: string | null) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        try {
          video.pause();
          video.removeAttribute("src");
          video.load();
        } catch {
          /* ignore */
        }
        resolve(result);
      };

      const timer = setTimeout(() => finish(null), 20000);

      const drawFrame = () => {
        try {
          const w = Math.max(1, video.videoWidth || 640);
          const h = Math.max(1, video.videoHeight || 360);
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          c.getContext("2d")?.drawImage(video, 0, 0, w, h);
          const dataUrl = c.toDataURL("image/png");
          finish(dataUrl && dataUrl !== "data:," ? dataUrl : null);
        } catch (error) {
          console.warn(LOG, "离屏 video drawImage 失败:", errMsg(error));
          finish(null);
        }
      };

      video.onerror = () => {
        console.warn(LOG, "离屏 video 加载失败:", videoUrl.slice(0, 96));
        finish(null);
      };
      video.onloadeddata = () => {
        const sec = Number(seekTime);
        if (sec > 0.05 && video.duration && isFinite(video.duration) && sec < video.duration - 0.05) {
          let seekDone = false;
          const onSeeked = () => {
            if (seekDone) {
              return;
            }
            seekDone = true;
            video.removeEventListener("seeked", onSeeked);
            drawFrame();
          };
          video.addEventListener("seeked", onSeeked);
          try {
            video.currentTime = sec;
          } catch {
            onSeeked();
            return;
          }
          setTimeout(() => {
            if (!seekDone) {
              onSeeked();
            }
          }, 2000);
        } else {
          drawFrame();
        }
      };
      video.src = videoUrl;
      video.load();
    });
  },

  async loadVideoFrameAsDataUrl(rawUrl: string, seekTime = 0): Promise<string | null> {
    const url = normalizeHttpUrl(rawUrl);
    if (!url || url.includes("ws")) {
      return null;
    }
    if (url.startsWith("data:")) {
      return url;
    }

    const trySeek = async (t: number) => {
      let frame = await this._captureOffscreenVideo(url, t);
      if (frame) {
        return frame;
      }
      try {
        const base64 = await Promise.race([
          getVideoBase64(url, "png"),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error("timeout")), 15000))
        ]);
        if (base64 && base64 !== "data:,") {
          return base64;
        }
      } catch {
        /* fetch blob below */
      }
      const blob = await this.fetchAsBlob(url);
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        frame = await this._captureOffscreenVideo(blobUrl, t);
        URL.revokeObjectURL(blobUrl);
        if (frame) {
          return frame;
        }
      }
      return null;
    };

    const t = Number(seekTime) || 0;
    let frame = await trySeek(t);
    if (!frame && t > 0.05) {
      frame = await trySeek(0);
    }
    if (!frame) {
      console.warn(LOG, "video 全部抓帧路径失败:", url.slice(0, 96));
    }
    return frame;
  },

  /** overlay 前：抓帧成功的 video 替换为 img，失败的保持可见 */
  async applyLiveVideoSanitize(
    root: HTMLElement,
    captureFrame?: (video: HTMLVideoElement) => Promise<string | null>
  ): Promise<() => void> {
    const stash: Array<{ parent: Node; video: HTMLVideoElement; img: HTMLImageElement }> = [];
    const videos = Array.from(root.querySelectorAll("video")).filter(isVisibleVideo);

    for (const video of videos) {
      if (isStreamVideoElement(video)) {
        continue;
      }
      const frame = captureFrame ? await captureFrame(video) : await this.captureFrameFromVideoElement(video);
      if (!frame || !video.parentNode) {
        continue;
      }
      const rect = video.getBoundingClientRect();
      const img = document.createElement("img");
      img.src = frame;
      img.style.width = Math.max(1, Math.round(rect.width)) + "px";
      img.style.height = Math.max(1, Math.round(rect.height)) + "px";
      img.style.objectFit = getComputedStyle(video).objectFit || "fill";
      img.style.display = "block";
      const parent = video.parentNode;
      parent.replaceChild(img, video);
      stash.push({ parent, video, img });
    }

    return () => {
      stash.forEach(({ parent, video, img }) => {
        try {
          if (img.parentNode === parent) {
            parent.replaceChild(video, img);
          }
        } catch {
          /* ignore */
        }
      });
    };
  },

  /** canvas 导出：toDataURL 失败时无法从污染 canvas 恢复，仅记录并返回 null */
  safeCanvasToDataUrl(canvas: HTMLCanvasElement | null | undefined, mimeType?: CaptureMimeType): string | null {
    if (!canvas) {
      return null;
    }
    try {
      const dataUrl = canvas.toDataURL(mimeType || "image/png");
      return dataUrl && dataUrl !== "data:," ? dataUrl : null;
    } catch (error) {
      console.warn(LOG, "canvas.toDataURL 失败（跨域污染）:", errMsg(error));
      return null;
    }
  },

  /**
   * overlay 前把 img[src] 尽量换成 dataURL，避免 html2canvas 合成后整层污染
   * 返回 restore
   */
  async applyLiveImgSanitize(root: HTMLElement): Promise<() => void> {
    const stash: Array<{ img: HTMLImageElement; src: string; srcset: string; crossOrigin: string | null }> = [];
    const imgs = Array.from(root.querySelectorAll("img[src]")).filter(
      (n) => n instanceof HTMLImageElement && n.src && !n.src.startsWith("data:")
    ) as HTMLImageElement[];

    await Promise.all(
      imgs.map(async (img) => {
        const raw = img.currentSrc || img.getAttribute("src") || img.src;
        if (!raw || isInlineUrl(raw)) {
          return;
        }
        const dataUrl = await this.loadImageAsDataUrl(raw);
        if (!dataUrl || !dataUrl.startsWith("data:")) {
          return;
        }
        stash.push({
          img,
          src: img.src,
          srcset: img.srcset,
          crossOrigin: img.crossOrigin
        });
        img.srcset = "";
        img.crossOrigin = "anonymous";
        img.src = dataUrl;
      })
    );

    return () => {
      stash.forEach(({ img, src, srcset, crossOrigin }) => {
        img.src = src;
        img.srcset = srcset;
        img.crossOrigin = crossOrigin;
      });
    };
  }
};
