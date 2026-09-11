// @ts-nocheck
/** 策略：内容采集 / 模块分析 / 面板 / 合成（legacy DOM 遍历；公共类型见 types/captureInternal.ts） */
import { FolderEnum } from "@screenwright/types";

import { CaptureNodeClassifier } from "./analysis/captureNodeClassifier";
import { CaptureTreeWalker } from "./analysis/captureTreeWalker";
import { PanelEntryResolver } from "./analysis/panelEntryResolver";
import { createSingleComponentCapture } from "./capture/singleComponentCapture";
import { wireCaptureStrategies } from "./capture/strategyWiring";
import { CFG } from "./captureConfig";
import {
  CaptureNodeKind,
  ComponentTreeCapture,
  EditorChrome,
  findHostByComponentId,
  Geometry,
  SnapdomCapture,
  Utils
} from "./captureUtils";
import { buildRasterFromContainerData, hideContainerSiblingsForCapture } from "./container/containerRasterCapture";
import { BiCaptureEntry } from "./core/biCaptureEntry";
import { Readiness } from "./core/readiness";
import { CorsMediaFallback } from "./corsMediaFallback";
import { canvasCtx, castHtml as asHtml, errMsg, type StyleStashItem } from "./dom/captureDomHelpers";
import { runDomCaptureSanitizePipeline } from "./dom/domCaptureSanitize";
import { createDomOverlayCapture } from "./dom/domOverlayCapture";
import { ChartCapture } from "./media/chartCapture";
import { bindImageCaptureDomDeps, ImageCaptureCore } from "./media/imageCapture";
import { UeStreamCapture } from "./media/ueStreamCapture";
import { VideoNormal } from "./media/videoNormal";
import {
  CaptureStrategyFactory,
  detectSpecialComponentKey,
  FontDomCapture,
  hostHasSpecialMarker,
  rasterizeSpecialHostIfNeeded,
  SpecialComponentStrategy,
  specialLayerIdToModuleId,
  VideoStrategy
} from "./strategies";
import { Transform3DCapture } from "./transform3dCapture";
import type { CaptureScope } from "./types";
import type {
  CaptureComponentItem,
  CaptureLayer,
  CaptureMimeType,
  ComponentList,
  DesignSize,
  ModuleDescriptor
} from "./types/captureInternal";
import { VideoDataCapture } from "./videoDataCapture";

const panelCaptureRef: {
  current: { hideForLiveCapture(root: HTMLElement): () => void; hideInClone(clonedDoc: Document): void } | null;
} = { current: null };

const SingleComponentCapture = createSingleComponentCapture(ImageCaptureCore);

const DomOverlayCapture = createDomOverlayCapture({
  imageCapture: ImageCaptureCore,
  singleComponentCapture: SingleComponentCapture,
  getPanelCapture: () => panelCaptureRef.current
});

const ImageCapture = bindImageCaptureDomDeps(ImageCaptureCore, DomOverlayCapture);

// §9 FontDomCapture — 见 strategies/fontDomCapture.ts
// ─────────────────────────────────────────────────────────────

// §11 ModuleAnalyzer — 逐块 [data-id] 扫描 + 内容指纹 + 主策略
// ─────────────────────────────────────────────────────────────
const ModuleAnalyzer = {
  /** 扫描模块内有哪些内容类型（与屏幕位置无关） */
  analyzeContent(host: HTMLElement, box: HTMLElement) {
    return {
      streamVideo: UeStreamCapture.isHost(host) || UeStreamCapture.getStreamVideos(host).length > 0,
      normalVideo: VideoNormal.detectInHost(host),
      chart: !!host.querySelector("[_echarts_instance_]"),
      canvas: !!host.querySelector("canvas"),
      image: ImageCapture.detectInHost(host, box),
      textDom: FontDomCapture.detectInHost(host),
      svg: !!host.querySelector("svg")
    };
  },

  /** 模块主采集模式：streamVideo | panelShell | groupShell | image | composite */
  resolvePrimaryMode(host: HTMLElement, box: HTMLElement, hostId: string, componentList: ComponentList) {
    if (PanelCapture.isPanelHost(host, hostId, componentList)) {
      return "panelShell";
    }
    if (GroupCapture.isGroupHost(host, hostId, componentList)) {
      return "groupShell";
    }
    const content = this.analyzeContent(host, box);
    if (content.streamVideo) {
      return "streamVideo";
    }
    if (content.normalVideo) {
      const isFtVideoHost = !!host.querySelector(".ft-video, .ft-open-video");
      const hasOtherRaster =
        content.chart ||
        content.svg ||
        (content.image && ImageCapture.hasNonRasterContent(host)) ||
        (!isFtVideoHost && content.textDom);
      if (!hasOtherRaster) {
        return "normalVideo";
      }
    }
    if (content.textDom || host.querySelector(".ft-subtabs") || host.querySelector(".custom-table-list")) {
      return "composite";
    }
    if (ImageCapture.detectInHost(host, box) && !ImageCapture.hasNonRasterContent(host)) {
      return "image";
    }
    return "composite";
  },

  listStrategies(content: Record<string, boolean>, primaryMode: string) {
    const list = [];
    if (content.streamVideo) {
      list.push("videoStream");
    }
    if (content.normalVideo) {
      list.push("videoNormal");
    }
    if (content.chart || content.canvas) {
      list.push("chart");
    }
    if (content.image) {
      list.push("image");
    }
    if (content.textDom) {
      list.push("textDom");
    }
    if (content.svg) {
      list.push("svg");
    }
    if (primaryMode === "composite") {
      list.push("domOverlay");
    }
    return list;
  },

  buildModuleDescriptor(
    host: HTMLElement,
    hostId: string,
    viewWrapper: HTMLElement,
    wrapperRect: DOMRect,
    designSize: DesignSize,
    zMap: Map<string, number>,
    index: number,
    componentList: ComponentList
  ) {
    const box = Geometry.getShapeBox(host);
    const content = this.analyzeContent(host, box);
    const primaryMode = this.resolvePrimaryMode(host, box, hostId, componentList);
    const panelItem =
      primaryMode === "panelShell" && componentList
        ? ComponentTreeCapture.findComponentById(componentList, hostId)
        : null;
    const groupItem =
      primaryMode === "groupShell" && componentList
        ? ComponentTreeCapture.findComponentById(componentList, hostId)
        : null;
    const designRect = panelItem
      ? PanelCapture.resolveDesignRect(panelItem, host, box, viewWrapper, wrapperRect, designSize)
      : groupItem
        ? GroupCapture.resolveDesignRect(groupItem, host, box, viewWrapper, wrapperRect, designSize)
        : Geometry.resolveDesignRect(host, box, viewWrapper, wrapperRect, designSize);
    return {
      id: hostId,
      host,
      box,
      designRect,
      panelItem,
      groupItem,
      zIndex: Geometry.resolveZIndex(hostId, index, zMap),
      content,
      primaryMode,
      strategies: this.listStrategies(content, primaryMode),
      inPanel: false,
      kind:
        primaryMode === "streamVideo"
          ? "ue"
          : primaryMode === "normalVideo"
            ? "video"
            : primaryMode === "panelShell"
              ? "panel"
              : primaryMode === "groupShell"
                ? "group"
                : primaryMode === "image"
                  ? "image"
                  : "dom"
    };
  },

  scanAll(viewWrapper: HTMLElement, zMap: Map<string, number>, componentList: ComponentList) {
    const editor = viewWrapper.querySelector(BiCaptureEntry.selectors.editor) || viewWrapper;
    const all = Array.from(editor.querySelectorAll(BiCaptureEntry.selectors.module)).filter(Utils.isVisible);

    const wrapperRect = viewWrapper.getBoundingClientRect();
    const designSize = Geometry.getCanvasDesignSize(viewWrapper);

    const leafHosts = all.filter((el) => !all.some((other) => other !== el && other.contains(el)));
    const hostSet = new Set<HTMLElement>();
    const hostIds = new Set<string>();

    leafHosts.forEach((host) => {
      if (!Utils.isVisible(host) || DomOverlayCapture.isCaptureUiHost(host)) {
        return;
      }
      if (PanelCapture.isPanelInnerHost(host)) {
        return;
      }
      if (GroupCapture.isGroupInnerHost(host, componentList)) {
        const groupOuter = GroupCapture.findGroupOuterHost(host, componentList);
        if (groupOuter) {
          const gid = groupOuter.getAttribute("data-id") || "";
          if (gid && !hostIds.has(gid)) {
            hostIds.add(gid);
            hostSet.add(groupOuter);
          }
        }
        return;
      }
      const id = host.getAttribute("data-id") || String(hostSet.size);
      if (!hostIds.has(id)) {
        hostIds.add(id);
        hostSet.add(host);
      }
    });

    return Array.from(hostSet)
      .slice(0, CFG.maxLayers)
      .map((host, index) => {
        const hostId = host.getAttribute("data-id") || String(index);
        return this.buildModuleDescriptor(
          host,
          hostId,
          viewWrapper,
          wrapperRect,
          designSize,
          zMap,
          index,
          componentList
        );
      });
  },

  logScanSummary(modules: ModuleDescriptor[]) {
    const panelModules = modules.filter((m) => m.primaryMode === "panelShell");
    const groupModules = modules.filter((m) => m.primaryMode === "groupShell");
    Utils.log(
      "info",
      "面板整层模块:",
      panelModules.length,
      panelModules.map((m) => m.id + "@" + m.designRect.width + "x" + m.designRect.height)
    );
    Utils.log(
      "info",
      "组整层模块:",
      groupModules.length,
      groupModules.map((m) => m.id + "@" + m.designRect.width + "x" + m.designRect.height)
    );
  },

  groupByPrimaryMode(modules: ModuleDescriptor[]) {
    return {
      streamVideo: modules.filter((m) => m.primaryMode === "streamVideo"),
      normalVideo: modules.filter((m) => m.primaryMode === "normalVideo"),
      panelShell: modules.filter((m) => m.primaryMode === "panelShell"),
      groupShell: modules.filter((m) => m.primaryMode === "groupShell"),
      image: modules.filter((m) => m.primaryMode === "image"),
      composite: modules.filter((m) => m.primaryMode === "composite")
    };
  },

  computeUiZ(nonStreamModules: ModuleDescriptor[], streamModules: ModuleDescriptor[]) {
    const maxZ = nonStreamModules.reduce((m, d) => Math.max(m, d.zIndex), 0);
    const minStreamZ = streamModules.length > 0 ? streamModules.reduce((m, d) => Math.min(m, d.zIndex), maxZ) : 0;
    return Math.max(maxZ + 1, minStreamZ + 1);
  }
};

// ─────────────────────────────────────────────────────────────
// §12 ModuleComposer — 单模块策略编排
// ─────────────────────────────────────────────────────────────
const ModuleComposer = {
  /**
   * 对单个 [data-id] 模块按 primaryMode 走对应策略。
   * composite / panel 内子项的内容补丁均走 SingleComponentCapture。
   */
  async captureModule(
    module: ModuleDescriptor,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList: ComponentList
  ) {
    Utils.log("info", "单模块", module.id, module.primaryMode, module.strategies);

    if (module.primaryMode === "image") {
      const layers = await ImageCapture.buildExtractedLayers([module], viewWrapper, designSize);
      if (layers.length) {
        return layers;
      }
      Utils.log("warn", "纯图栅格失败，回退 dom 截取", module.id);
      const single = await DomOverlayCapture.capturePerComponent(module, viewWrapper, designSize, componentList);
      return single ? [single] : null;
    }

    const ctx: CaptureModuleContext = { module, viewWrapper, designSize, componentList };
    return CaptureStrategyFactory.captureModule(ctx);
  }
};

// ─────────────────────────────────────────────────────────────
// §13 ContentStrategies — 策略注册表（便于扩展）
// ─────────────────────────────────────────────────────────────
const ContentStrategies = {
  /** 单组件管线注册表（面板内 / 组内 / 叶子共用） */
  singleComponent: SingleComponentCapture,
  videoStream: UeStreamCapture,
  videoNormal: VideoNormal,
  chart: ChartCapture,
  image: ImageCapture,
  textDom: FontDomCapture,
  domOverlay: DomOverlayCapture
};

// ─────────────────────────────────────────────────────────────

// §14.5 PanelCapture — 动态/专题面板整层截取（同 UE：独立图层 + 按 designRect 拼合）
// ─────────────────────────────────────────────────────────────
const PanelCapture = {
  isPanelInnerHost(host: HTMLElement) {
    return !!host.closest(".ft-panel, .quote-panel");
  },

  isPanelOuterHost(host: Element) {
    if (host.closest(".ft-panel, .quote-panel")) {
      return false;
    }
    return !!(host.querySelector(".ft-panel") || host.querySelector(".quote-panel"));
  },

  isPanelHost(host: HTMLElement, hostId: string, componentList: ComponentList) {
    if (this.isPanelOuterHost(host)) {
      return true;
    }
    if (componentList && componentList.length && hostId != null) {
      const item = ComponentTreeCapture.findComponentById(componentList, hostId);
      return !!(item && ComponentTreeCapture.isPanelComponent(item));
    }
    return false;
  },

  /** 面板在大屏上的位置：优先 componentList（设计稿坐标），避免 DOM scale 偏差 */
  resolveDesignRect(
    panelItem: CaptureComponentItem | undefined,
    host: HTMLElement,
    box: HTMLElement,
    viewWrapper: HTMLElement,
    wrapperRect: DOMRect,
    designSize: DesignSize
  ) {
    const w = Number(panelItem?.component?.width);
    const h = Number(panelItem?.component?.height);
    if (w > 0 && h > 0) {
      return {
        left: Number(panelItem.left) || 0,
        top: Number(panelItem.top) || 0,
        width: w,
        height: h
      };
    }
    return Geometry.resolveDesignRect(host, box, viewWrapper, wrapperRect, designSize);
  },

  findChildHost(panelHost: HTMLElement, viewWrapper: HTMLElement, childId: string | number) {
    return (
      findHostByComponentId(viewWrapper, childId) ||
      (panelHost && panelHost.querySelector('[data-id="' + Utils.escapeDataId(String(childId)) + '"]')) ||
      (panelHost && panelHost.querySelector("#" + Utils.escapeDataId(String(childId)))) ||
      (panelHost && panelHost.querySelector('.go-shape-box[id="' + Utils.escapeDataId(String(childId)) + '"]'))
    );
  },

  /** 按 panelData 子组件坐标在离屏 canvas 上合成（位置 + video 均来自数据层） */
  async buildRasterFromPanelData(
    panelItem: CaptureComponentItem | undefined,
    panelHost: HTMLElement,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList: ComponentList
  ) {
    const designW = Number(panelItem?.component?.width);
    const designH = Number(panelItem?.component?.height);
    if (!designW || !designH || !panelItem) {
      return null;
    }

    const status = ComponentTreeCapture.getActivePanelStatus(panelItem);
    const children = ComponentTreeCapture.getActivePanelConfigs(panelItem)
      .flat()
      .filter((c) => c && c.display !== false)
      .sort((a, b) => (Number(a.zIndex) || 0) - (Number(b.zIndex) || 0));

    return buildRasterFromContainerData({
      designW,
      designH,
      backgroundColor: status?.backgroundColor || null,
      children,
      resolveChildRect: (child) => ({
        left: Number(child.left) || 0,
        top: Number(child.top) || 0,
        width: Number(child.component?.width) || 0,
        height: Number(child.component?.height) || 0
      }),
      containerHost: panelHost,
      viewWrapper,
      designSize,
      componentList,
      videoLogLabel: "面板内 video 数据层抓帧",
      findChildHost: (childId) => this.findChildHost(panelHost, viewWrapper, childId),
      hideSiblings: (activeChildId) => hideContainerSiblingsForCapture(panelHost, activeChildId),
      capturePerComponent: DomOverlayCapture.capturePerComponent.bind(DomOverlayCapture)
    });
  },

  getCaptureRoot(host: HTMLElement, panelItem: CaptureComponentItem | undefined) {
    const kind = panelItem
      ? CaptureNodeClassifier.classify(panelItem, host)
      : host.querySelector(".quote-panel")
        ? CaptureNodeKind.PANEL_QUOTE
        : CaptureNodeKind.PANEL_DYNAMIC;
    return (
      PanelEntryResolver.getContentRoot(host, kind, panelItem && panelItem.component && panelItem.component.prop) ||
      host
    );
  },

  hideForLiveCapture(root: HTMLElement) {
    const stash: StyleStashItem[] = [];
    const hideEl = (el) => {
      stash.push({
        el,
        visibility: el.style.visibility,
        opacity: el.style.opacity,
        display: el.style.display
      });
      el.style.visibility = "hidden";
      el.style.opacity = "0";
      el.style.display = "none";
    };

    root.querySelectorAll("[data-id]").forEach((host) => {
      if (this.isPanelOuterHost(host)) {
        hideEl(host);
      }
    });
    root.querySelectorAll(".ft-panel [data-id], .quote-panel [data-id]").forEach((host) => {
      hideEl(host);
    });
    root.querySelectorAll(".ft-panel, .quote-panel").forEach((panel) => {
      hideEl(panel);
    });
    return () => {
      stash.forEach(({ el, visibility, opacity, display }) => {
        el.style.visibility = visibility;
        el.style.opacity = opacity;
        el.style.display = display;
      });
    };
  },

  hideInClone(clonedDoc: Document) {
    clonedDoc.querySelectorAll(".ft-panel, .quote-panel").forEach((panel) => {
      panel.style.setProperty("visibility", "hidden", "important");
      panel.style.setProperty("display", "none", "important");
      panel.style.setProperty("opacity", "0", "important");
      const outer = panel.closest("[data-id]");
      if (outer) {
        outer.style.setProperty("visibility", "hidden", "important");
        outer.style.setProperty("display", "none", "important");
        outer.style.setProperty("opacity", "0", "important");
      }
    });
    clonedDoc.querySelectorAll(".ft-panel [data-id], .quote-panel [data-id]").forEach((host) => {
      host.style.setProperty("visibility", "hidden", "important");
      host.style.setProperty("display", "none", "important");
      host.style.setProperty("opacity", "0", "important");
    });
  },

  /** 从 componentList 补上面板层（DOM 扫描漏掉时） */
  async captureMissingFromList(
    viewWrapper: HTMLElement,
    componentList: ComponentList,
    designSize: DesignSize,
    zMap: Map<string, number>,
    existingIds: Set<string>
  ) {
    const layers: CaptureLayer[] = [];
    const wrapperRect = viewWrapper.getBoundingClientRect();
    const panels: CaptureComponentItem[] = [];
    ComponentTreeCapture.walkComponents(componentList, (item) => {
      if (ComponentTreeCapture.isPanelComponent(item)) {
        panels.push(item);
      }
    });

    for (const panelItem of panels) {
      const panelId = String(panelItem.id);
      if (existingIds.has(panelId)) {
        continue;
      }
      const host = asHtml(findHostByComponentId(viewWrapper, panelItem.id));
      if (!host) {
        Utils.log("warn", "面板 DOM 未找到", panelId);
        continue;
      }
      const mod = ModuleAnalyzer.buildModuleDescriptor(
        host,
        panelId,
        viewWrapper,
        wrapperRect,
        designSize,
        zMap,
        0,
        componentList
      );
      const layer = await this.buildLayer(mod, viewWrapper, designSize, componentList);
      if (layer) {
        layers.push(layer);
        existingIds.add(panelId);
      }
    }
    return layers;
  },

  /** snapdom 单独截面板外层 go-shape-box（panelStitch 面板引擎） */
  async snapdomPanelHost(
    host: HTMLElement,
    panelItem: CaptureComponentItem | undefined,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList: ComponentList
  ) {
    if (!host || !panelItem) {
      return null;
    }

    const designW = Number(panelItem.component?.width);
    const designH = Number(panelItem.component?.height);
    if (!designW || !designH) {
      return null;
    }

    await Utils.waitFrames(2);

    const designRect = { left: 0, top: 0, width: designW, height: designH };
    const restoreWrapper = DomOverlayCapture.prepareWrapper(viewWrapper, designSize);
    let restoreLiveFrames = () => {};
    let restore3d = () => {};
    try {
      const specialUrl = await rasterizeSpecialHostIfNeeded(host, designRect, componentList);
      if (specialUrl?.dataUrl) {
        Utils.log("info", "面板内特殊组件 snapdom", panelItem.id);
        return specialUrl.dataUrl;
      }

      const snapshots = await DomOverlayCapture.buildSnapshotsAsync(host, componentList);
      restoreLiveFrames = DomOverlayCapture.applyLiveMediaPatches(host, snapshots);
      restore3d = Transform3DCapture.freezeForLiveCapture(host);
      await Utils.waitFrames(2);

      const layerCanvas = await SnapdomCapture.toCanvas(host, {
        scale: CFG.layerScale,
        width: designW,
        height: designH,
        backgroundColor: "transparent",
        afterCloneFn: (cloneRoot) => {
          EditorChrome.hideInClone(cloneRoot);
          DomOverlayCapture.applyMediaPatchesOnClone(cloneRoot, snapshots, viewWrapper);
          Transform3DCapture.patchInClone(cloneRoot, viewWrapper);
          FontDomCapture.flattenInClone(cloneRoot, viewWrapper);
        }
      });

      if (!layerCanvas || Utils.isCanvasMostlyBlank(layerCanvas)) {
        return null;
      }

      return Utils.safeCanvasToDataUrl(layerCanvas, "image/png");
    } catch (error) {
      Utils.log("warn", "面板 snapdom 失败", panelItem.id, errMsg(error));
      return null;
    } finally {
      restore3d();
      DomOverlayCapture.clearMarks(host);
      restoreLiveFrames();
      restoreWrapper();
    }
  },

  /** 面板独立层：data 栅格（video）→ snapdom 整盒 */
  async buildLayer(
    descriptor: ModuleDescriptor,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList: ComponentList
  ) {
    const host = descriptor.host;
    const panelItem =
      descriptor.panelItem ||
      (componentList ? ComponentTreeCapture.findComponentById(componentList, descriptor.id) : null);

    if (panelItem) {
      const rasterUrl = await this.buildRasterFromPanelData(panelItem, host, viewWrapper, designSize, componentList);
      if (rasterUrl) {
        Utils.log("info", "面板 data 栅格", descriptor.id, descriptor.designRect);
        return {
          id: descriptor.id,
          kind: "panel",
          zIndex: descriptor.zIndex,
          designRect: descriptor.designRect,
          dataUrl: rasterUrl
        };
      }

      const snapUrl = await this.snapdomPanelHost(host, panelItem, viewWrapper, designSize, componentList);
      if (snapUrl) {
        Utils.log("info", "面板 snapdom", descriptor.id, descriptor.designRect);
        return {
          id: descriptor.id,
          kind: "panel",
          zIndex: descriptor.zIndex,
          designRect: descriptor.designRect,
          dataUrl: snapUrl
        };
      }

      Utils.log("warn", "面板层失败，尝试 legacy 回退", descriptor.id);
      return this.buildLayerLegacyFallback(descriptor, viewWrapper, designSize, componentList);
    }

    return null;
  },

  /** @deprecated 保留给 composite 回退 */
  async buildLayerLegacyFallback(
    descriptor: ModuleDescriptor,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList: ComponentList
  ) {
    const host = descriptor.host;
    const captureRoot = this.getCaptureRoot(host, descriptor.panelItem) || host;
    if (!captureRoot) {
      Utils.log("warn", "面板截取根节点未找到", descriptor.id);
      return null;
    }
    Utils.log("info", "面板整层截取(回退)", descriptor.id, descriptor.designRect);
    await Utils.waitFrames(3);

    const restoreWrapper = DomOverlayCapture.prepareWrapper(viewWrapper, designSize);
    let restoreSanitize = () => {};
    let restore3d = () => {};
    try {
      const sanitizeSession = await runDomCaptureSanitizePipeline({
        root: captureRoot,
        componentList,
        deps: DomOverlayCapture.getDomSanitizeDeps(),
        sanitizeVideo: false,
        sanitizeImg: false
      });
      restoreSanitize = sanitizeSession.restore;
      restore3d = Transform3DCapture.freezeForLiveCapture(captureRoot);
      await Utils.waitFrames(2);

      const rect = captureRoot.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));

      const layerCanvas = await SnapdomCapture.toCanvas(captureRoot, {
        scale: CFG.layerScale,
        width: w,
        height: h,
        backgroundColor: "transparent",
        afterCloneFn: (cloneRoot) => {
          DomOverlayCapture.applyMediaPatchesOnClone(cloneRoot, sanitizeSession.snapshots, viewWrapper);
          Transform3DCapture.patchInClone(cloneRoot, viewWrapper);
          FontDomCapture.flattenInClone(cloneRoot, viewWrapper);
        }
      });

      if (!layerCanvas || Utils.isCanvasMostlyBlank(layerCanvas)) {
        Utils.log("warn", "面板层空白", descriptor.id);
        return null;
      }

      const dataUrl = Utils.safeCanvasToDataUrl(layerCanvas, "image/png");
      if (!dataUrl) {
        return null;
      }

      return {
        id: descriptor.id,
        kind: "panel",
        zIndex: descriptor.zIndex,
        designRect: descriptor.designRect,
        dataUrl
      };
    } catch (error) {
      Utils.log("warn", "面板整层截取失败", descriptor.id, errMsg(error));
      return null;
    } finally {
      restore3d();
      DomOverlayCapture.clearMarks(captureRoot);
      restoreSanitize();
      restoreWrapper();
    }
  },

  /** 扫描 + 补漏，返回所有面板独立图层 */
  async captureAllPanelLayers(
    viewWrapper: HTMLElement,
    componentList: ComponentList,
    designSize: DesignSize,
    zMap: Map<string, number>
  ) {
    const layers: CaptureLayer[] = [];
    const capturedIds = new Set<string>();
    const modules = ModuleAnalyzer.scanAll(viewWrapper, zMap, componentList).filter(
      (m) => m.primaryMode === "panelShell"
    );

    for (const mod of modules) {
      const layer = await this.buildLayer(mod, viewWrapper, designSize, componentList);
      if (layer) {
        layers.push(layer);
        capturedIds.add(String(mod.id));
      }
    }

    const missing = await this.captureMissingFromList(viewWrapper, componentList, designSize, zMap, capturedIds);
    layers.push(...missing);

    Utils.log(
      "info",
      "面板独立层",
      layers.length,
      layers.map((l) => l.id + "@" + l.designRect.left + "," + l.designRect.top)
    );
    return layers;
  }
};

panelCaptureRef.current = PanelCapture;

// §14.6 GroupCapture — 组组件整层截取（与面板同套路：data 栅格 + 配置 URL 抓 video）
// ─────────────────────────────────────────────────────────────
const GroupCapture = {
  isGroupComponent(item: CaptureComponentItem | null | undefined) {
    return item?.component?.prop === FolderEnum.group;
  },

  isGroupHost(host: HTMLElement, hostId: string, componentList: ComponentList) {
    if (!componentList?.length || hostId == null) {
      return false;
    }
    const item = ComponentTreeCapture.findComponentById(componentList, hostId);
    return this.isGroupComponent(item);
  },

  /** 组内子组件（非组外壳本身） */
  isGroupInnerHost(host: HTMLElement, componentList: ComponentList) {
    if (!host || !componentList?.length) {
      return false;
    }
    const hostId = host.getAttribute("data-id");
    if (hostId) {
      const self = ComponentTreeCapture.findComponentById(componentList, hostId);
      if (self && this.isGroupComponent(self)) {
        return false;
      }
    }
    return !!this.findGroupOuterHost(host, componentList);
  },

  findGroupOuterHost(host: HTMLElement, componentList: ComponentList) {
    let node: HTMLElement | null = host;
    while (node) {
      const id = node.getAttribute?.("data-id");
      if (id) {
        const item = ComponentTreeCapture.findComponentById(componentList, id);
        if (item && this.isGroupComponent(item)) {
          return node;
        }
      }
      node = node.parentElement;
    }
    return null;
  },

  resolveDesignRect(
    groupItem: CaptureComponentItem | undefined,
    host: HTMLElement,
    box: HTMLElement,
    viewWrapper: HTMLElement,
    wrapperRect: DOMRect,
    designSize: DesignSize
  ) {
    const w = Number(groupItem?.component?.width);
    const h = Number(groupItem?.component?.height);
    if (w > 0 && h > 0) {
      return {
        left: Number(groupItem.left) || 0,
        top: Number(groupItem.top) || 0,
        width: w,
        height: h
      };
    }
    return Geometry.resolveDesignRect(host, box, viewWrapper, wrapperRect, designSize);
  },

  /** 按 group.children 坐标离屏合成（video 优先配置 URL，与面板一致） */
  async buildRasterFromGroupData(
    groupItem: CaptureComponentItem | undefined,
    groupHost: HTMLElement,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList: ComponentList
  ) {
    const designW = Number(groupItem?.component?.width);
    const designH = Number(groupItem?.component?.height);
    if (!designW || !designH || !groupItem?.children?.length) {
      return null;
    }

    const bg = groupItem.option?.backgroundColor || groupItem.option?.background;
    const backgroundColor = bg && typeof bg === "string" && !String(bg).includes("url(") ? String(bg) : null;
    const groupLeft = Number(groupItem.left) || 0;
    const groupTop = Number(groupItem.top) || 0;
    const isOuter = groupItem.isOuter === true;
    const children = [...groupItem.children]
      .filter((c) => c && c.display !== false)
      .sort((a, b) => (Number(a.zIndex) || 0) - (Number(b.zIndex) || 0));

    return buildRasterFromContainerData({
      designW,
      designH,
      backgroundColor,
      children,
      resolveChildRect: (child) => ({
        left: isOuter ? (Number(child.left) || 0) - groupLeft : Number(child.left) || 0,
        top: isOuter ? (Number(child.top) || 0) - groupTop : Number(child.top) || 0,
        width: Number(child.component?.width) || 0,
        height: Number(child.component?.height) || 0
      }),
      containerHost: groupHost,
      viewWrapper,
      designSize,
      componentList,
      videoLogLabel: "组内 video 数据层抓帧",
      findChildHost: (childId) => PanelCapture.findChildHost(groupHost, viewWrapper, childId),
      hideSiblings: (activeChildId) => hideContainerSiblingsForCapture(groupHost, activeChildId),
      capturePerComponent: DomOverlayCapture.capturePerComponent.bind(DomOverlayCapture)
    });
  },

  async buildLayer(
    descriptor: ModuleDescriptor,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList: ComponentList
  ) {
    const groupItem =
      descriptor.groupItem ||
      (componentList ? ComponentTreeCapture.findComponentById(componentList, descriptor.id) : null);
    const host = descriptor.host;

    if (groupItem) {
      const rasterUrl = await this.buildRasterFromGroupData(groupItem, host, viewWrapper, designSize, componentList);
      if (rasterUrl) {
        Utils.log("info", "组 data 栅格", descriptor.id, descriptor.designRect);
        return {
          id: descriptor.id,
          kind: "group",
          zIndex: descriptor.zIndex,
          designRect: descriptor.designRect,
          dataUrl: rasterUrl
        };
      }
    }

    Utils.log("info", "组 data 栅格失败，回退整盒 html2canvas", descriptor.id);
    return DomOverlayCapture.capturePerComponent(descriptor, viewWrapper, designSize, componentList);
  }
};

// ─────────────────────────────────────────────────────────────

// §15 ScreenCompositor — 大屏整合（统一出口）
// ─────────────────────────────────────────────────────────────
const ScreenCompositor = {
  /** 按 zIndex 绘制各层 → PNG dataURL */
  async merge(layers: CaptureLayer[], designSize: DesignSize, outMime: CaptureMimeType = "image/png") {
    const outputScale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const outW = Math.round(designSize.width * outputScale);
    const outH = Math.round(designSize.height * outputScale);
    const out = document.createElement("canvas");
    out.width = outW;
    out.height = outH;
    const g = canvasCtx(out);

    g.fillStyle = CFG.backgroundColor;
    g.fillRect(0, 0, outW, outH);

    const sorted = layers.slice().sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sorted) {
      const img = await ImageCapture.load(layer.dataUrl);
      if (!img) {
        Utils.log("warn", "合成时图片加载失败:", layer.id);
        continue;
      }
      const box = Geometry.mapDesignRectToOutput(layer.designRect, designSize, outW, outH);
      if (layer.kind === "ue") {
        Geometry.drawImageCover(g, img, box);
      } else if (layer.kind === "ui") {
        g.drawImage(img, 0, 0, outW, outH);
      } else {
        g.drawImage(img, box.x, box.y, box.w, box.h);
      }
    }

    const mime = outMime === "image/jpeg" ? "image/jpeg" : "image/png";
    return Utils.safeCanvasToDataUrl(out, mime);
  },

  /** panelStitch：面板 snapdom + 大屏 html2canvas + merge */
  async capturePanelStitch(
    scope: CaptureScope,
    componentList: ComponentList,
    zMap: Map<string, number>,
    outMime: CaptureMimeType
  ) {
    const { canvas, root, designSize } = scope;
    const hasPanels = ComponentTreeCapture.countPanelComponents(componentList) > 0;
    const restoreHide = Utils.hideTransientOverlays(root);
    const restorePanelVisible = Utils.preparePanelContentForCapture(root);
    window.scrollTo(0, 0);
    await Utils.waitFrames(3);

    try {
      CaptureTreeWalker.buildEditorCapturePlan(scope.editor, componentList, canvas);

      if (!hasPanels) {
        Utils.log("info", "panelStitch: 无面板，仅 html2canvas 大屏");
        return await DomOverlayCapture.captureOnceHtml2Canvas(scope, outMime, componentList);
      }

      const panelLayers = await PanelCapture.captureAllPanelLayers(canvas, componentList, designSize, zMap);
      const baseDataUrl = await DomOverlayCapture.captureBaseExcludingPanels(scope, outMime, componentList);

      if (!baseDataUrl && !panelLayers.length) {
        return null;
      }

      if (!panelLayers.length) {
        return baseDataUrl;
      }

      const layers: CaptureLayer[] = [];
      if (baseDataUrl) {
        layers.push({
          id: "__base__",
          kind: "ui",
          zIndex: 0,
          designRect: Geometry.getFullScreenDesignRect(designSize),
          dataUrl: baseDataUrl
        });
      }
      layers.push(...panelLayers);

      Utils.log(
        "info",
        "panelStitch merge",
        "base=html2canvas",
        "panels=snapdom/data",
        layers.map((l) => l.id + ":" + l.kind + "@z" + l.zIndex)
      );
      return this.merge(layers, designSize, outMime);
    } finally {
      restorePanelVisible();
      restoreHide();
    }
  },

  /**
   * 大屏采集入口
   * 1. ModuleAnalyzer 扫描全部块
   * 2. streamVideo 块 → 独立帧层
   * 3. composite 块 → 批量 domOverlay（性能优化）
   * 4. image 块 → 栅格抽取后叠在 overlay 上
   * 5. merge 输出 PNG
   */
  async capture(
    viewWrapper: HTMLElement,
    root: HTMLElement,
    zMap: Map<string, number>,
    componentList: ComponentList,
    outMime: CaptureMimeType = "image/png"
  ) {
    const restoreHide = Utils.hideTransientOverlays(root);
    const restorePanelVisible = Utils.preparePanelContentForCapture(root);
    window.scrollTo(0, 0);
    await Utils.waitFrames(3);

    try {
      const designSize = Geometry.getCanvasDesignSize(viewWrapper);
      const modules = ModuleAnalyzer.scanAll(viewWrapper, zMap, componentList);
      ModuleAnalyzer.logScanSummary(modules);

      Utils.log(
        "info",
        "模块数:",
        modules.length,
        modules.map((m) => m.id + ":" + m.primaryMode + "[" + m.strategies.join(",") + "]")
      );

      if (!modules.length) {
        if (CFG.fallbackFullCanvas) {
          return DomOverlayCapture.captureFallback(viewWrapper, componentList);
        }
        throw new Error("未找到可截图的模块 [data-id]");
      }

      const { streamVideo, normalVideo, panelShell, groupShell, image, composite } =
        ModuleAnalyzer.groupByPrimaryMode(modules);
      const complexModules = modules.filter((m) => hostHasSpecialMarker(m.host));
      const domOverlayTargets = modules.filter((m) => {
        if (m.primaryMode === "streamVideo" || m.primaryMode === "normalVideo") {
          return false;
        }
        if (m.primaryMode === "groupShell") {
          return false;
        }
        if (m.primaryMode === "image" && CFG.useExtractImageLayers) {
          return false;
        }
        if (hostHasSpecialMarker(m.host)) {
          return false;
        }
        return true;
      });

      const layers: CaptureLayer[] = [];
      let ok = 0;
      let fail = 0;

      for (const mod of streamVideo.concat(normalVideo)) {
        const layer = VideoStrategy
          ? await VideoStrategy.buildLayer(mod, designSize, componentList)
          : mod.primaryMode === "streamVideo"
            ? UeStreamCapture.buildLayer(mod, designSize)
            : await VideoNormal.buildLayer(mod, designSize, componentList);
        if (layer) {
          layers.push(layer);
          ok++;
        } else if (mod.primaryMode === "normalVideo") {
          fail++;
        }
      }

      const capturedVideoIds = new Set(
        layers.filter((l) => normalVideo.some((m) => String(m.id) === String(l.id))).map((l) => String(l.id))
      );
      const failedVideoMods = normalVideo.filter((m) => !capturedVideoIds.has(String(m.id)));
      if (failedVideoMods.length) {
        Utils.log(
          "warn",
          "video 独立层失败，保留 overlay 重画",
          failedVideoMods.map((m) => m.id)
        );
      }

      const capturedGroupIds = new Set<string>();
      for (const mod of groupShell) {
        const layer = await GroupCapture.buildLayer(mod, viewWrapper, designSize, componentList);
        if (layer) {
          layers.push(layer);
          capturedGroupIds.add(String(mod.id));
          ok++;
        } else {
          fail++;
          Utils.log("warn", "组独立层失败，保留 overlay 重画", mod.id);
        }
      }

      if (CFG.domCaptureMode === "overlay" && (domOverlayTargets.length > 0 || complexModules.length > 0)) {
        const uiZ = ModuleAnalyzer.computeUiZ(domOverlayTargets, streamVideo.concat(normalVideo));

        let imageLayers: CaptureLayer[] = [];
        const complexLayers =
          complexModules.length && SpecialComponentStrategy
            ? await SpecialComponentStrategy.buildLayers(complexModules, viewWrapper, designSize, componentList)
            : [];

        const capturedSpecialIds = new Set(complexLayers.map((l) => specialLayerIdToModuleId(l.id)));
        let excludeHostIds = Array.from(capturedVideoIds)
          .concat(Array.from(capturedGroupIds))
          .concat(complexModules.filter((m) => capturedSpecialIds.has(String(m.id))).map((m) => String(m.id)));

        if (CFG.useExtractImageLayers && image.length) {
          imageLayers = await ImageCapture.buildExtractedLayers(image, viewWrapper, designSize);
          const extractedImageIds = ImageCapture.getModuleIdsFromLayers(imageLayers);
          excludeHostIds = excludeHostIds.concat(
            image.filter((m) => extractedImageIds.has(String(m.id))).map((m) => String(m.id))
          );
        }

        Utils.log(
          "info",
          "大屏 batch: stream",
          streamVideo.length,
          "normalVideo",
          normalVideo.length,
          "panel(in overlay)",
          panelShell.length,
          "group",
          groupShell.length,
          "groupCaptured",
          capturedGroupIds.size,
          "image",
          image.length,
          "imageInOverlay",
          !CFG.useExtractImageLayers,
          "complex",
          complexModules.length,
          "composite",
          composite.length,
          "specialCaptured",
          capturedSpecialIds.size,
          "specialFailed",
          complexModules.length - capturedSpecialIds.size
        );

        let uiLayer = await DomOverlayCapture.captureOverlay(
          viewWrapper,
          designSize,
          uiZ,
          excludeHostIds,
          componentList
        );
        if (!uiLayer && CFG.fallbackFullCanvas) {
          Utils.log("warn", "domOverlay 失败，回退整屏");
          const fallbackUrl = await DomOverlayCapture.captureFallback(viewWrapper, componentList);
          if (fallbackUrl) {
            uiLayer = {
              id: "__ui_overlay__",
              kind: "ui",
              zIndex: uiZ,
              designRect: Geometry.getFullScreenDesignRect(designSize),
              dataUrl: fallbackUrl
            };
          }
        }

        if (uiLayer) {
          layers.push(uiLayer);
          ok += domOverlayTargets.length;
        } else {
          Utils.log("warn", "batch overlay 不可用，降级逐模块 capture", domOverlayTargets.length);
          for (const mod of domOverlayTargets) {
            const part = await ModuleComposer.captureModule(mod, viewWrapper, designSize, componentList);
            if (part) {
              const arr = Array.isArray(part) ? part : [part];
              layers.push(...arr);
              ok += arr.length;
            } else {
              fail++;
            }
          }
        }

        if (complexLayers.length) {
          layers.push(...complexLayers);
          ok += complexLayers.length;
        }

        const failedComplex = complexModules.filter((m) => !capturedSpecialIds.has(String(m.id)));
        if (failedComplex.length) {
          fail += failedComplex.length;
          Utils.log(
            "warn",
            "特殊组件栅格失败，保留在 overlay 中渲染",
            failedComplex.map((m) => m.id + ":" + (detectSpecialComponentKey(m.host) || "?"))
          );
        }

        if (CFG.useExtractImageLayers) {
          layers.push(...imageLayers);
          ok += imageLayers.length;
          const extractedImageIds = ImageCapture.getModuleIdsFromLayers(imageLayers);
          const failedImages = image.filter((m) => !extractedImageIds.has(String(m.id)));
          for (const mod of failedImages) {
            Utils.log("warn", "纯图栅格未成功，逐模块 dom 回退", mod.id);
            const part = await DomOverlayCapture.capturePerComponent(mod, viewWrapper, designSize, componentList);
            if (part) {
              layers.push(part);
              ok++;
            } else {
              fail++;
            }
          }
        }
      } else {
        const nonStream = modules.filter((m) => m.primaryMode !== "streamVideo");
        for (const mod of nonStream) {
          const part = await ModuleComposer.captureModule(mod, viewWrapper, designSize, componentList);
          if (part) {
            const arr = Array.isArray(part) ? part : [part];
            layers.push(...arr);
            ok += arr.length;
          } else {
            fail++;
          }
        }
      }

      Utils.log(
        "info",
        "合成层:",
        layers.map((l) => l.id + ":" + l.kind + "@z" + l.zIndex),
        "成功/失败:",
        ok + "/" + fail
      );

      if (!layers.length) {
        if (CFG.fallbackFullCanvas) {
          return DomOverlayCapture.captureFallback(viewWrapper, componentList);
        }
        throw new Error("所有图层生成失败");
      }

      return this.merge(layers, designSize, outMime);
    } finally {
      restorePanelVisible();
      restoreHide();
    }
  }
};

wireCaptureStrategies({
  PanelCapture,
  GroupCapture,
  DomOverlayCapture,
  ImageCapture,
  Readiness,
  hostHasSpecialMarker
});

export {
  BiCaptureEntry,
  CaptureNodeClassifier,
  CaptureStrategyFactory,
  CaptureTreeWalker,
  ChartCapture,
  ContentStrategies,
  CorsMediaFallback,
  DomOverlayCapture,
  FontDomCapture,
  GroupCapture,
  ImageCapture,
  ModuleAnalyzer,
  ModuleComposer,
  PanelCapture,
  PanelEntryResolver,
  Readiness,
  ScreenCompositor,
  SingleComponentCapture,
  Transform3DCapture,
  UeStreamCapture,
  VideoDataCapture,
  VideoNormal
};
