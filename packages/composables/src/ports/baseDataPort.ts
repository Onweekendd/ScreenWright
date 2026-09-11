import type { Event } from "@screenwright/types";

/**
 * useBaseData 触发事件（handleEvents/handleEventAndCallbackEvent）与终端编码通信（handleEncode）
 * 都直接调用 @screenwright/composables 自身的 useEvent/useEncodeEvent（Phase 3 已下沉，同包内直接调用，不再需要注入）。
 * 唯一仍留在 app 的业务边界是可视化编排追加的事件列表（useBluePrint 的 eventListMap，依赖后端 HTTP 拉取），
 * 通过这个端口注入。
 *
 * 部署顺序要求：如果需要蓝图追加事件，主应用应在挂载任何使用 useBaseData 的组件之前调用一次
 * initBaseDataExtraEvents；不调用则蓝图追加事件视为空列表。
 */
export type GetExtraEventsFn = (id: string | number) => Event[];

let getExtraEventsImpl: GetExtraEventsFn | null = null;

/** 由主应用在启动时调用一次，注入蓝图（可视化编排）追加事件的真实实现。 */
export function initBaseDataExtraEvents(fn: GetExtraEventsFn): void {
  getExtraEventsImpl = fn;
}

/** useBaseData 内部调用的入口：未注入时返回空列表，不强制要求应用一定接入蓝图能力。 */
export function getBaseDataExtraEvents(id: string | number): Event[] {
  return getExtraEventsImpl?.(id) ?? [];
}
