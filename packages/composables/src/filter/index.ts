/**
 * 数据源策略注册 + 过滤运行器再导出。
 *
 * 运行器本身（原本定义在这里的 `FilterData`）已下沉为 @screenwright/core 的 `FilterRunner`——
 * Node 侧也要真跑过滤器（Screenwright 后端算过滤结果、eval 验 agent 写的 dataFormatter 对不对），
 * 运行器不能留在依赖 Vue 的包里。
 *
 * 于是这里只剩两件事：
 *   1. 把需要真实 IO / 长连接的数据源策略注册进 core —— core 只内置零 IO 的 StaticDataFilter
 *   2. 以原名再导出，保持既有 import 路径与公开 API 不变（`export * from "./filter"`）
 */
import { registerFilterStrategy } from "@screenwright/core";
import { DataType } from "@screenwright/types";

import { apiFilter } from "./apiFilter";
import { csvFilter } from "./csvFilter";
import { sqlFilter } from "./sqlFilter";
import { WebsocketFilter } from "./websocketFilter";

// STATIC / IOT 已由 core 内置，不在此重复注册；未注册的 dataType 由 core 退回
// StaticDataFilter，与下沉前 getDataTypeStrategy 的兜底行为一致。
//
// 注意 websocket：core 不认识 WebsocketFilter，它按形状（是否提供 setupSubscription）
// 决定要不要先建订阅，所以这里注册进去就够，不必再告诉 core 它特殊。
registerFilterStrategy(DataType.SQL, () => new sqlFilter());
registerFilterStrategy(DataType.API, () => new apiFilter());
registerFilterStrategy(DataType.CSV, () => new csvFilter());
registerFilterStrategy(DataType.WEBSOCKET, () => WebsocketFilter.getInstance());

export { apiFilter } from "./apiFilter";
export { BaseFilter } from "./baseFilter";
export { csvFilter } from "./csvFilter";
export { initFilterDataApi } from "./ports";
export { sqlFilter } from "./sqlFilter";
export { staticDataFilter } from "./staticDataFilter";
export type { WebsocketConfigData } from "./utils/WebSocketConnection";
export { WebSocketConnection, WebSocketManager } from "./utils/WebSocketManager";
export { WebsocketFilter } from "./websocketFilter";
/** 原 use 侧的 FilterData，现为 core 的 FilterRunner；名字保留，调用方零改动。 */
export { FilterRunner as FilterData } from "@screenwright/core";
