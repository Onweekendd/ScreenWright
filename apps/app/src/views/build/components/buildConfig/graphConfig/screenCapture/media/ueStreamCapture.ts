import { CFG } from "../captureConfig";
import { Geometry, Utils } from "../captureUtils";
import { canvasCtx, castHtml, castVideo, type StyleStashItem } from "../dom/captureDomHelpers";
import type { DesignRect, DesignSize, ModuleDescriptor } from "../types/captureInternal";

export const UeStreamCapture = {
  isStreamVideoElement(video: HTMLVideoElement) {
    if (!video) {
      return false;
    }
    return (
      !!video.closest(".ft-unreal-engine, .default-uePixelStreaming, [data-pixel-streaming], [data-stream-host]") ||
      video.dataset.pixelStreaming != null ||
      video.dataset.stream != null
    );
  },

  getStreamVideos(root: HTMLElement): HTMLVideoElement[] {
    return Array.from(root.querySelectorAll("video")).filter(
      (v) => Utils.isVisible(v) && this.isStreamVideoElement(castVideo(v))
    );
  },

  getVideos(root: HTMLElement): HTMLVideoElement[] {
    const scoped = this.getStreamVideos(root);
    if (scoped.length) {
      return scoped;
    }
    const legacy = Array.from(root.querySelectorAll(".ft-unreal-engine video, .default-uePixelStreaming video"))
      .filter((v) => Utils.isVisible(v))
      .map((v) => castVideo(v));
    return legacy.length ? legacy : this.getStreamVideos(root);
  },

  isHost(host: HTMLElement) {
    return (
      !!host.querySelector(".ft-unreal-engine, .default-uePixelStreaming") ||
      (host.classList && host.classList.contains("ft-unreal-engine"))
    );
  },

  isVideoFrameBlank(video: HTMLVideoElement) {
    try {
      const c = document.createElement("canvas");
      c.width = 48;
      c.height = 48;
      const ctx = c.getContext("2d");
      if (!ctx) {
        return true;
      }
      ctx.drawImage(video, 0, 0, 48, 48);
      const px = ctx.getImageData(0, 0, 48, 48).data;
      let bright = 0;
      for (let i = 0; i < px.length; i += 4) {
        bright += px[i] + px[i + 1] + px[i + 2];
      }
      return bright < 200;
    } catch {
      return false;
    }
  },

  isReady(root: HTMLElement) {
    const videos = this.getVideos(root);
    if (!videos.length) {
      return true;
    }
    return videos.some((v) => v.videoWidth > 0 && v.videoHeight > 0 && v.readyState >= 2 && !this.isVideoFrameBlank(v));
  },

  captureVideoDataUrl(video: HTMLVideoElement) {
    if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
      return null;
    }
    try {
      const c = document.createElement("canvas");
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      canvasCtx(c).drawImage(video, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL("image/png");
      return dataUrl && dataUrl !== "data:," ? dataUrl : null;
    } catch {
      Utils.log("warn", "UE 预抓失败");
      return null;
    }
  },

  isNearFullScreen(designRect: DesignRect, designSize: DesignSize) {
    const area = designRect.width * designRect.height;
    const total = designSize.width * designSize.height;
    return total > 0 && area / total >= 0.72;
  },

  buildLayer(descriptor: ModuleDescriptor, designSize: DesignSize) {
    const videos = this.getVideos(descriptor.host);
    const video = videos[0];
    if (!video) {
      return null;
    }
    const dataUrl = this.captureVideoDataUrl(video);
    if (!dataUrl) {
      return null;
    }
    let designRect = descriptor.designRect;
    if (CFG.ueFullScreen || this.isNearFullScreen(designRect, designSize)) {
      designRect = Geometry.getFullScreenDesignRect(designSize);
    }
    return {
      id: descriptor.id,
      kind: "ue",
      zIndex: descriptor.zIndex,
      designRect,
      dataUrl
    };
  },

  hideForLiveCapture(root: HTMLElement) {
    const stash: StyleStashItem[] = [];
    root.querySelectorAll(".ft-unreal-engine, .default-uePixelStreaming").forEach((raw) => {
      const el = castHtml(raw);
      stash.push({ el, visibility: el.style.visibility, display: el.style.display });
      el.style.visibility = "hidden";
      el.style.display = "none";
    });
    return () => {
      stash.forEach(({ el, visibility, display }) => {
        if (!el) {
          return;
        }
        if (visibility != null) {
          el.style.visibility = visibility;
        }
        if (display != null) {
          el.style.display = display;
        }
      });
    };
  },

  hideInClone(clonedDoc: Document) {
    clonedDoc.querySelectorAll(".ft-unreal-engine, .default-uePixelStreaming").forEach((raw) => {
      const el = castHtml(raw);
      el.style.visibility = "hidden";
      el.style.display = "none";
    });
  }
};
