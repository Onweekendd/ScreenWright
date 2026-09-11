/** image 策略：栅格图 / CORS / 快照收集（不含 dom overlay 回退层） */
import { setMinioUrl } from "@/utils/config";

import { CFG } from "../captureConfig";
import { Geometry, Html2CanvasCapture, Utils } from "../captureUtils";
import { Readiness } from "../core/readiness";
import { CorsMediaFallback } from "../corsMediaFallback";
import { canvasCtx, errMsg, type StyleStashItem } from "../dom/captureDomHelpers";
import { FontDomCapture } from "../strategies/fontDomCapture";
import type {
  CaptureLayer,
  DesignSize,
  ModuleDescriptor,
  SnapshotMap,
  SnapshotMarkFn,
  SnapshotPayload
} from "../types/captureInternal";

export const ImageCaptureCore = {
  extractUrlFromBgImage(bgImage: string) {
    if (!bgImage || bgImage === "none") {
      return null;
    }
    const m = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
    return m && m[1] ? m[1] : null;
  },

  load(src: string, timeoutMs = CFG.imageLoadTimeout, useCors = true): Promise<HTMLImageElement | null> {
    const url = src ? setMinioUrl(String(src)) : "";
    if (!url) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
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
  },

  normalizeImgSrc(src: string) {
    if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
      return src || "";
    }
    return setMinioUrl(String(src));
  },

  async loadAsDataUrl(src: string) {
    if (!src || src.startsWith("data:")) {
      return src || null;
    }
    const cors = await CorsMediaFallback.loadImageAsDataUrl(src);
    if (cors) {
      return cors;
    }
    let img = await this.load(src, CFG.imageLoadTimeout, true);
    if (!img) {
      img = await this.load(src, CFG.imageLoadTimeout, false);
    }
    if (!img) {
      return null;
    }
    try {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      canvasCtx(c).drawImage(img, 0, 0);
      return c.toDataURL("image/png");
    } catch {
      return CorsMediaFallback.fetchAsDataUrl(src);
    }
  },

  resolveImgSrc(imgEl: HTMLImageElement) {
    const raw = imgEl.currentSrc || imgEl.getAttribute("src") || imgEl.src || "";
    return this.normalizeImgSrc(raw);
  },

  resolvePatchSrc(payload: SnapshotPayload, imgEl?: HTMLImageElement) {
    if (payload.dataUrl && payload.dataUrl !== "data:,") {
      return payload.dataUrl;
    }
    const fromPayload = payload.url ? this.normalizeImgSrc(String(payload.url)) : "";
    if (fromPayload) {
      return fromPayload;
    }
    if (imgEl) {
      return this.resolveImgSrc(imgEl);
    }
    return "";
  },

  syncImgStylesFromLive(liveEl: HTMLImageElement, targetEl: HTMLImageElement, rect?: DOMRect) {
    const cs = getComputedStyle(liveEl);
    const box = rect || liveEl.getBoundingClientRect();
    targetEl.style.width = cs.width !== "auto" ? cs.width : Math.max(1, Math.round(box.width)) + "px";
    targetEl.style.height = cs.height !== "auto" ? cs.height : Math.max(1, Math.round(box.height)) + "px";
    targetEl.style.objectFit = cs.objectFit || "fill";
    targetEl.style.position = cs.position;
    targetEl.style.top = cs.top;
    targetEl.style.left = cs.left;
    targetEl.style.transform = cs.transform;
    targetEl.style.opacity = cs.opacity === "0" ? "1" : cs.opacity;
    targetEl.style.visibility = "visible";
    targetEl.style.display = cs.display === "none" ? "block" : cs.display;
    targetEl.style.filter = cs.filter;
    targetEl.style.mixBlendMode = cs.mixBlendMode;
  },

  ensureAllImgSrcReady(root: HTMLElement) {
    root.querySelectorAll("img").forEach((node) => {
      if (!(node instanceof HTMLImageElement)) {
        return;
      }
      const src = node.getAttribute("src") || node.src;
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) {
        return;
      }
      const normalized = this.normalizeImgSrc(src);
      if (normalized && node.src !== normalized) {
        node.src = normalized;
      }
      const cs = getComputedStyle(node);
      if (cs.opacity === "0") {
        node.style.opacity = "1";
      }
      if (cs.visibility === "hidden") {
        node.style.visibility = "visible";
      }
    });
  },

  applyLiveImgPatches(root: HTMLElement, snapshots: SnapshotMap) {
    const attr = CFG.captureAttr;
    const stash: StyleStashItem[] = [];

    snapshots.forEach((payload, sid) => {
      if (payload.tag !== "img") {
        return;
      }
      const node = root.querySelector("[" + attr + '="' + sid + '"]');
      if (!(node instanceof HTMLImageElement)) {
        return;
      }
      const patchSrc = this.resolvePatchSrc(payload, node);
      if (!patchSrc) {
        return;
      }
      stash.push({ img: node, src: node.src, crossOrigin: node.crossOrigin });
      node.src = patchSrc;
      this.syncImgStylesFromLive(node, node, payload.rect);
    });

    this.ensureAllImgSrcReady(root);

    return () => {
      stash.forEach(({ img, src, crossOrigin }) => {
        if (!img) {
          return;
        }
        if (src != null) {
          img.src = src;
        }
        if (crossOrigin != null) {
          img.crossOrigin = crossOrigin;
        }
      });
    };
  },

  captureElementToDataUrl(imgEl: HTMLImageElement) {
    if (!imgEl) {
      return null;
    }
    const nw = imgEl.naturalWidth || imgEl.width;
    const nh = imgEl.naturalHeight || imgEl.height;
    if (nw <= 0 || nh <= 0) {
      return null;
    }
    try {
      const c = document.createElement("canvas");
      c.width = nw;
      c.height = nh;
      canvasCtx(c).drawImage(imgEl, 0, 0);
      return c.toDataURL("image/png");
    } catch {
      return null;
    }
  },

  pushLayer(layers: CaptureLayer[], layer: CaptureLayer) {
    if (layer && layer.dataUrl && layer.dataUrl !== "data:,") {
      layers.push(layer);
    }
  },

  hasNonRasterContent(host: HTMLElement) {
    if (
      host.querySelector(
        "video, canvas, [_echarts_instance_], svg, .ft-text, .ft-text-box, .gradient-text, .ft-text-text, .text-font, .ft-subtabs"
      )
    ) {
      return true;
    }
    const textNodes = host.querySelectorAll("span, p, label, h1, h2, h3, h4, h5, h6");
    for (let i = 0; i < textNodes.length; i++) {
      const text = (textNodes[i].textContent || "").trim();
      if (text.length > 0 && text.length < 200 && !text.startsWith("{")) {
        return true;
      }
    }
    if (host.querySelector("ul, ol")) {
      return true;
    }
    return false;
  },

  isImageOnlyModule(module: ModuleDescriptor) {
    if (!CFG.useExtractImageLayers || module.primaryMode === "streamVideo") {
      return false;
    }
    return module.primaryMode === "image";
  },

  detectInHost(host: HTMLElement, box: HTMLElement) {
    if (this.hasNonRasterContent(host) || FontDomCapture.detectInHost(host)) {
      return false;
    }
    if (host.querySelector("img[src], picture img[src]")) {
      return true;
    }
    if (this.extractUrlFromBgImage(getComputedStyle(box).backgroundImage)) {
      return true;
    }
    const nodes = host.querySelectorAll("li, div, span");
    for (let i = 0; i < nodes.length; i++) {
      if (this.extractUrlFromBgImage(getComputedStyle(nodes[i]).backgroundImage)) {
        return true;
      }
    }
    return false;
  },

  shouldSnapshotBgElement(el: HTMLElement) {
    if (!el || !Utils.isVisible(el)) {
      return false;
    }
    if (el.matches(".ft-img .imgBox, .ft-img, .imgBox")) {
      return true;
    }
    if (el.matches("li.flex-li, .ft-subtabs li, .ft-subtabs .flex-li")) {
      return true;
    }
    if (el.matches(".customTableList-scrollbar-box-item")) {
      const rect = el.getBoundingClientRect();
      return rect.height > 0 && rect.height <= 240;
    }
    const rect = el.getBoundingClientRect();
    const childCount = el.children.length;
    if (rect.width > 320 || rect.height > 180) {
      return false;
    }
    if (childCount > 6) {
      return false;
    }
    if (el.matches("li")) {
      return true;
    }
    return childCount === 0;
  },

  async collectBgElementSnapshots(root: HTMLElement, snapshots: SnapshotMap, mark: SnapshotMarkFn) {
    const seen = new Set<Element>();
    const tasks: Promise<void>[] = [];
    root
      .querySelectorAll("li, .ft-subtabs li, .customTableList-scrollbar-box-item, .ft-img .imgBox, .imgBox")
      .forEach((el) => {
        if (!(el instanceof HTMLElement) || seen.has(el) || !this.shouldSnapshotBgElement(el)) {
          return;
        }
        const url = this.extractUrlFromBgImage(getComputedStyle(el).backgroundImage);
        if (!url) {
          return;
        }
        seen.add(el);
        const payload: SnapshotPayload = { url, rect: el.getBoundingClientRect(), tag: "bg", dataUrl: null };
        mark(el, payload);
        tasks.push(
          this.loadAsDataUrl(url).then((dataUrl) => {
            payload.dataUrl = dataUrl;
          })
        );
      });
    await Promise.all(tasks);
  },

  async collectImgSnapshots(root: HTMLElement, snapshots: SnapshotMap, mark: SnapshotMarkFn) {
    await Readiness.waitImagesReady(root, 12000);
    const tasks: Promise<void>[] = [];
    root.querySelectorAll("img").forEach((node) => {
      if (!(node instanceof HTMLImageElement)) {
        return;
      }
      const imgEl = node;
      if (imgEl.hasAttribute(CFG.captureAttr)) {
        return;
      }
      const src = this.resolveImgSrc(imgEl);
      if (!src) {
        return;
      }
      const rect = imgEl.getBoundingClientRect();
      const parentRect = imgEl.parentElement?.getBoundingClientRect();
      const box =
        rect.width > 2 && rect.height > 2
          ? rect
          : parentRect && parentRect.width > 2 && parentRect.height > 2
            ? parentRect
            : rect;
      if (box.width < 2 && box.height < 2) {
        return;
      }
      const payload: SnapshotPayload = {
        url: src,
        rect: box,
        tag: "img",
        dataUrl: null
      };
      mark(imgEl, payload);
      const cached = this.captureElementToDataUrl(imgEl);
      if (cached) {
        payload.dataUrl = cached;
        return;
      }
      tasks.push(
        this.loadAsDataUrl(src).then((dataUrl) => {
          payload.dataUrl = dataUrl;
        })
      );
    });
    await Promise.all(tasks);
  },

  applyBgSnapshotsOnClone(clonedDoc: Document | HTMLElement, snapshots: SnapshotMap) {
    const { queryRoot } = Utils.getClonePatchContext(clonedDoc);
    const attr = CFG.captureAttr;
    snapshots.forEach((payload, sid) => {
      if (payload.tag !== "bg") {
        return;
      }
      const bgSrc =
        payload.dataUrl && payload.dataUrl !== "data:,"
          ? payload.dataUrl
          : payload.url
            ? this.normalizeImgSrc(String(payload.url))
            : "";
      if (!bgSrc) {
        return;
      }
      const node = queryRoot.querySelector("[" + attr + '="' + sid + '"]');
      if (!(node instanceof HTMLElement)) {
        return;
      }
      const size = node.style.backgroundSize || "100% 100%";
      const pos = node.style.backgroundPosition || "50% 50%";
      const repeat = node.style.backgroundRepeat || "no-repeat";
      node.style.removeProperty("background");
      node.style.backgroundImage = 'url("' + bgSrc + '")';
      node.style.backgroundSize = size;
      node.style.backgroundPosition = pos;
      node.style.backgroundRepeat = repeat;
    });
  },

  applyImgSnapshotsOnClone(clonedDoc: Document | HTMLElement, snapshots: SnapshotMap, liveRoot?: HTMLElement) {
    const { queryRoot } = Utils.getClonePatchContext(clonedDoc);
    const attr = CFG.captureAttr;
    snapshots.forEach((payload, sid) => {
      if (payload.tag !== "img") {
        return;
      }
      const node = queryRoot.querySelector("[" + attr + '="' + sid + '"]');
      if (!(node instanceof HTMLImageElement)) {
        return;
      }
      const liveNode = liveRoot?.querySelector("[" + attr + '="' + sid + '"]');
      const patchSrc = this.resolvePatchSrc(payload, liveNode instanceof HTMLImageElement ? liveNode : node);
      if (!patchSrc) {
        return;
      }
      node.src = patchSrc;
      node.removeAttribute("srcset");
      if (liveNode instanceof HTMLImageElement) {
        this.syncImgStylesFromLive(liveNode, node, payload.rect);
      } else if (payload.rect) {
        node.style.width = Math.max(1, Math.round(payload.rect.width)) + "px";
        node.style.height = Math.max(1, Math.round(payload.rect.height)) + "px";
        node.style.objectFit = "fill";
      }
    });
  },

  getModuleIdsFromLayers(layers: CaptureLayer[]) {
    const ids = new Set<string>();
    layers.forEach((layer) => {
      const m = String(layer.id).match(/^(.+?)-(?:img|bg|dom)-/);
      if (m) {
        ids.add(m[1]);
      }
    });
    return ids;
  },

  async buildLayersForDescriptor(
    d: ModuleDescriptor,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    wrapperRect: DOMRect,
    baseZ: number,
    captureHostViaDom: (
      descriptor: ModuleDescriptor,
      viewWrapper: HTMLElement,
      designSize: DesignSize,
      wrapperRect: DOMRect,
      baseZ: number
    ) => Promise<CaptureLayer | null>
  ) {
    const layers: CaptureLayer[] = [];
    const host = d.host;
    const box = d.box;
    let added = 0;

    await Readiness.waitImagesReady(host);

    const imgs = Array.from(host.querySelectorAll("img[src]")).filter(Utils.isVisible);
    for (let i = 0; i < imgs.length; i++) {
      const imgEl = imgs[i] as HTMLImageElement;
      if (!imgEl.complete || imgEl.naturalWidth <= 0) {
        await Readiness.waitImagesReady(host, 8000);
      }
      let dataUrl = this.captureElementToDataUrl(imgEl);
      if (!dataUrl) {
        dataUrl = await this.loadAsDataUrl(this.normalizeImgSrc(imgEl.currentSrc || imgEl.src));
      }
      if (!dataUrl) {
        Utils.log("warn", "纯图图层 img 抓取失败", d.id, imgEl.src);
        continue;
      }
      const ir = imgEl.getBoundingClientRect();
      this.pushLayer(layers, {
        id: d.id + "-img-" + i,
        kind: "image",
        zIndex: baseZ + i * 0.001,
        designRect: Geometry.visualRectToDesignRect(ir, wrapperRect, designSize),
        dataUrl
      });
      added++;
    }

    if (added === 0) {
      const bgEls = Array.from(host.querySelectorAll("li, div, span")).filter((el) => {
        return Utils.isVisible(el) && this.extractUrlFromBgImage(getComputedStyle(el).backgroundImage);
      });
      for (let i = 0; i < bgEls.length; i++) {
        const el = bgEls[i] as HTMLElement;
        const url = this.extractUrlFromBgImage(getComputedStyle(el).backgroundImage);
        const dataUrl = url ? await this.loadAsDataUrl(url) : null;
        if (!dataUrl) {
          continue;
        }
        const er = el.getBoundingClientRect();
        this.pushLayer(layers, {
          id: d.id + "-bg-" + i,
          kind: "image",
          zIndex: baseZ + i * 0.001,
          designRect: Geometry.visualRectToDesignRect(er, wrapperRect, designSize),
          dataUrl
        });
        added++;
      }
    }

    if (added === 0) {
      const bgUrl = this.extractUrlFromBgImage(getComputedStyle(box).backgroundImage);
      if (bgUrl) {
        const dataUrl = await this.loadAsDataUrl(bgUrl);
        if (dataUrl) {
          this.pushLayer(layers, {
            id: d.id + "-bg",
            kind: "image",
            zIndex: baseZ + 0.001,
            designRect: Geometry.visualRectToDesignRect(box.getBoundingClientRect(), wrapperRect, designSize),
            dataUrl
          });
          added++;
        }
      }
    }

    if (added === 0) {
      const domLayer = await captureHostViaDom(d, viewWrapper, designSize, wrapperRect, baseZ);
      if (domLayer) {
        this.pushLayer(layers, domLayer);
      }
    }

    return layers;
  },

  applyCrossOriginOnLive(root: HTMLElement) {
    const stash: StyleStashItem[] = [];
    root.querySelectorAll("img[src]").forEach((img) => {
      if (!(img instanceof HTMLImageElement)) {
        return;
      }
      if (img.complete && img.naturalWidth > 0) {
        return;
      }
      stash.push({ img, crossOrigin: img.crossOrigin, src: img.src });
      if (!img.crossOrigin) {
        img.crossOrigin = "anonymous";
      }
    });
    return () => {
      stash.forEach(({ img, crossOrigin }) => {
        if (img && crossOrigin != null) {
          img.crossOrigin = crossOrigin;
        }
      });
    };
  }
};

export type ImageCaptureCoreType = typeof ImageCaptureCore;

export interface ImageDomOverlayDeps {
  prepareWrapper(viewWrapper: HTMLElement, designSize: DesignSize): () => void;
  buildSnapshots(root: HTMLElement): { snapshots: SnapshotMap; mark: SnapshotMarkFn };
  applyMediaPatchesOnClone(clonedDoc: Document | HTMLElement, snapshots: SnapshotMap, liveRoot?: HTMLElement): void;
  clearMarks(root: HTMLElement): void;
}

/** 绑定 dom overlay 回退层方法，形成完整 ImageCapture */
export function bindImageCaptureDomDeps(core: ImageCaptureCoreType, domOverlay: ImageDomOverlayDeps) {
  const captureHostViaDom = async (
    d: ModuleDescriptor,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    wrapperRect: DOMRect,
    baseZ: number
  ): Promise<CaptureLayer | null> => {
    const box = d.box;
    if (!box || !Utils.isVisible(box)) {
      return null;
    }
    try {
      await Readiness.waitImagesReady(box);
      await Utils.waitFrames(2);
      const rect = box.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      const { snapshots, mark } = domOverlay.buildSnapshots(box);
      await core.collectImgSnapshots(box, snapshots, mark);

      const layerCanvas = await Html2CanvasCapture.toCanvas(box, {
        scale: CFG.layerScale,
        width: w,
        height: h,
        backgroundColor: null,
        onClone: (clonedDoc) => {
          domOverlay.applyMediaPatchesOnClone(clonedDoc, snapshots, box);
        }
      });
      domOverlay.clearMarks(box);

      if (!layerCanvas || Utils.isCanvasMostlyBlank(layerCanvas)) {
        return null;
      }
      const dataUrl = Utils.safeCanvasToDataUrl(layerCanvas, "image/png");
      if (!dataUrl) {
        return null;
      }
      Utils.log("info", "纯图 dom 回退截取成功", d.id);
      return {
        id: d.id + "-dom-0",
        kind: "image" as const,
        zIndex: baseZ,
        designRect: Geometry.visualRectToDesignRect(rect, wrapperRect, designSize),
        dataUrl
      };
    } catch (error) {
      Utils.log("warn", "纯图 dom 回退截取失败", d.id, errMsg(error));
      return null;
    }
  };

  const buildExtractedLayers = async (
    imageDescriptors: ModuleDescriptor[],
    viewWrapper: HTMLElement,
    designSize: DesignSize
  ) => {
    const layers: CaptureLayer[] = [];
    if (!imageDescriptors.length) {
      return layers;
    }

    const restoreWrapper = domOverlay.prepareWrapper(viewWrapper, designSize);
    await Utils.waitFrames(2);
    const wrapperRect = viewWrapper.getBoundingClientRect();

    try {
      for (let i = 0; i < imageDescriptors.length; i++) {
        const d = imageDescriptors[i];
        const baseZ = Number(d.zIndex) || 0;
        const part = await core.buildLayersForDescriptor(
          d,
          viewWrapper,
          designSize,
          wrapperRect,
          baseZ,
          captureHostViaDom
        );
        layers.push(...part);
      }
    } finally {
      restoreWrapper();
    }

    Utils.log(
      "info",
      "纯图图层:",
      layers.length,
      imageDescriptors.map((d) => d.id)
    );
    return layers;
  };

  return {
    ...core,
    captureHostViaDom,
    buildExtractedLayers,
    buildLayersForDescriptor(
      d: ModuleDescriptor,
      viewWrapper: HTMLElement,
      designSize: DesignSize,
      wrapperRect: DOMRect,
      baseZ: number
    ) {
      return core.buildLayersForDescriptor(d, viewWrapper, designSize, wrapperRect, baseZ, captureHostViaDom);
    }
  };
}

export type ImageCapture = ReturnType<typeof bindImageCaptureDomDeps>;
