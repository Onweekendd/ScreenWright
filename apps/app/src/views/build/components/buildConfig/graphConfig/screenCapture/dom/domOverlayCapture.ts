/** domOverlay 策略：snapdom + html2canvas + afterClone 管线 */
import type { SingleComponentCapture } from "../capture/singleComponentCapture";
import { CFG } from "../captureConfig";
import {
  ComponentTreeCapture,
  EditorChrome,
  Geometry,
  Html2CanvasCapture,
  SnapdomCapture,
  Utils
} from "../captureUtils";
import { BiCaptureEntry } from "../core/biCaptureEntry";
import { Readiness } from "../core/readiness";
import { errMsg, type StyleStashItem } from "../dom/captureDomHelpers";
import { runDomCaptureSanitizePipeline } from "../dom/domCaptureSanitize";
import type { ImageCaptureCoreType } from "../media/imageCapture";
import { UeStreamCapture } from "../media/ueStreamCapture";
import { VideoNormal } from "../media/videoNormal";
import { FontDomCapture, hostHasSpecialMarker, SpecialComponentStrategy } from "../strategies";
import { Transform3DCapture } from "../transform3dCapture";
import type { CaptureScope } from "../types";
import type {
  CaptureLayer,
  CaptureMimeType,
  ComponentList,
  DesignSize,
  ModuleDescriptor,
  SnapshotMap,
  SnapshotMarkFn,
  SnapshotPayload
} from "../types/captureInternal";

export interface PanelCaptureCloneDeps {
  hideForLiveCapture(root: HTMLElement): () => void;
  hideInClone(clonedDoc: Document): void;
}

export interface DomOverlayCaptureDeps {
  imageCapture: ImageCaptureCoreType;
  singleComponentCapture: SingleComponentCapture;
  getPanelCapture?: () => PanelCaptureCloneDeps | null;
}

export function createDomOverlayCapture(deps: DomOverlayCaptureDeps) {
  const { imageCapture, singleComponentCapture, getPanelCapture } = deps;

  return {
    isCaptureUiHost: (host: HTMLElement) => host.closest(".screen-capture-container, .capture-btn") != null,

    prepareWrapper(viewWrapper: HTMLElement, designSize: DesignSize) {
      const stash: Record<string, string> = {
        transform: viewWrapper.style.transform,
        transformOrigin: viewWrapper.style.transformOrigin,
        width: viewWrapper.style.width,
        height: viewWrapper.style.height,
        marginLeft: viewWrapper.style.marginLeft,
        marginTop: viewWrapper.style.marginTop,
        left: viewWrapper.style.left,
        top: viewWrapper.style.top
      };
      viewWrapper.style.transform = "none";
      viewWrapper.style.transformOrigin = "left top";
      viewWrapper.style.width = designSize.width + "px";
      viewWrapper.style.height = designSize.height + "px";
      viewWrapper.style.marginLeft = "0";
      viewWrapper.style.marginTop = "0";
      viewWrapper.style.left = "0";
      viewWrapper.style.top = "0";
      return () => {
        viewWrapper.style.transform = stash.transform;
        viewWrapper.style.transformOrigin = stash.transformOrigin;
        viewWrapper.style.width = stash.width;
        viewWrapper.style.height = stash.height;
        viewWrapper.style.marginLeft = stash.marginLeft;
        viewWrapper.style.marginTop = stash.marginTop;
        viewWrapper.style.left = stash.left;
        viewWrapper.style.top = stash.top;
      };
    },

    buildSnapshots(root: HTMLElement) {
      const snapshots = new Map<string, SnapshotPayload>();
      let seq = 0;
      const attr = CFG.captureAttr;
      const mark: SnapshotMarkFn = (el, payload) => {
        const id = String(seq++);
        el.setAttribute(attr, id);
        snapshots.set(id, payload);
      };

      singleComponentCapture.collectChartAndCanvasSnapshots(root, snapshots, mark);
      return { snapshots, mark };
    },

    async buildSnapshotsAsync(root: HTMLElement, componentList: ComponentList) {
      const { snapshots, mark } = this.buildSnapshots(root);
      await VideoNormal.collectSnapshots(root, snapshots, mark, componentList);
      await imageCapture.collectBgElementSnapshots(root, snapshots, mark);
      await imageCapture.collectImgSnapshots(root, snapshots, mark);
      return snapshots;
    },

    clearMarks(root: HTMLElement) {
      root.querySelectorAll("[" + CFG.captureAttr + "]").forEach((el) => {
        el.removeAttribute(CFG.captureAttr);
      });
    },

    applyMediaPatchesOnClone(clonedDoc: Document | HTMLElement, snapshots: SnapshotMap, liveRoot?: HTMLElement) {
      singleComponentCapture.applyMediaPatchesOnClone(clonedDoc, snapshots, liveRoot);
    },

    applyLiveMediaPatches(root: HTMLElement, snapshots: SnapshotMap) {
      const restoreVideo = VideoNormal.applyLiveFramePatches(root, snapshots);
      const restoreImg = imageCapture.applyLiveImgPatches(root, snapshots);
      return () => {
        restoreImg();
        restoreVideo();
      };
    },

    getDomSanitizeDeps() {
      return {
        buildSnapshotsAsync: this.buildSnapshotsAsync.bind(this),
        applyLiveMediaPatches: this.applyLiveMediaPatches.bind(this)
      };
    },

    hideHostsInClone(clonedDoc: Document, hostIds: Iterable<string>) {
      Array.from(hostIds).forEach((did) => {
        const nodes = clonedDoc.querySelectorAll('[data-id="' + Utils.escapeDataId(did) + '"]');
        nodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) {
            return;
          }
          node.style.setProperty("visibility", "hidden", "important");
          node.style.setProperty("display", "none", "important");
          node.style.setProperty("opacity", "0", "important");
          node.querySelectorAll("*").forEach((child) => {
            if (child instanceof HTMLElement) {
              child.style.setProperty("visibility", "hidden", "important");
              child.style.setProperty("display", "none", "important");
              child.style.setProperty("opacity", "0", "important");
            }
          });
        });
      });
    },

    hideHostsOnLive(root: HTMLElement, hostIds: Set<string> | string[]) {
      const ids = Array.from(hostIds || []);
      if (!ids.length) {
        return () => {};
      }
      const stash: StyleStashItem[] = [];
      ids.forEach((did) => {
        root.querySelectorAll('[data-id="' + Utils.escapeDataId(did) + '"]').forEach((node) => {
          if (!(node instanceof HTMLElement)) {
            return;
          }
          stash.push({
            el: node,
            visibility: node.style.visibility,
            display: node.style.display,
            opacity: node.style.opacity
          });
          node.style.setProperty("visibility", "hidden", "important");
          node.style.setProperty("display", "none", "important");
          node.style.setProperty("opacity", "0", "important");
        });
      });
      return () => {
        stash.forEach(({ el, visibility, display, opacity }) => {
          if (!el) {
            return;
          }
          if (visibility != null) {
            el.style.visibility = visibility;
          }
          if (display != null) {
            el.style.display = display;
          }
          if (opacity != null) {
            el.style.opacity = opacity;
          }
          el.style.removeProperty("visibility");
          el.style.removeProperty("display");
          el.style.removeProperty("opacity");
        });
      };
    },

    buildOverlayOnclone(
      snapshots: SnapshotMap,
      designSize: DesignSize,
      excludeHostIds: Set<string> | string[],
      liveViewWrapper: HTMLElement
    ) {
      return (clonedDoc: Document) => {
        const clonedWrapper = BiCaptureEntry.findScaledWrapperInClone(clonedDoc, liveViewWrapper);
        if (clonedWrapper) {
          BiCaptureEntry.patchScaledWrapperInClone(clonedWrapper, designSize);
        }
        UeStreamCapture.hideInClone(clonedDoc);
        EditorChrome.hideInClone(clonedDoc);
        if (excludeHostIds && Array.from(excludeHostIds).length) {
          this.hideHostsInClone(clonedDoc, excludeHostIds);
        }
        this.applyMediaPatchesOnClone(clonedDoc, snapshots, liveViewWrapper);
        FontDomCapture.flattenInClone(clonedDoc, liveViewWrapper);
      };
    },

    async captureOverlay(
      viewWrapper: HTMLElement,
      designSize: DesignSize,
      zIndex: number,
      excludeHostIds: Set<string> | string[],
      componentList: ComponentList
    ): Promise<CaptureLayer | null> {
      const editor = viewWrapper.querySelector(".es-editor") || viewWrapper;
      const restoreWrapper = this.prepareWrapper(viewWrapper, designSize);
      const restoreUe = UeStreamCapture.hideForLiveCapture(viewWrapper);
      const restoreCors = imageCapture.applyCrossOriginOnLive(viewWrapper);
      const restoreVideoCors = VideoNormal.applyCrossOriginOnLive(viewWrapper);
      await Readiness.waitImagesReady(viewWrapper);
      await Utils.waitFrames(2);

      let snapshots: SnapshotMap = new Map();
      let restoreSanitize = () => {};
      let restoreHiddenHosts = () => {};
      try {
        const sanitizeSession = await runDomCaptureSanitizePipeline({
          root: viewWrapper,
          componentList,
          deps: this.getDomSanitizeDeps()
        });
        snapshots = sanitizeSession.snapshots;
        restoreSanitize = sanitizeSession.restore;
        restoreHiddenHosts = this.hideHostsOnLive(editor as HTMLElement, excludeHostIds || []);
        await Utils.waitFrames(2);
        const layerCanvas = await Html2CanvasCapture.toCanvas(editor as HTMLElement, {
          scale: CFG.layerScale,
          width: designSize.width,
          height: designSize.height,
          backgroundColor: null,
          onClone: this.buildOverlayOnclone(snapshots, designSize, excludeHostIds || [], viewWrapper)
        });

        if (!layerCanvas || Utils.isCanvasMostlyBlank(layerCanvas)) {
          Utils.log("warn", "UI 整层几乎透明，请检查 scale / 跨域图");
          return null;
        }

        const dataUrl = Utils.safeCanvasToDataUrl(layerCanvas, "image/png");
        if (!dataUrl) {
          return null;
        }

        return {
          id: "__ui_overlay__",
          kind: "ui",
          zIndex,
          designRect: Geometry.getFullScreenDesignRect(designSize),
          dataUrl
        };
      } catch (error) {
        Utils.log("warn", "captureOverlay 失败:", errMsg(error));
        return null;
      } finally {
        restoreHiddenHosts();
        restoreSanitize();
        this.clearMarks(viewWrapper);
        restoreVideoCors();
        restoreCors();
        restoreUe();
        restoreWrapper();
      }
    },

    async capturePerComponent(
      descriptor: ModuleDescriptor,
      viewWrapper: HTMLElement,
      designSize: DesignSize,
      componentList: ComponentList
    ): Promise<CaptureLayer | null> {
      const box = descriptor.box;
      if (!Utils.isVisible(box)) {
        return null;
      }

      if (hostHasSpecialMarker(descriptor.host) && SpecialComponentStrategy) {
        const layers = await SpecialComponentStrategy.buildLayers([descriptor], viewWrapper, designSize, componentList);
        if (layers[0]) {
          return layers[0];
        }
        Utils.log("warn", "特殊组件栅格失败，回退 html2canvas", descriptor.id);
      }

      const restoreWrapper = this.prepareWrapper(viewWrapper, designSize);
      const restoreVideoCors = VideoNormal.applyCrossOriginOnLive(box);
      await Readiness.waitImagesReady(box);
      await Utils.waitFrames(2);

      let snapshots: SnapshotMap = new Map();
      let restoreSanitize = () => {};
      let restore3d = () => {};
      try {
        const sanitizeSession = await runDomCaptureSanitizePipeline({
          root: box,
          componentList,
          deps: this.getDomSanitizeDeps()
        });
        snapshots = sanitizeSession.snapshots;
        restoreSanitize = sanitizeSession.restore;
        restore3d = Transform3DCapture.freezeForLiveCapture(box);
        await Utils.waitFrames(2);
        const rect = box.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));

        const layerCanvas = await Html2CanvasCapture.toCanvas(box, {
          scale: CFG.layerScale,
          width: w,
          height: h,
          backgroundColor: null,
          onClone: (clonedDoc) => {
            this.applyMediaPatchesOnClone(clonedDoc, snapshots, viewWrapper);
            Transform3DCapture.patchInClone(clonedDoc, viewWrapper);
            FontDomCapture.flattenInClone(clonedDoc, viewWrapper);
          }
        });

        if (!layerCanvas || Utils.isCanvasMostlyBlank(layerCanvas)) {
          Utils.log("warn", "dom 层空白 id=" + descriptor.id);
          return null;
        }

        const dataUrl = Utils.safeCanvasToDataUrl(layerCanvas, "image/png");
        if (!dataUrl) {
          return null;
        }

        return {
          id: descriptor.id,
          kind: "dom",
          zIndex: descriptor.zIndex,
          designRect: descriptor.designRect,
          dataUrl,
          pixelW: layerCanvas.width,
          pixelH: layerCanvas.height
        };
      } catch (error) {
        Utils.log("warn", "dom 层失败 id=" + descriptor.id, errMsg(error));
        return null;
      } finally {
        restore3d();
        restoreSanitize();
        this.clearMarks(box);
        restoreVideoCors();
        restoreWrapper();
      }
    },

    buildHtml2CanvasOnclone(
      liveCanvas: HTMLElement,
      designSize: DesignSize,
      snapshots: SnapshotMap,
      extraCloneFn?: (clonedDoc: Document) => void
    ) {
      return (clonedDoc: Document) => {
        const clonedWrapper = BiCaptureEntry.findScaledWrapperInClone(clonedDoc, liveCanvas);
        if (clonedWrapper) {
          BiCaptureEntry.patchScaledWrapperInClone(clonedWrapper, designSize);
        }
        UeStreamCapture.hideInClone(clonedDoc);
        EditorChrome.hideInClone(clonedDoc);
        if (extraCloneFn) {
          extraCloneFn(clonedDoc);
        }
        this.applyMediaPatchesOnClone(clonedDoc, snapshots, liveCanvas);
        Transform3DCapture.patchInClone(clonedDoc, liveCanvas);
        FontDomCapture.flattenInClone(clonedDoc, liveCanvas);
      };
    },

    async captureOnceHtml2Canvas(
      scope: CaptureScope,
      outMime: CaptureMimeType = "image/png",
      componentList: ComponentList
    ) {
      const { canvas, root, designSize } = scope;
      const restoreHide = Utils.hideTransientOverlays(root);
      const restorePanelVisible = Utils.preparePanelContentForCapture(root);
      window.scrollTo(0, 0);
      await Utils.waitFrames(3);

      const restoreWrapper = this.prepareWrapper(canvas, designSize);
      const restoreUe = UeStreamCapture.hideForLiveCapture(canvas);
      const restoreCors = imageCapture.applyCrossOriginOnLive(canvas);
      const restoreVideoCors = VideoNormal.applyCrossOriginOnLive(canvas);
      let snapshots: SnapshotMap = new Map();
      let restoreSanitize = () => {};

      try {
        const sanitizeSession = await runDomCaptureSanitizePipeline({
          root: canvas,
          componentList,
          deps: this.getDomSanitizeDeps()
        });
        snapshots = sanitizeSession.snapshots;
        restoreSanitize = sanitizeSession.restore;
        await Utils.waitFrames(2);
        Utils.log("info", "大屏 html2canvas 单次截图", { designSize, mime: outMime });

        const layerCanvas = await Html2CanvasCapture.toCanvas(canvas, {
          scale: CFG.layerScale,
          width: designSize.width,
          height: designSize.height,
          backgroundColor: CFG.backgroundColor,
          onClone: this.buildHtml2CanvasOnclone(canvas, designSize, snapshots)
        });

        if (!layerCanvas || Utils.isCanvasMostlyBlank(layerCanvas)) {
          Utils.log("warn", "大屏 html2canvas 结果空白");
          return null;
        }

        return Utils.safeCanvasToDataUrl(layerCanvas, outMime);
      } catch (error) {
        Utils.log("warn", "大屏 html2canvas 失败", errMsg(error));
        return null;
      } finally {
        restoreSanitize();
        this.clearMarks(canvas);
        restoreVideoCors();
        restoreCors();
        restoreUe();
        restoreWrapper();
        restorePanelVisible();
        restoreHide();
      }
    },

    async captureOnce(scope: CaptureScope, outMime: CaptureMimeType = "image/png", componentList: ComponentList) {
      const { canvas, root, designSize } = scope;
      const restoreHide = Utils.hideTransientOverlays(root);
      const restorePanelVisible = Utils.preparePanelContentForCapture(root);
      window.scrollTo(0, 0);
      await Utils.waitFrames(3);

      const restoreWrapper = this.prepareWrapper(canvas, designSize);
      const restoreCors = imageCapture.applyCrossOriginOnLive(canvas);
      const restoreVideoCors = VideoNormal.applyCrossOriginOnLive(canvas);
      let snapshots: SnapshotMap = new Map();
      let restoreSanitize = () => {};

      try {
        const sanitizeSession = await runDomCaptureSanitizePipeline({
          root: canvas,
          componentList,
          deps: this.getDomSanitizeDeps(),
          sanitizeVideo: false,
          sanitizeImg: false
        });
        snapshots = sanitizeSession.snapshots;
        restoreSanitize = sanitizeSession.restore;
        await Utils.waitFrames(2);
        const layerCanvas = await SnapdomCapture.toCanvas(canvas, {
          scale: CFG.layerScale,
          width: designSize.width,
          height: designSize.height,
          backgroundColor: CFG.backgroundColor,
          afterCloneFn: (cloneRoot) => {
            const clonedWrapper = BiCaptureEntry.findScaledWrapperInClone(cloneRoot, canvas);
            if (clonedWrapper) {
              BiCaptureEntry.patchScaledWrapperInClone(clonedWrapper, designSize);
            }
            const cloneDoc = cloneRoot instanceof Document ? cloneRoot : cloneRoot.ownerDocument;
            if (cloneDoc) {
              UeStreamCapture.hideInClone(cloneDoc);
            }
            this.applyMediaPatchesOnClone(cloneRoot, snapshots, canvas);
            Transform3DCapture.patchInClone(cloneRoot, canvas);
            FontDomCapture.flattenInClone(cloneRoot, canvas);
          }
        });

        if (!layerCanvas || Utils.isCanvasMostlyBlank(layerCanvas)) {
          return null;
        }
        return Utils.safeCanvasToDataUrl(layerCanvas, outMime);
      } finally {
        restoreSanitize();
        this.clearMarks(canvas);
        restoreVideoCors();
        restoreCors();
        restoreWrapper();
        restorePanelVisible();
        restoreHide();
      }
    },

    async captureFallback(viewWrapper: HTMLElement, componentList: ComponentList) {
      const designSize = Geometry.getCanvasDesignSize(viewWrapper);
      const restoreWrapper = this.prepareWrapper(viewWrapper, designSize);
      const restoreUe = UeStreamCapture.hideForLiveCapture(viewWrapper);
      const restoreCors = imageCapture.applyCrossOriginOnLive(viewWrapper);
      const restoreVideoCors = VideoNormal.applyCrossOriginOnLive(viewWrapper);
      let snapshots: SnapshotMap = new Map();
      let restoreSanitize = () => {};

      try {
        const sanitizeSession = await runDomCaptureSanitizePipeline({
          root: viewWrapper,
          componentList,
          deps: this.getDomSanitizeDeps(),
          sanitizeVideo: false,
          sanitizeImg: false
        });
        snapshots = sanitizeSession.snapshots;
        restoreSanitize = sanitizeSession.restore;
        await Utils.waitFrames(2);
        const layerCanvas = await Html2CanvasCapture.toCanvas(viewWrapper, {
          scale: CFG.layerScale,
          width: designSize.width,
          height: designSize.height,
          backgroundColor: CFG.backgroundColor,
          onClone: (clonedDoc) => {
            const clonedWrapper = BiCaptureEntry.findScaledWrapperInClone(clonedDoc, viewWrapper);
            if (clonedWrapper) {
              BiCaptureEntry.patchScaledWrapperInClone(clonedWrapper, designSize);
            }
            this.applyMediaPatchesOnClone(clonedDoc, snapshots, viewWrapper);
            Transform3DCapture.patchInClone(clonedDoc, viewWrapper);
            FontDomCapture.flattenInClone(clonedDoc, viewWrapper);
          }
        });
        return layerCanvas ? Utils.safeCanvasToDataUrl(layerCanvas, "image/png") : null;
      } finally {
        restoreSanitize();
        this.clearMarks(viewWrapper);
        restoreVideoCors();
        restoreCors();
        restoreUe();
        restoreWrapper();
      }
    },

    async captureBaseExcludingPanels(scope: CaptureScope, outMime: CaptureMimeType, componentList: ComponentList) {
      const { canvas, designSize } = scope;
      const panelExcludeIds = Array.from(ComponentTreeCapture.collectPanelExcludeIds(componentList));
      const panelCapture = getPanelCapture?.();

      const restoreWrapper = this.prepareWrapper(canvas, designSize);
      const restoreCors = imageCapture.applyCrossOriginOnLive(canvas);
      const restoreVideoCors = VideoNormal.applyCrossOriginOnLive(canvas);
      const restorePanelHide = panelCapture ? panelCapture.hideForLiveCapture(canvas) : () => {};
      let snapshots: SnapshotMap = new Map();
      let restoreSanitize = () => {};

      try {
        await Utils.waitFrames(2);
        const sanitizeSession = await runDomCaptureSanitizePipeline({
          root: canvas,
          componentList,
          deps: this.getDomSanitizeDeps()
        });
        snapshots = sanitizeSession.snapshots;
        restoreSanitize = sanitizeSession.restore;
        await Utils.waitFrames(2);
        const layerCanvas = await Html2CanvasCapture.toCanvas(canvas, {
          scale: CFG.layerScale,
          width: designSize.width,
          height: designSize.height,
          backgroundColor: CFG.backgroundColor,
          onClone: this.buildHtml2CanvasOnclone(canvas, designSize, snapshots, (clonedDoc) => {
            panelCapture?.hideInClone(clonedDoc);
            if (panelExcludeIds.length) {
              this.hideHostsInClone(clonedDoc, panelExcludeIds);
            }
          })
        });

        return layerCanvas ? Utils.safeCanvasToDataUrl(layerCanvas, outMime) : null;
      } finally {
        restoreSanitize();
        this.clearMarks(canvas);
        restorePanelHide();
        restoreVideoCors();
        restoreCors();
        restoreWrapper();
      }
    }
  };
}

export type DomOverlayCapture = ReturnType<typeof createDomOverlayCapture>;
