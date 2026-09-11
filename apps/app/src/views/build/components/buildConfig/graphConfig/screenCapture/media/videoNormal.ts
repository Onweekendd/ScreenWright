import { CFG } from "../captureConfig";
import { Utils } from "../captureUtils";
import { CorsMediaFallback } from "../corsMediaFallback";
import { asDoc, type StyleStashItem } from "../dom/captureDomHelpers";
import type {
  CaptureLayer,
  ComponentList,
  ModuleDescriptor,
  SnapshotMap,
  SnapshotMarkFn
} from "../types/captureInternal";
import { VideoDataCapture } from "../videoDataCapture";
import { UeStreamCapture } from "./ueStreamCapture";

export const VideoNormal = {
  getVideos(root: HTMLElement) {
    return Array.from(root.querySelectorAll("video")).filter(
      (v) => Utils.isVisible(v) && !UeStreamCapture.isStreamVideoElement(v)
    );
  },

  detectInHost(host: HTMLElement) {
    if (host.querySelector(".ft-video, .ft-open-video")) {
      return true;
    }
    return this.getVideos(host).length > 0;
  },

  applyCrossOriginOnLive(root: HTMLElement) {
    const stash: StyleStashItem[] = [];
    this.getVideos(root).forEach((video) => {
      stash.push({ video, crossOrigin: video.crossOrigin });
      if (!video.crossOrigin) {
        video.crossOrigin = "anonymous";
      }
    });
    return () => {
      stash.forEach(({ video, crossOrigin }) => {
        if (video) {
          video.crossOrigin = crossOrigin ?? null;
        }
      });
    };
  },

  _playbackRestoreQueue: [] as Array<{ video: HTMLVideoElement; wasPlaying: boolean; savedTime: number }>,

  snapshotPlaybackState(root: HTMLElement) {
    return this.getVideos(root).map((video) => ({
      video,
      wasPlaying: !video.paused && !video.ended && video.readyState >= 2,
      savedTime: Number.isFinite(video.currentTime) ? video.currentTime : 0
    }));
  },

  queuePlaybackRestore(entries: Array<{ video: HTMLVideoElement; wasPlaying: boolean; savedTime: number }>) {
    if (!entries?.length) {
      return;
    }
    entries.forEach((entry) => {
      if (entry.wasPlaying) {
        this._playbackRestoreQueue.push(entry);
      }
    });
  },

  async restoreAfterCapture() {
    const queue = this._playbackRestoreQueue.splice(0);
    for (const { video, savedTime } of queue) {
      if (!video?.isConnected) {
        continue;
      }
      try {
        if (Math.abs(video.currentTime - savedTime) > 0.05) {
          video.currentTime = savedTime;
        }
        await video.play();
      } catch {
        /* ignore autoplay policy */
      }
    }
  },

  async pauseAllForCapture(root: HTMLElement) {
    const entries = this.snapshotPlaybackState(root);
    this.queuePlaybackRestore(entries);
    let pausedAny = false;
    for (const { video, wasPlaying } of entries) {
      if (wasPlaying) {
        try {
          video.pause();
          pausedAny = true;
        } catch {
          /* ignore */
        }
      }
    }
    if (pausedAny) {
      await Utils.sleep(80);
      await Utils.waitFrames(2);
    }
    return entries;
  },

  async collectSnapshots(
    root: HTMLElement,
    snapshots: SnapshotMap,
    mark: SnapshotMarkFn,
    componentList: ComponentList
  ) {
    await this.pauseAllForCapture(root);
    await Utils.waitFrames(2);

    for (const video of this.getVideos(root)) {
      if (video.hasAttribute(CFG.captureAttr)) {
        continue;
      }
      const dataUrl = await VideoDataCapture.captureVideoFromElement(video, componentList);
      if (dataUrl) {
        mark(video, { dataUrl, rect: video.getBoundingClientRect(), tag: "video" });
      } else {
        Utils.log("warn", "video 抓帧失败，overlay 将保留原 video", video.id || video.src?.slice(0, 48));
      }
    }

    for (const img of Array.from(
      root.querySelectorAll(".ft-video .previewImg[src], .ft-open-video .previewImg[src]")
    )) {
      if (!(img instanceof HTMLImageElement) || img.hasAttribute(CFG.captureAttr) || !Utils.isVisible(img)) {
        continue;
      }
      const src = img.currentSrc || img.src;
      if (!src) {
        continue;
      }
      const dataUrl = src.startsWith("data:") ? src : await CorsMediaFallback.loadImageAsDataUrl(src);
      if (dataUrl) {
        mark(img, { dataUrl, rect: img.getBoundingClientRect(), tag: "video-poster" });
      }
    }
  },

  applySnapshotsOnClone(clonedDoc: Document | HTMLElement, snapshots: SnapshotMap) {
    const { ownerDoc, queryRoot } = Utils.getClonePatchContext(clonedDoc);
    const attr = CFG.captureAttr;
    snapshots.forEach((payload, sid) => {
      if ((payload.tag !== "video" && payload.tag !== "video-poster") || !payload.dataUrl) {
        return;
      }
      const node = queryRoot.querySelector("[" + attr + '="' + sid + '"]');
      if (!node) {
        return;
      }
      const rect = payload.rect || node.getBoundingClientRect();
      const img = ownerDoc.createElement("img");
      img.src = payload.dataUrl;
      img.style.width = Math.max(1, Math.round(rect.width)) + "px";
      img.style.height = Math.max(1, Math.round(rect.height)) + "px";
      img.style.objectFit = "cover";
      img.style.display = "block";
      if (node.parentNode) {
        node.parentNode.replaceChild(img, node);
      }
    });
  },

  applyLiveFramePatches(root: HTMLElement, snapshots: SnapshotMap) {
    const attr = CFG.captureAttr;
    const stash: StyleStashItem[] = [];

    snapshots.forEach((payload, sid) => {
      if ((payload.tag !== "video" && payload.tag !== "video-poster") || !payload.dataUrl) {
        return;
      }
      const node = root.querySelector("[" + attr + '="' + sid + '"]');
      if (!node?.parentNode) {
        return;
      }
      const rect = payload.rect || node.getBoundingClientRect();
      const img = document.createElement("img");
      img.src = payload.dataUrl;
      img.style.width = Math.max(1, Math.round(rect.width)) + "px";
      img.style.height = Math.max(1, Math.round(rect.height)) + "px";
      img.style.objectFit = "cover";
      img.style.display = "block";
      stash.push({ parent: node.parentNode, node, replacement: img });
      node.parentNode.replaceChild(img, node);
    });

    return () => {
      stash.forEach((item) => {
        if (item.video) {
          item.video.style.visibility = item.visibility ?? "";
          item.video.style.opacity = item.opacity ?? "";
          item.video.style.display = item.display ?? "";
          return;
        }
        if (item.parent && item.replacement && item.node) {
          try {
            if (item.replacement.parentNode === item.parent) {
              item.parent.replaceChild(item.node, item.replacement);
            }
          } catch {
            /* ignore restore error */
          }
        }
      });
    };
  },

  async buildLayer(descriptor: ModuleDescriptor, _designSize: unknown, componentList: ComponentList) {
    const videos = this.getVideos(descriptor.host);
    const seekTime = videos[0] && Number.isFinite(videos[0].currentTime) ? videos[0].currentTime : 0;
    const dataUrl = await VideoDataCapture.captureVideoDataUrl({
      componentId: descriptor.id,
      componentList,
      seekTime,
      host: descriptor.host
    });
    if (!dataUrl) {
      Utils.log("warn", "video 独立层抓帧失败", descriptor.id);
      return null;
    }
    Utils.log("info", "video 独立层", descriptor.id);
    return {
      id: descriptor.id,
      kind: "dom",
      zIndex: descriptor.zIndex,
      designRect: descriptor.designRect,
      dataUrl
    } as CaptureLayer;
  },

  async waitReady(root: HTMLElement) {
    const deadline = Date.now() + CFG.contentWaitMax;
    while (Date.now() < deadline) {
      const videos = this.getVideos(root);
      if (!videos.length) {
        return;
      }
      const ready = videos.some(
        (v) => v.videoWidth > 0 && v.videoHeight > 0 && v.readyState >= 2 && !UeStreamCapture.isVideoFrameBlank(v)
      );
      if (ready) {
        await Utils.sleep(400);
        return;
      }
      await Utils.sleep(CFG.poll);
    }
  },

  async ensurePlaying(root: HTMLElement) {
    for (const video of this.getVideos(root)) {
      try {
        if (video.paused) {
          await video.play();
        }
      } catch {
        /* ignore */
      }
    }
  },

  hideForLiveCapture(root: HTMLElement) {
    const stash: StyleStashItem[] = [];
    this.getVideos(root).forEach((video) => {
      stash.push({
        video,
        visibility: video.style.visibility,
        opacity: video.style.opacity,
        display: video.style.display
      });
      video.style.visibility = "hidden";
      video.style.opacity = "0";
      video.style.display = "none";
    });
    return () => {
      stash.forEach(({ video, visibility, opacity, display }) => {
        if (!video) {
          return;
        }
        video.style.visibility = visibility ?? "";
        video.style.opacity = opacity ?? "";
        video.style.display = display ?? "";
      });
    };
  },

  hideInClone(clonedDoc: Document | HTMLElement) {
    asDoc(clonedDoc)
      .querySelectorAll("video")
      .forEach((v) => {
        if (UeStreamCapture.isStreamVideoElement(v)) {
          return;
        }
        v.style.visibility = "hidden";
        v.style.opacity = "0";
        v.style.display = "none";
      });
  }
};
