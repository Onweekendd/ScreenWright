import { CFG } from "../captureConfig";
import { Geometry, Html2CanvasCapture, SnapdomCapture, Utils } from "../captureUtils";
import { Transform3DCapture } from "../transform3dCapture";
import type {
  CaptureLayer,
  ComponentList,
  DesignRect,
  DesignSize,
  ModuleDescriptor,
  SnapshotMap
} from "../types/captureInternal";
import {
  collectReadySelectors,
  detectSpecialComponentKey,
  findSpecialRasterTarget,
  hostHasSpecialMarker,
  prepareOverflowForCapture
} from "./specialComponentRegistry";
import { type CaptureModuleContext, CaptureModuleStrategyKind, type ICaptureModuleStrategy } from "./types";

const errMsg = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export interface SpecialComponentRasterResult {
  dataUrl: string;
  rect: DOMRect;
}

export interface SpecialComponentStrategyInstance extends ICaptureModuleStrategy {
  hostNeedsRaster(host: HTMLElement): boolean;
  waitHostReady(host: HTMLElement): Promise<void>;
  rasterizeHost(
    host: HTMLElement,
    designRect?: DesignRect,
    componentList?: ComponentList
  ): Promise<SpecialComponentRasterResult | null>;
  buildLayers(
    modules: ModuleDescriptor[],
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList?: ComponentList
  ): Promise<CaptureLayer[]>;
}

export interface SpecialComponentStrategyDeps {
  prepareWrapper(viewWrapper: HTMLElement, designSize: DesignSize): () => void;
  waitImagesReady(root: HTMLElement, timeoutMs?: number): Promise<void>;
  isGroupModule(ctx: CaptureModuleContext): boolean;
  isPanelModule(ctx: CaptureModuleContext): boolean;
  buildSnapshotsAsync?(root: HTMLElement, componentList: ComponentList): Promise<SnapshotMap>;
  applyLiveMediaPatches?(root: HTMLElement, snapshots: SnapshotMap): () => void;
  applyCrossOriginOnLive?(root: HTMLElement): () => void;
  applyMediaPatchesOnClone?(clonedDoc: Document | HTMLElement, snapshots: SnapshotMap, liveRoot?: HTMLElement): void;
}

function applyCrossOriginOnLiveFallback(root: HTMLElement) {
  const stash: Array<{ img: HTMLImageElement; crossOrigin: string | null }> = [];
  root.querySelectorAll("img[src]").forEach((node) => {
    if (!(node instanceof HTMLImageElement)) {
      return;
    }
    const img = node;
    if (img.complete && img.naturalWidth > 0) {
      return;
    }
    stash.push({ img, crossOrigin: img.crossOrigin });
    if (!img.crossOrigin) {
      img.crossOrigin = "anonymous";
    }
  });
  return () => {
    stash.forEach(({ img, crossOrigin }) => {
      img.crossOrigin = crossOrigin;
    });
  };
}

async function waitSelectorNodesReady(host: HTMLElement, selectors: string[], timeoutMs = 8000) {
  const pending = selectors.filter((sel) => {
    try {
      return !!host.querySelector(sel);
    } catch {
      return false;
    }
  });
  if (!pending.length) {
    return;
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ready = pending.every((sel) => {
      const nodes = host.querySelectorAll(sel);
      if (!nodes.length) {
        return false;
      }
      return Array.from(nodes).some((node) => Utils.isVisible(node as HTMLElement));
    });
    if (ready) {
      return;
    }
    await Utils.sleep(120);
  }
}

async function tryCaptureHostCanvases(
  host: HTMLElement,
  outW: number,
  outH: number
): Promise<HTMLCanvasElement | null> {
  const canvases = Array.from(host.querySelectorAll("canvas")).filter((c) => Utils.isVisible(c));
  if (!canvases.length) {
    return null;
  }

  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(outW * CFG.layerScale));
  out.height = Math.max(1, Math.round(outH * CFG.layerScale));
  const ctx = out.getContext("2d");
  if (!ctx) {
    return null;
  }

  let drew = false;
  for (const canvas of canvases) {
    try {
      const rect = canvas.getBoundingClientRect();
      const hostRect = host.getBoundingClientRect();
      const x = ((rect.left - hostRect.left) / hostRect.width) * out.width;
      const y = ((rect.top - hostRect.top) / hostRect.height) * out.height;
      const w = (rect.width / hostRect.width) * out.width;
      const h = (rect.height / hostRect.height) * out.height;
      ctx.drawImage(canvas, x, y, w, h);
      drew = true;
    } catch {
      /* WebGL 跨域污染等 */
    }
  }

  return drew && Utils.hasCanvasContent(out) ? out : null;
}

function fitCanvasToDesignSize(canvas: HTMLCanvasElement, designW: number, designH: number): HTMLCanvasElement {
  const tw = Math.max(1, Math.round(designW * CFG.layerScale));
  const th = Math.max(1, Math.round(designH * CFG.layerScale));
  if (canvas.width === tw && canvas.height === th) {
    return canvas;
  }
  const out = document.createElement("canvas");
  out.width = tw;
  out.height = th;
  const ctx = out.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  ctx.drawImage(canvas, 0, 0, tw, th);
  return out;
}

async function captureTargetToCanvas(
  target: HTMLElement,
  host: HTMLElement,
  outW: number,
  outH: number,
  snapshots: SnapshotMap,
  deps: SpecialComponentStrategyDeps,
  componentList: ComponentList | undefined,
  useFreeze3d: boolean
): Promise<HTMLCanvasElement | null> {
  let restore3d = () => {};
  if (useFreeze3d) {
    restore3d = Transform3DCapture.freezeForLiveCapture(host);
    await Utils.waitFrames(2);
  }

  const afterCloneFn = (cloneRoot: Document | HTMLElement, liveEl: HTMLElement) => {
    if (deps.applyMediaPatchesOnClone && snapshots.size) {
      deps.applyMediaPatchesOnClone(cloneRoot, snapshots, liveEl || host);
    }
    Transform3DCapture.patchInClone(cloneRoot, host, target);
  };

  try {
    let canvas = await SnapdomCapture.toCanvas(target, {
      scale: CFG.layerScale,
      backgroundColor: "transparent",
      afterCloneFn
    });
    if (!canvas || Utils.isCanvasMostlyBlank(canvas)) {
      canvas = await Html2CanvasCapture.toCanvas(target, {
        scale: CFG.layerScale,
        backgroundColor: null,
        onClone: (clonedDoc) => {
          afterCloneFn(clonedDoc, target);
        }
      });
    }
    if (!canvas) {
      return null;
    }
    canvas = fitCanvasToDesignSize(canvas, outW, outH);
    return canvasHasContent(canvas, null) ? canvas : null;
  } finally {
    restore3d();
  }
}

function canvasHasContent(canvas: HTMLCanvasElement, marker: string | null) {
  if (marker === "particles") {
    return Utils.hasCanvasContent(canvas);
  }
  return !Utils.isCanvasMostlyBlank(canvas);
}

async function waitMarkerImagesReady(
  host: HTMLElement,
  waitImagesReady: (root: HTMLElement, ms?: number) => Promise<void>
) {
  const selectors = collectReadySelectors(host);
  if (selectors.length) {
    await waitSelectorNodesReady(host, selectors, 6000);
  }

  const imgSelectors = selectors.length ? selectors : ["img[src]"];
  const imgEls = imgSelectors
    .flatMap((sel) => Array.from(host.querySelectorAll(sel)))
    .filter((n): n is HTMLImageElement => n instanceof HTMLImageElement && !!n.src);
  if (imgEls.length) {
    await Promise.race([
      Promise.all(
        imgEls.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve();
                return;
              }
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
            })
        )
      ),
      Utils.sleep(CFG.imageLoadTimeout)
    ]);
  }
  await waitImagesReady(host, CFG.imageLoadTimeout);
}

export function createSpecialComponentStrategy(deps: SpecialComponentStrategyDeps): SpecialComponentStrategyInstance {
  const strategy = {
    kind: CaptureModuleStrategyKind.SPECIAL as const,

    matches(ctx: CaptureModuleContext) {
      if (deps.isPanelModule(ctx) || deps.isGroupModule(ctx)) {
        return false;
      }
      return hostHasSpecialMarker(ctx.module.host);
    },

    hostNeedsRaster(host: HTMLElement) {
      return hostHasSpecialMarker(host);
    },

    async waitHostReady(host: HTMLElement) {
      const key = detectSpecialComponentKey(host);

      if (key === "particles") {
        await waitSelectorNodesReady(host, [".particles-js-canvas-el", ".ext canvas", ".simple-particle canvas"], 8000);
        await Utils.sleep(500);
      }

      if (key === "imagesList3d") {
        await waitSelectorNodesReady(host, [".imagesList3d .spin-point", ".drag-container .spin-point"], 8000);
        const deadline = Date.now() + 6000;
        while (Date.now() < deadline) {
          const points = host.querySelectorAll(".spin-point");
          const ready =
            points.length > 0 &&
            Array.from(points).every((p) => {
              const t = getComputedStyle(p).transform;
              return t && t !== "none";
            });
          if (ready) {
            break;
          }
          await Utils.sleep(120);
        }
        await Utils.sleep(300);
      }

      if (key === "swiper" || key === "swiperCard") {
        await Utils.sleep(400);
      }

      if (key === "carouselImageV2") {
        await waitSelectorNodesReady(host, ["#wowslider-container", ".ws_images li"], 5000);
      }

      await waitMarkerImagesReady(host, deps.waitImagesReady);
      await Utils.waitFrames(3);
    },

    getRasterTargets(host: HTMLElement, designRect?: DesignRect) {
      const shapeBox = Geometry.getShapeBox(host);
      const inner = findSpecialRasterTarget(host);
      const ordered = [shapeBox, host, inner].filter((el): el is HTMLElement => !!el && Utils.isVisible(el));
      const unique: HTMLElement[] = [];
      ordered.forEach((el) => {
        if (!unique.includes(el)) {
          unique.push(el);
        }
      });

      const ref = shapeBox || host;
      const refRect = ref.getBoundingClientRect();
      const w = Math.max(1, Math.round(designRect?.width || refRect.width));
      const h = Math.max(1, Math.round(designRect?.height || refRect.height));
      return { targets: unique, w, h };
    },

    async rasterizeHost(host: HTMLElement, designRect?: DesignRect, componentList?: ComponentList) {
      if (!host || !Utils.isVisible(host)) {
        return null;
      }

      let restoreOverflow = () => {};
      let restoreLive = () => {};
      let restoreCors = () => {};
      let snapshots: SnapshotMap = new Map();

      try {
        await strategy.waitHostReady(host);
        restoreOverflow = prepareOverflowForCapture(host);

        if (deps.applyCrossOriginOnLive) {
          restoreCors = deps.applyCrossOriginOnLive(host);
        } else {
          restoreCors = applyCrossOriginOnLiveFallback(host);
        }

        if (deps.buildSnapshotsAsync && componentList) {
          snapshots = await deps.buildSnapshotsAsync(host, componentList);
          if (deps.applyLiveMediaPatches) {
            restoreLive = deps.applyLiveMediaPatches(host, snapshots);
          }
        }

        await Utils.waitFrames(2);

        const { targets, w, h } = strategy.getRasterTargets(host, designRect);
        const marker = detectSpecialComponentKey(host);

        let canvas: HTMLCanvasElement | null = null;

        if (!canvas && marker === "imagesList3d") {
          for (const useFreeze of [true, false]) {
            const list3d = host.querySelector(".imagesList3d");
            if (list3d instanceof HTMLElement) {
              canvas = await captureTargetToCanvas(list3d, host, w, h, snapshots, deps, componentList, useFreeze);
              if (canvas && canvasHasContent(canvas, marker)) {
                break;
              }
              canvas = null;
            }
          }
        }

        if (!canvas && (marker === "particles" || marker === "turnPage")) {
          canvas = await tryCaptureHostCanvases(host, w, h);
        }

        if (!canvas) {
          for (const useFreeze of [true, false]) {
            for (const target of targets) {
              canvas = await captureTargetToCanvas(target, host, w, h, snapshots, deps, componentList, useFreeze);
              if (canvas && canvasHasContent(canvas, marker)) {
                break;
              }
              canvas = null;
            }
            if (canvas) {
              break;
            }
          }
        }

        if (canvas) {
          canvas = fitCanvasToDesignSize(canvas, w, h);
        }

        if (!canvas || !canvasHasContent(canvas, marker)) {
          Utils.log("warn", "特殊组件栅格空白", host.getAttribute("data-id"), marker);
          return null;
        }

        const dataUrl = Utils.safeCanvasToDataUrl(canvas, "image/png");
        if (!dataUrl) {
          return null;
        }

        Utils.log("info", "特殊组件栅格成功", host.getAttribute("data-id"), marker, w + "x" + h);
        return { dataUrl, rect: host.getBoundingClientRect() };
      } catch (error) {
        Utils.log("warn", "特殊组件栅格失败", host.getAttribute("data-id"), errMsg(error));
        return null;
      } finally {
        restoreLive();
        restoreCors();
        restoreOverflow();
      }
    },

    async buildLayers(
      modules: ModuleDescriptor[],
      viewWrapper: HTMLElement,
      designSize: DesignSize,
      componentList?: ComponentList
    ) {
      const specialMods = modules.filter((m) => hostHasSpecialMarker(m.host));
      if (!specialMods.length) {
        return [];
      }

      const restoreWrapper = deps.prepareWrapper(viewWrapper, designSize);
      const layers: CaptureLayer[] = [];
      try {
        await Utils.waitFrames(2);
        for (const mod of specialMods) {
          const result = await strategy.rasterizeHost(mod.host, mod.designRect, componentList);
          if (!result?.dataUrl) {
            Utils.log("warn", "特殊组件独立层失败", mod.id, detectSpecialComponentKey(mod.host));
            continue;
          }
          layers.push({
            id: String(mod.id) + "-special",
            kind: "dom",
            zIndex: mod.zIndex,
            designRect: mod.designRect,
            dataUrl: result.dataUrl
          });
        }
      } finally {
        restoreWrapper();
      }
      Utils.log(
        "info",
        "特殊组件独立层:",
        layers.length,
        specialMods.map((m) => m.id + ":" + (detectSpecialComponentKey(m.host) || "?"))
      );
      return layers;
    },

    async capture(ctx: CaptureModuleContext) {
      const layers = await strategy.buildLayers([ctx.module], ctx.viewWrapper, ctx.designSize, ctx.componentList);
      return layers.length ? layers : null;
    }
  };

  return strategy as SpecialComponentStrategyInstance;
}

/** 注册后赋值，供 Readiness / ScreenCompositor / PanelCapture 直接引用 */
export let SpecialComponentStrategy: SpecialComponentStrategyInstance | null = null;

export function registerSpecialComponentStrategy(instance: SpecialComponentStrategyInstance) {
  SpecialComponentStrategy = instance;
}

/** 面板 / 其他模块内嵌特殊组件时复用栅格 */
export async function rasterizeSpecialHostIfNeeded(
  host: HTMLElement,
  designRect: DesignRect | undefined,
  componentList: ComponentList | undefined
) {
  if (!SpecialComponentStrategy || !hostHasSpecialMarker(host)) {
    return null;
  }
  return SpecialComponentStrategy.rasterizeHost(host, designRect, componentList);
}
