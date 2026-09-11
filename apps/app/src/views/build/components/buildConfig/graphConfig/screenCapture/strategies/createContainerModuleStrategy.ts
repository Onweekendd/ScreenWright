import type { CaptureLayer, ComponentList, DesignSize, ModuleDescriptor } from "../types/captureInternal";
import type { CaptureModuleStrategyKind } from "./types";
import { type CaptureModuleContext, type ICaptureModuleStrategy } from "./types";

type CaptureLayerFn = (
  module: ModuleDescriptor,
  viewWrapper: HTMLElement,
  designSize: DesignSize,
  componentList: ComponentList
) => Promise<CaptureLayer | null>;

export interface ContainerModuleStrategyOptions {
  kind: CaptureModuleStrategyKind;
  matches?: (ctx: CaptureModuleContext) => boolean;
  buildLayer?: CaptureLayerFn;
  capturePerComponent?: CaptureLayerFn;
  /** 组组件：buildLayer 失败时回退逐块 html2canvas */
  fallbackToPerComponent?: boolean;
}

/** 面板 / 组 / 普通 DOM 策略共用工厂 */
export function createContainerModuleStrategy(options: ContainerModuleStrategyOptions): ICaptureModuleStrategy {
  const { kind, matches, buildLayer, capturePerComponent, fallbackToPerComponent } = options;

  return {
    kind,

    matches(ctx) {
      return matches ? matches(ctx) : true;
    },

    async capture(ctx) {
      if (buildLayer) {
        const layer = await buildLayer(ctx.module, ctx.viewWrapper, ctx.designSize, ctx.componentList);
        if (layer) {
          return [layer];
        }
        if (!fallbackToPerComponent || !capturePerComponent) {
          return null;
        }
      }

      if (capturePerComponent) {
        const layer = await capturePerComponent(ctx.module, ctx.viewWrapper, ctx.designSize, ctx.componentList);
        return layer ? [layer] : null;
      }

      return null;
    }
  };
}
