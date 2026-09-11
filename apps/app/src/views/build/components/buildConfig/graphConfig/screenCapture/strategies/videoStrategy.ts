import { Utils } from "../captureUtils";
import type { CaptureLayer, ComponentList, DesignSize, ModuleDescriptor } from "../types/captureInternal";
import { type CaptureModuleContext, CaptureModuleStrategyKind, type ICaptureModuleStrategy } from "./types";
import {
  detectVideoKind,
  hostHasVideo,
  isStreamVideoHost,
  isVideoPrimaryHost,
  VideoKind,
  type VideoKindType
} from "./videoRegistry";

export interface VideoCaptureEngine {
  buildStreamLayer(descriptor: ModuleDescriptor, designSize: DesignSize): CaptureLayer | null;
  buildNormalLayer(
    descriptor: ModuleDescriptor,
    designSize: DesignSize,
    componentList: ComponentList
  ): Promise<CaptureLayer | null>;
  captureFtVideoLayer(
    descriptor: ModuleDescriptor,
    designSize: DesignSize,
    componentList: ComponentList
  ): Promise<CaptureLayer | null>;
  captureOpenVideoLayer(
    descriptor: ModuleDescriptor,
    designSize: DesignSize,
    componentList: ComponentList
  ): Promise<CaptureLayer | null>;
  captureOtherVideoLayer(
    descriptor: ModuleDescriptor,
    designSize: DesignSize,
    componentList: ComponentList
  ): Promise<CaptureLayer | null>;
  waitReady?(root: HTMLElement): Promise<void>;
  hideForLiveCapture?(root: HTMLElement): () => void;
  hideInClone?(clonedDoc: Document | HTMLElement): void;
}

export interface VideoStrategyInstance extends ICaptureModuleStrategy {
  detectKind(host: HTMLElement): VideoKindType | null;
  buildLayer(
    descriptor: ModuleDescriptor,
    designSize: DesignSize,
    componentList: ComponentList
  ): Promise<CaptureLayer | null>;
  buildLayers(
    modules: ModuleDescriptor[],
    designSize: DesignSize,
    componentList: ComponentList
  ): Promise<CaptureLayer[]>;
}

export interface VideoStrategyDeps {
  engine: VideoCaptureEngine;
  isPanelModule(ctx: CaptureModuleContext): boolean;
  isGroupModule(ctx: CaptureModuleContext): boolean;
}

async function routeCaptureByKind(
  kind: VideoKindType,
  descriptor: ModuleDescriptor,
  designSize: DesignSize,
  componentList: ComponentList,
  engine: VideoCaptureEngine
): Promise<CaptureLayer | null> {
  switch (kind) {
    case VideoKind.FT_VIDEO:
      return engine.captureFtVideoLayer(descriptor, designSize, componentList);
    case VideoKind.OPEN_VIDEO:
      return engine.captureOpenVideoLayer(descriptor, designSize, componentList);
    case VideoKind.PIXEL_STREAM:
      return engine.buildStreamLayer(descriptor, designSize);
    case VideoKind.PLAIN:
      return engine.buildNormalLayer(descriptor, designSize, componentList);
    case VideoKind.OTHER:
    default:
      return engine.captureOtherVideoLayer(descriptor, designSize, componentList);
  }
}

export function createVideoStrategy(deps: VideoStrategyDeps): VideoStrategyInstance {
  const strategy = {
    kind: CaptureModuleStrategyKind.VIDEO as const,

    matches(ctx: CaptureModuleContext) {
      if (deps.isPanelModule(ctx) || deps.isGroupModule(ctx)) {
        return false;
      }
      const host = ctx.module.host;
      if (!hostHasVideo(host)) {
        return false;
      }
      return (
        isVideoPrimaryHost(host) || ctx.module.primaryMode === "streamVideo" || ctx.module.primaryMode === "normalVideo"
      );
    },

    detectKind(host: HTMLElement) {
      return detectVideoKind(host);
    },

    async buildLayer(descriptor: ModuleDescriptor, designSize: DesignSize, componentList: ComponentList) {
      const kind = detectVideoKind(descriptor.host);
      if (!kind) {
        return null;
      }
      Utils.log("info", "video 策略", descriptor.id, kind);
      return routeCaptureByKind(kind, descriptor, designSize, componentList, deps.engine);
    },

    async buildLayers(modules: ModuleDescriptor[], designSize: DesignSize, componentList: ComponentList) {
      const layers: CaptureLayer[] = [];
      for (const mod of modules) {
        if (!hostHasVideo(mod.host)) {
          continue;
        }
        const layer = await strategy.buildLayer(mod, designSize, componentList);
        if (layer) {
          layers.push(layer);
        }
      }
      return layers;
    },

    async capture(ctx: CaptureModuleContext) {
      const layer = await strategy.buildLayer(ctx.module, ctx.designSize, ctx.componentList);
      return layer ? [layer] : null;
    }
  };

  return strategy as VideoStrategyInstance;
}

export let VideoStrategy: VideoStrategyInstance | null = null;

export function registerVideoStrategy(instance: VideoStrategyInstance) {
  VideoStrategy = instance;
}

export function isVideoModuleHost(host: HTMLElement): boolean {
  return hostHasVideo(host) && (isVideoPrimaryHost(host) || isStreamVideoHost(host));
}
