import { BaseExporter, Observability } from "@mastra/observability";

/** Mastra 要求每个 observability 实例至少有一个导出器；这个什么都不导出。 */
class DiscardExporter extends BaseExporter {
  name = "discard";

  protected async _exportTracingEvent(): Promise<void> {}
}

/**
 * 只为录制分泳道保留追踪：span 不落库也不上云。
 *
 * 录制模块靠当前 span 的 metadata.threadId 区分「这一步是主 agent 还是哪次委派的子 agent 跑的」
 * （见 record/branch-resolver.ts）。不配 observability 时 Mastra 用 NoOp 实现，拿不到 span，
 * agent-trace 的执行泳道就全部挤成一条。
 */
export const createObservability = (): Observability =>
  new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [new DiscardExporter()]
      }
    }
  });
