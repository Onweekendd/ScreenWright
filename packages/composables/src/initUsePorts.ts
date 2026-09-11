import type { Router } from "vue-router";

import type { FilterDataApiImpls } from "./filter/ports";
import { initFilterDataApi } from "./filter/ports";
import type { GetExtraEventsFn } from "./ports/baseDataPort";
import { initBaseDataExtraEvents } from "./ports/baseDataPort";
import type { ActionStrategyExecutorFn, SendUE4MessageFn, StatusAnimationTriggerFn } from "./ports/eventPort";
import {
  initActionStrategyExecutor,
  initRouter,
  initSendUE4Message,
  initStatusAnimationTrigger
} from "./ports/eventPort";
import type { HttpPortImpls } from "./ports/httpPort";
import { initHttpPort } from "./ports/httpPort";
import type { DataFilterPersistenceImpls } from "./ports/persistencePort";
import { initDataFilterPersistence } from "./ports/persistencePort";
import type { AssetsPickerImpl } from "./ports/uploadPort";
import { initAssetsPicker } from "./ports/uploadPort";

export interface UsePortsConfig {
  router: Router;
  http: HttpPortImpls;
  filterDataApi: FilterDataApiImpls;
  dataFilterPersistence: DataFilterPersistenceImpls;
  baseDataExtraEvents: GetExtraEventsFn;
  actionStrategyExecutor: ActionStrategyExecutorFn;
  sendUE4Message: SendUE4MessageFn;
  statusAnimationTrigger: StatusAnimationTriggerFn;
  assetsPicker: AssetsPickerImpl;
}

/**
 * 端口聚合入口：一次调用完成 @screenwright/composables 全部端口注入。
 * 部署顺序：基础设施（router / http）优先注入，再注入业务端口——
 * 业务端口内部的调用点（组件渲染、事件触发）可能同步依赖 router / http 已就绪。
 * 各 initXxx 仍单独导出，供精细控制或测试用。
 */
export function initUsePorts(config: UsePortsConfig): void {
  initRouter(config.router);
  initHttpPort(config.http);

  initFilterDataApi(config.filterDataApi);
  initDataFilterPersistence(config.dataFilterPersistence);
  initBaseDataExtraEvents(config.baseDataExtraEvents);
  initActionStrategyExecutor(config.actionStrategyExecutor);
  initSendUE4Message(config.sendUE4Message);
  initStatusAnimationTrigger(config.statusAnimationTrigger);
  initAssetsPicker(config.assetsPicker);
}
