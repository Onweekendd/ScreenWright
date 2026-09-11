/** 工具：异步 / 几何 / 组件树 / 截图引擎 */
import { PanelEnum } from "@screenwright/types";
import { snapdom } from "@zumer/snapdom";
import html2canvas from "html2canvas";

import { CAPTURE_WRAPPER_ATTR, CFG, LOG } from "./captureConfig";
import { CorsMediaFallback } from "./corsMediaFallback";
import type {
  CaptureComponentItem,
  CaptureMimeType,
  ConsoleLogLevel,
  DesignRect,
  DesignSize,
  Html2CanvasOptions,
  OutputBox,
  PanelStatusEntry,
  RestoreFn,
  SnapdomCaptureOptions
} from "./types/captureInternal";

/** querySelector 等返回 Element，按 HTMLElement 使用 */
function asHtml(el: Element | null | undefined): HTMLElement | null {
  return el instanceof HTMLElement ? el : null;
}

interface StyleStashItem {
  el: HTMLElement;
  opacity?: string;
  visibility?: string;
  animation?: string;
  display?: string;
  pointerEvents?: string;
  scrollTop?: number;
  transform?: string;
  webkitTransform?: string;
}

interface HideStashItem {
  el: HTMLElement;
  visibility: string;
  display: string;
}

interface PanelChildEntry {
  item: CaptureComponentItem;
  panelItem: CaptureComponentItem;
}

type ComponentVisitor = (item: CaptureComponentItem) => void;

const errMsg = (error: unknown): string => (error instanceof Error ? error.message : String(error));

// §1 Utils — 异步 / 可见性 / 日志
// ─────────────────────────────────────────────────────────────
const Utils = {
  sleep: (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms)),

  waitFrames: (n: number): Promise<void> =>
    new Promise((r) => {
      let c = n;
      const tick = (): void => {
        if (--c <= 0) {
          r();
        } else {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    }),

  isVisible(el: Element | null | undefined): boolean {
    if (!el || !(el instanceof HTMLElement)) {
      return false;
    }
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 2 && rect.height > 2;
  },

  /** 面板内渐显动画初始 opacity=0，截图前强制可见 */
  preparePanelContentForCapture(root: HTMLElement): RestoreFn {
    const stash: StyleStashItem[] = [];
    const fixEl = (el: Element): void => {
      if (!(el instanceof HTMLElement)) {
        return;
      }
      stash.push({
        el,
        opacity: el.style.opacity,
        visibility: el.style.visibility,
        animation: el.style.animation,
        display: el.style.display
      });
      el.style.opacity = "1";
      el.style.visibility = "visible";
      el.style.animation = "none";
      if (getComputedStyle(el).display === "none") {
        el.style.display = "block";
      }
    };

    root
      .querySelectorAll(
        ".ft-panel .go-shape-box, .quote-panel .go-shape-box, .status-view .go-shape-box, .screen-quote .go-shape-box, .panel-view .go-shape-box, .ft-video"
      )
      .forEach(fixEl);

    root.querySelectorAll(".ft-panel .subgroupItem").forEach((el) => {
      if (!(el instanceof HTMLElement)) {
        return;
      }
      stash.push({
        el,
        opacity: el.style.opacity,
        visibility: el.style.visibility,
        pointerEvents: el.style.pointerEvents
      });
      el.style.opacity = "1";
      el.style.visibility = "visible";
      el.style.pointerEvents = "none";
    });

    // customTableList：截图前停滚、归零 scrollTop，避免截到滚动中间帧
    root.querySelectorAll(".custom-table-list").forEach((tableRoot) => {
      const wrap = tableRoot.querySelector(".el-scrollbar__wrap");
      if (wrap instanceof HTMLElement) {
        stash.push({ el: wrap, scrollTop: wrap.scrollTop });
        wrap.scrollTop = 0;
      }
      tableRoot.querySelectorAll(".parts-marquee .row-content").forEach((el) => {
        if (!(el instanceof HTMLElement)) {
          return;
        }
        stash.push({
          el,
          animation: el.style.animation,
          transform: el.style.transform,
          webkitTransform: el.style.webkitTransform
        });
        el.style.animation = "none";
        el.style.transform = "none";
        el.style.webkitTransform = "none";
      });
      const scrollBox = tableRoot.querySelector(".customTableList-scrollbar-box");
      if (scrollBox instanceof HTMLElement) {
        stash.push({
          el: scrollBox,
          animation: scrollBox.style.animation,
          transform: scrollBox.style.transform,
          webkitTransform: scrollBox.style.webkitTransform
        });
        scrollBox.style.animation = "none";
        scrollBox.style.transform = "none";
        scrollBox.style.webkitTransform = "none";
      }
    });

    return () => {
      stash.forEach((item) => {
        const { el, opacity, visibility, animation, display, pointerEvents, scrollTop, transform, webkitTransform } =
          item;
        if (opacity != null) {
          el.style.opacity = opacity;
        }
        if (visibility != null) {
          el.style.visibility = visibility;
        }
        if (animation != null) {
          el.style.animation = animation;
        }
        if (display != null) {
          el.style.display = display;
        }
        if (pointerEvents != null) {
          el.style.pointerEvents = pointerEvents;
        }
        if (scrollTop != null) {
          el.scrollTop = scrollTop;
        }
        if (transform != null) {
          el.style.transform = transform;
        }
        if (webkitTransform != null) {
          el.style.webkitTransform = webkitTransform;
        }
      });
    };
  },

  safeCanvasToDataUrl(canvas: HTMLCanvasElement | null | undefined, mimeType?: CaptureMimeType): string | null {
    return CorsMediaFallback.safeCanvasToDataUrl(canvas, mimeType);
  },

  escapeDataId: (s: unknown): string => (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(String(s)) : String(s)),

  /** 按 component id 在 viewWrapper 内查找 host 元素 */
  findHostByComponentId(viewWrapper: HTMLElement, id: string | number): HTMLElement | null {
    const esc = Utils.escapeDataId(String(id));
    return (
      asHtml(viewWrapper.querySelector('[data-id="' + esc + '"]')) ||
      asHtml(viewWrapper.querySelector("#" + esc)) ||
      asHtml(viewWrapper.querySelector('.go-shape-box[id="' + esc + '"]'))
    );
  },

  isCanvasMostlyBlank(canvas: HTMLCanvasElement): boolean {
    try {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        return false;
      }
      const w = Math.min(canvas.width, 240);
      const h = Math.min(canvas.height, 240);
      const px = ctx.getImageData(0, 0, w, h).data;
      let opaque = 0;
      const total = w * h;
      for (let i = 3; i < px.length; i += 4) {
        if (px[i] > 12) {
          opaque++;
        }
      }
      return opaque / total < 0.02;
    } catch {
      return false;
    }
  },

  /** 稀疏 canvas（粒子等）只要有任意可见像素即视为有内容 */
  hasCanvasContent(canvas: HTMLCanvasElement): boolean {
    try {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        return false;
      }
      const w = Math.min(canvas.width, 400);
      const h = Math.min(canvas.height, 400);
      const px = ctx.getImageData(0, 0, w, h).data;
      for (let i = 3; i < px.length; i += 16) {
        if (px[i] > 8) {
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  },

  log: (level: ConsoleLogLevel, ...args: unknown[]): void => {
    const fn = console[level] || console.log;
    fn(LOG, ...args);
  },

  /** snapdom afterClone 可能传入 Document 或 HTMLElement 子树 */
  getClonePatchContext(clonedRoot: Document | HTMLElement): {
    ownerDoc: Document;
    queryRoot: Document | HTMLElement;
  } {
    if (clonedRoot instanceof Document) {
      return { ownerDoc: clonedRoot, queryRoot: clonedRoot };
    }
    return {
      ownerDoc: clonedRoot.ownerDocument || document,
      queryRoot: clonedRoot
    };
  },

  /** 截图前隐藏编辑态脏层，返回 restore */
  hideTransientOverlays(root: HTMLElement): RestoreFn {
    return EditorChrome.hideForCapture(root);
  }
};

// ─────────────────────────────────────────────────────────────

const CaptureNodeKind = {
  /** 动态面板：.ft-panel → .status-view，子项为单组件或嵌套面板 */
  PANEL_DYNAMIC: "panelDynamic",
  /** 专题面板：无 status-view */
  PANEL_SPECIAL: "panelSpecial",
  /** 引用面板：.quote-panel → .screen-quote */
  PANEL_QUOTE: "panelQuote",
  /** 编码面板：可嵌套子面板 */
  PANEL_ENCODE: "panelEncode",
  /** 组：children 仅叶子单组件，不可含面板/组 */
  GROUP: "group",
  /** 叶子：UE 像素流送（常独立 ue 层） */
  UE_STREAM: "ueStream",
  /** 叶子：普通单组件 */
  LEAF: "leaf"
} as const;

/** 构建页脏层：锚点、选中框、编辑遮罩等（容器背景色可忽略） */
const EditorChrome = {
  LIVE_HIDE_SELECTORS: [
    ".shape-point",
    ".shape-modal",
    ".sw-transform",
    ".go-edit-select",
    ".grid-rect",
    ".alignment-lines-container",
    ".screen-capture-container",
    ".capture-btn",
    ".quote-panel > .panel",
    ".ft-panel > .panel",
    ".build-mask",
    ".tip-info",
    ".tipInfo",
    ".panel-arrow"
  ],

  hideForCapture(root: HTMLElement): RestoreFn {
    const stash: HideStashItem[] = [];
    const hideEl = (el: Element): void => {
      if (!(el instanceof HTMLElement)) {
        return;
      }
      stash.push({ el, visibility: el.style.visibility, display: el.style.display });
      el.style.visibility = "hidden";
      el.style.display = "none";
    };
    this.LIVE_HIDE_SELECTORS.forEach((sel) => {
      root.querySelectorAll(sel).forEach(hideEl);
    });
    root.querySelectorAll("*").forEach((el) => {
      if (!(el instanceof HTMLElement) || el.children.length > 4) {
        return;
      }
      const text = (el.textContent || "").trim();
      if (text.includes("Apostrophe") && text.includes("Pawn")) {
        hideEl(el);
      }
    });
    return () => {
      stash.forEach(({ el, visibility, display }) => {
        el.style.visibility = visibility;
        el.style.display = display;
      });
    };
  },

  hideInClone(clonedRoot: Document | Element): void {
    const root = clonedRoot && "querySelectorAll" in clonedRoot ? clonedRoot : document;
    this.LIVE_HIDE_SELECTORS.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("display", "none", "important");
        }
      });
    });
  }
};

// §2.5 ComponentTreeCapture — 从 componentList 展开面板内组件
// ─────────────────────────────────────────────────────────────
/** 与 component.prop / PanelEnum 一致，勿用 dynamicPanel 等枚举 key */
const PANEL_PROPS = new Set<string>([PanelEnum.dynamicPanel, PanelEnum.quotePanel, PanelEnum.encodePanel]);

const ComponentTreeCapture = {
  isPanelComponent(item: CaptureComponentItem | null | undefined): boolean {
    const prop = item?.component?.prop;
    return !!prop && PANEL_PROPS.has(prop);
  },

  /** 当前 DOM 会渲染的面板状态 config（引用面板按 status 索引） */
  getActivePanelConfigs(item: CaptureComponentItem): CaptureComponentItem[][] {
    const prop = item?.component?.prop;
    const panelData = item?.panelData;
    if (!Array.isArray(panelData) || !panelData.length) {
      return [];
    }

    if (prop === PanelEnum.quotePanel) {
      const idx = Number(item.status) || 0;
      const entry = panelData[idx];
      return entry?.config?.length ? [entry.config] : [];
    }

    const activeId =
      item.activeStatusId != null
        ? item.activeStatusId
        : item.activeStatus?.id != null
          ? item.activeStatus.id
          : (panelData.find((status) => status.config && status.config.length) || panelData[0])?.id;
    return panelData
      .filter((status) => activeId == null || status.id === activeId)
      .map((status) => status.config || [])
      .filter((config) => config.length);
  },

  /** 当前激活的面板状态（含 backgroundColor 等） */
  getActivePanelStatus(item: CaptureComponentItem): PanelStatusEntry | null {
    const panelData = item?.panelData;
    if (!Array.isArray(panelData) || !panelData.length) {
      return null;
    }
    if (item.component?.prop === PanelEnum.quotePanel) {
      return panelData[Number(item.status) || 0] || null;
    }
    const activeId =
      item.activeStatusId != null
        ? item.activeStatusId
        : (panelData.find((s) => s.config && s.config.length) || panelData[0])?.id;
    return panelData.find((s) => s.id === activeId) || panelData[0] || null;
  },

  walkComponents(items: CaptureComponentItem[] | undefined, visitor: ComponentVisitor): void {
    const walk = (arr: CaptureComponentItem[] | undefined): void => {
      (arr || []).forEach((item) => {
        if (!item) {
          return;
        }
        visitor(item);
        if (item.children?.length) {
          walk(item.children);
        }
        if (this.isPanelComponent(item)) {
          this.getActivePanelConfigs(item).forEach((config) => walk(config));
        }
      });
    };
    walk(items);
  },

  buildZIndexMap(items: CaptureComponentItem[] | undefined): Map<string, number> {
    const map = new Map<string, number>();
    const Z_MULT = 100000;

    const walk = (arr: CaptureComponentItem[] | undefined, panelBaseZ: number): void => {
      (arr || []).forEach((item) => {
        if (!item || item.id == null) {
          return;
        }

        const localZ = Number(item.zIndex) || 0;
        const globalZ = panelBaseZ > 0 ? panelBaseZ * Z_MULT + localZ : localZ;
        map.set(String(item.id), globalZ);

        if (item.children?.length) {
          walk(item.children, panelBaseZ);
        }

        if (this.isPanelComponent(item)) {
          const nextBase = panelBaseZ > 0 ? panelBaseZ : localZ;
          this.getActivePanelConfigs(item).forEach((config) => walk(config, nextBase || localZ));
        }
      });
    };

    walk(items, 0);
    const panelInner: string[] = [];
    map.forEach((z, id) => {
      if (Number(z) >= Z_MULT) {
        panelInner.push(id + "@" + z);
      }
    });
    Utils.log("info", "zIndex 映射(含面板内):", map.size, panelInner.length ? panelInner : "");
    return map;
  },

  collectPanelChildComponents(items: CaptureComponentItem[] | undefined): PanelChildEntry[] {
    const result: PanelChildEntry[] = [];
    const walkConfig = (arr: CaptureComponentItem[] | undefined, panelItem: CaptureComponentItem): void => {
      (arr || []).forEach((child) => {
        if (!child || child.id == null) {
          return;
        }
        result.push({ item: child, panelItem });
        if (child.children?.length) {
          walkConfig(child.children, panelItem);
        }
      });
    };
    (items || []).forEach((panelItem) => {
      if (this.isPanelComponent(panelItem)) {
        this.getActivePanelConfigs(panelItem).forEach((config) => walkConfig(config, panelItem));
      }
    });
    return result;
  },

  countPanelComponents(items: CaptureComponentItem[] | undefined): number {
    let count = 0;
    this.walkComponents(items, (item) => {
      if (this.isPanelComponent(item)) {
        count++;
      }
    });
    return count;
  },

  findComponentById(items: CaptureComponentItem[] | undefined, id: number | string): CaptureComponentItem | null {
    let found: CaptureComponentItem | null = null;
    this.walkComponents(items, (item) => {
      if (found) {
        return;
      }
      if (String(item.id) === String(id)) {
        found = item;
      }
    });
    return found;
  },

  /** 面板外层 + 当前激活状态内所有子组件 id，用于 overlay 去重 */
  collectPanelExcludeIds(componentList: CaptureComponentItem[] | undefined): Set<string> {
    const ids = new Set<string>();
    if (!Array.isArray(componentList)) {
      return ids;
    }
    this.walkComponents(componentList, (item) => {
      if (!this.isPanelComponent(item)) {
        return;
      }
      if (item.id != null) {
        ids.add(String(item.id));
      }
      this.getActivePanelConfigs(item)
        .flat()
        .forEach((child) => {
          if (child?.id != null) {
            ids.add(String(child.id));
          }
        });
    });
    return ids;
  }
};

// ─────────────────────────────────────────────────────────────

// §2 Geometry — 设计稿坐标 / zIndex / 图层盒
// ─────────────────────────────────────────────────────────────
const Geometry = {
  getCanvasDesignSize(el: HTMLElement): DesignSize {
    const w = parseFloat(el.style.width);
    const h = parseFloat(el.style.height);
    if (w > 100 && h > 100) {
      return { width: Math.round(w), height: Math.round(h) };
    }
    const rect = el.getBoundingClientRect();
    return {
      width: Math.max(1, Math.round(rect.width)),
      height: Math.max(1, Math.round(rect.height))
    };
  },

  getFullScreenDesignRect(designSize: DesignSize): DesignRect {
    return { left: 0, top: 0, width: designSize.width, height: designSize.height };
  },

  visualRectToDesignRect(rect: DOMRect, wrapperRect: DOMRect, designSize: DesignSize): DesignRect {
    return {
      left: (rect.left - wrapperRect.left) * (designSize.width / wrapperRect.width),
      top: (rect.top - wrapperRect.top) * (designSize.height / wrapperRect.height),
      width: rect.width * (designSize.width / wrapperRect.width),
      height: rect.height * (designSize.height / wrapperRect.height)
    };
  },

  getDesignRectFromStyle(el: HTMLElement, viewWrapper: HTMLElement): DesignRect | null {
    let node: HTMLElement | null = el;
    while (node && node !== viewWrapper) {
      const width = parseFloat(node.style.width);
      const height = parseFloat(node.style.height);
      if (width > 10 && height > 10) {
        return {
          left: parseFloat(node.style.left) || 0,
          top: parseFloat(node.style.top) || 0,
          width,
          height
        };
      }
      node = node.parentElement;
    }
    return null;
  },

  mapDesignRectToOutput(designRect: DesignRect, designSize: DesignSize, outW: number, outH: number): OutputBox {
    return {
      x: (designRect.left * outW) / designSize.width,
      y: (designRect.top * outH) / designSize.height,
      w: (designRect.width * outW) / designSize.width,
      h: (designRect.height * outH) / designSize.height
    };
  },

  buildZIndexMap(items: CaptureComponentItem[] | undefined): Map<string, number> {
    return ComponentTreeCapture.buildZIndexMap(items);
  },

  /** 面板内 [data-id] 的 style.left/top 相对面板，须用视觉坐标换算 */
  isInsidePanelHost(host: HTMLElement): boolean {
    return !!host.closest(".ft-panel, .quote-panel, .status-view, .screen-quote");
  },

  resolveDesignRect(
    host: HTMLElement,
    box: HTMLElement,
    viewWrapper: HTMLElement,
    wrapperRect: DOMRect,
    designSize: DesignSize
  ): DesignRect {
    const boxRect = box.getBoundingClientRect();
    if (this.isInsidePanelHost(host)) {
      return this.visualRectToDesignRect(boxRect, wrapperRect, designSize);
    }
    const fromStyle = this.getDesignRectFromStyle(box, viewWrapper);
    return fromStyle || this.visualRectToDesignRect(boxRect, wrapperRect, designSize);
  },

  resolveZIndex(hostId: string, domOrder: number, zMap: Map<string, number>): number {
    return zMap.has(hostId) ? (zMap.get(hostId) as number) : domOrder;
  },

  getShapeBox: (host: HTMLElement): HTMLElement => (host.querySelector(".go-shape-box") as HTMLElement) || host,

  drawImageCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, box: OutputBox): void {
    const imgEl = img as HTMLImageElement;
    const iw = imgEl.naturalWidth || imgEl.width;
    const ih = imgEl.naturalHeight || imgEl.height;
    if (!iw || !ih) {
      ctx.drawImage(img, box.x, box.y, box.w, box.h);
      return;
    }
    const scale = Math.max(box.w / iw, box.h / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const dx = box.x + (box.w - sw) / 2;
    const dy = box.y + (box.h - sh) / 2;
    ctx.drawImage(img, dx, dy, sw, sh);
  }
};

// ─────────────────────────────────────────────────────────────

// §3 CaptureUI — Loading 遮罩 / ElMessage / 下载（职责集中）
// ─────────────────────────────────────────────────────────────
interface CaptureProgress {
  start(phase: string): void;
  close(): void;
}

declare const ElLoading:
  | {
      service(options: Record<string, unknown>): {
        setText?(text: string): void;
        close(): void;
      };
    }
  | undefined;

declare const ElMessage:
  | {
      info(options: Record<string, unknown>): void;
      success(options: Record<string, unknown>): void;
      error(options: Record<string, unknown>): void;
    }
  | undefined;

const CaptureUI = {
  createProgress(): CaptureProgress {
    let loadingInst: ReturnType<NonNullable<typeof ElLoading>["service"]> | null = null;
    let countTimer: ReturnType<typeof setInterval> | null = null;
    let leftSec = CFG.estimateHintSec;
    let currentPhase = "正在准备图层截图";

    const buildText = (): string => {
      const tail = leftSec > 0 ? `预计约 ${leftSec} 秒，请勿操作浏览器、勿切换标签页` : "仍在处理中，请勿操作浏览器";
      return `${currentPhase}，${tail}`;
    };

    return {
      start(phase: string) {
        currentPhase = phase;
        if (typeof ElLoading === "undefined") {
          return;
        }
        if (!loadingInst) {
          loadingInst = ElLoading.service({
            lock: true,
            fullscreen: true,
            background: "rgba(0, 0, 0, 0.72)",
            text: buildText()
          });
          countTimer = setInterval(() => {
            leftSec = Math.max(0, leftSec - 1);
            if (loadingInst?.setText) {
              loadingInst.setText(buildText());
            }
          }, 1000);
        } else if (loadingInst.setText) {
          loadingInst.setText(buildText());
        }
      },
      close() {
        if (countTimer) {
          clearInterval(countTimer);
        }
        loadingInst?.close();
        loadingInst = null;
        countTimer = null;
      }
    };
  },

  notifyStart(): void {
    ElMessage?.info({
      message: `图层合成截图约需 ${CFG.estimateHintSec} 秒，组件多时会更久`,
      duration: 5000
    });
  },

  notifySuccess(): void {
    ElMessage?.success({
      message: "图层截图已保存，请查看下载目录",
      duration: 4000
    });
  },

  notifyError(error: unknown): void {
    const msg = (error instanceof Error ? error.message : null) || "截图失败";
    ElMessage?.error({ message: msg, duration: 5000, showClose: true });
  },

  notifyMissingSnapdom(): void {
    ElMessage?.error({ message: "缺少 @zumer/snapdom" });
  },

  download(dataUrl: string): void {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "layer-composite-capture-" + Date.now() + ".png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// ─────────────────────────────────────────────────────────────

// §9.5 SnapdomCapture — 面板隔离截取（snapdom）
// §9.6 Html2CanvasCapture — 大屏底图截取（html2canvas）
// ─────────────────────────────────────────────────────────────
const Html2CanvasCapture = {
  async toCanvas(element: HTMLElement, options: Html2CanvasOptions = {}): Promise<HTMLCanvasElement | null> {
    if (!element || !html2canvas) {
      return null;
    }

    const { scale = CFG.layerScale, width, height, backgroundColor = CFG.backgroundColor, onClone } = options;

    const h2cOptions: Record<string, unknown> = {
      useCORS: true,
      allowTaint: false,
      backgroundColor: backgroundColor === "transparent" ? null : backgroundColor,
      scale,
      logging: false,
      imageTimeout: 15000
    };
    if (width != null && width > 0) {
      h2cOptions.width = width;
    }
    if (height != null && height > 0) {
      h2cOptions.height = height;
    }
    if (onClone) {
      h2cOptions.onclone = onClone;
    }

    try {
      return await html2canvas(element, h2cOptions);
    } catch (error) {
      Utils.log("warn", "html2canvas 失败", errMsg(error));
      return null;
    }
  }
};

const SnapdomCapture = {
  createAfterClonePlugin(afterCloneFn: (cloneRoot: Document | HTMLElement, liveElement: HTMLElement) => void) {
    return {
      name: "screenwright-layer-capture-patch",
      afterClone(context: { clone: Document | HTMLElement; element: HTMLElement }) {
        try {
          afterCloneFn(context.clone, context.element);
        } catch (error) {
          Utils.log("warn", "snapdom afterClone patch 失败", errMsg(error));
        }
      }
    };
  },

  async toCanvas(element: HTMLElement, options: SnapdomCaptureOptions = {}): Promise<HTMLCanvasElement | null> {
    if (!element || !snapdom) {
      return null;
    }

    const {
      scale = CFG.layerScale,
      width,
      height,
      backgroundColor = "transparent",
      afterCloneFn,
      filter,
      filterMode = "remove"
    } = options;

    const snapOptions: Record<string, unknown> = {
      scale,
      embedFonts: true,
      fast: false,
      backgroundColor: backgroundColor == null ? "transparent" : backgroundColor
    };
    if (width != null && width > 0) {
      snapOptions.width = width;
    }
    if (height != null && height > 0) {
      snapOptions.height = height;
    }
    if (filter) {
      snapOptions.filter = filter;
      snapOptions.filterMode = filterMode;
    }
    if (afterCloneFn) {
      snapOptions.plugins = [this.createAfterClonePlugin(afterCloneFn)];
    }

    try {
      const result = await snapdom(element, snapOptions);
      return await result.toCanvas();
    } catch (error) {
      Utils.log("warn", "snapdom.toCanvas 失败", errMsg(error));
      return null;
    }
  },

  createExcludeFilter(excludeHostIds: Array<number | string> | undefined) {
    const excludeSet = new Set((excludeHostIds || []).map(String));
    return (el: Element): boolean => {
      if (!(el instanceof Element)) {
        return true;
      }
      if (el.closest(".screen-capture-container, .capture-btn")) {
        return false;
      }
      if (el.closest(".ft-panel, .quote-panel")) {
        return false;
      }
      const host = el.closest("[data-id]");
      const hostId = host?.getAttribute("data-id");
      if (hostId && excludeSet.has(String(hostId))) {
        return false;
      }
      return true;
    };
  }
};

// ─────────────────────────────────────────────────────────────

export {
  asHtml,
  CAPTURE_WRAPPER_ATTR,
  CaptureNodeKind,
  CaptureUI,
  CFG,
  ComponentTreeCapture,
  CorsMediaFallback,
  EditorChrome,
  Geometry,
  Html2CanvasCapture,
  LOG,
  SnapdomCapture,
  Utils
};

/** 按 component id 在 viewWrapper 内查找 host 元素 */
export function findHostByComponentId(viewWrapper: HTMLElement, id: string | number): HTMLElement | null {
  return Utils.findHostByComponentId(viewWrapper, id);
}

export type { CaptureComponentItem, DesignRect, DesignSize, OutputBox, RestoreFn };
