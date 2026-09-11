import { Utils } from "../captureUtils";
import type { CaptureLayer } from "../types/captureInternal";
import { type CaptureModuleContext, CaptureModuleStrategyKind, type ICaptureModuleStrategy } from "./types";

let strategies: ICaptureModuleStrategy[] = [];
let domFallback: ICaptureModuleStrategy | null = null;

export const CaptureStrategyFactory = {
  /** 按优先级注册：面板 → 组 → 特殊 → 视频 → 文本 → 普通 DOM */
  register(list: ICaptureModuleStrategy[]) {
    strategies = list.slice();
    domFallback = strategies.find((s) => s.kind === CaptureModuleStrategyKind.DOM) ?? null;
  },

  resolve(ctx: CaptureModuleContext): ICaptureModuleStrategy {
    for (const strategy of strategies) {
      if (strategy.kind === CaptureModuleStrategyKind.DOM) {
        continue;
      }
      if (strategy.matches(ctx)) {
        return strategy;
      }
    }
    return domFallback ?? strategies[strategies.length - 1];
  },

  async captureModule(ctx: CaptureModuleContext): Promise<CaptureLayer[] | null> {
    const strategy = this.resolve(ctx);
    Utils.log("info", "模块策略", ctx.module.id, strategy.kind);
    const result = await strategy.capture(ctx);
    if (!result) {
      return null;
    }
    return Array.isArray(result) ? result : [result];
  }
};
