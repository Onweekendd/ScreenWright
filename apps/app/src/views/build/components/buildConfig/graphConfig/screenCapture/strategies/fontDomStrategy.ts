import type { CaptureLayer, ComponentList, DesignSize, ModuleDescriptor } from "../types/captureInternal";
import { FontDomCapture } from "./fontDomCapture";
import { type CaptureModuleContext, CaptureModuleStrategyKind, type ICaptureModuleStrategy } from "./types";
import { hostHasVideo } from "./videoRegistry";

export interface FontDomStrategyInstance extends ICaptureModuleStrategy {
  hostNeedsTextPatch(host: HTMLElement): boolean;
}

export interface FontDomStrategyDeps {
  captureTextComponent(
    module: ModuleDescriptor,
    viewWrapper: HTMLElement,
    designSize: DesignSize,
    componentList: ComponentList
  ): Promise<CaptureLayer | null>;
  isPanelModule(ctx: CaptureModuleContext): boolean;
  isGroupModule(ctx: CaptureModuleContext): boolean;
  hostHasSpecialMarker(host: HTMLElement): boolean;
}

export function createFontDomStrategy(deps: FontDomStrategyDeps): FontDomStrategyInstance {
  return {
    kind: CaptureModuleStrategyKind.FONT_DOM,

    hostNeedsTextPatch(host: HTMLElement) {
      return FontDomCapture.hostNeedsFlatten(host) || FontDomCapture.isTextPrimaryHost(host);
    },

    matches(ctx: CaptureModuleContext) {
      if (deps.isPanelModule(ctx) || deps.isGroupModule(ctx)) {
        return false;
      }
      if (deps.hostHasSpecialMarker(ctx.module.host)) {
        return false;
      }
      if (hostHasVideo(ctx.module.host) && ctx.module.primaryMode !== "composite") {
        return false;
      }
      return FontDomCapture.isTextPrimaryHost(ctx.module.host);
    },

    async capture(ctx) {
      const layer = await deps.captureTextComponent(ctx.module, ctx.viewWrapper, ctx.designSize, ctx.componentList);
      return layer ? [layer] : null;
    }
  };
}

export let FontDomStrategy: FontDomStrategyInstance | null = null;

export function registerFontDomStrategy(instance: FontDomStrategyInstance) {
  FontDomStrategy = instance;
}
