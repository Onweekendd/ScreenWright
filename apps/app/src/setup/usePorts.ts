import type { Router } from "vue-router";

import { initUsePorts } from "@screenwright/composables";

import { executeSql, getCsvData, queryAPIData } from "@/api/dataSource";
import { updateLargeScreen } from "@/api/library";
import { ActionStrategyFactory } from "@/hooks/eventHandling/actionStrategies";
import { useBluePrint } from "@/hooks/useBluePrint";
import { requestWithCache } from "@/utils/cacheService";
import { toAssetsPayload } from "@/utils/materialUpload";
import { serverRequest } from "@/utils/serverService";
import { request } from "@/utils/service";
import { registerFte as registerFteImpl } from "@/utils/utils";
import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import { saveLayersByType } from "@/views/build/components/buildRender/utils";
import SelectAssets from "@/views/build/components/buildTabs/selectAssets/index.vue";

/**
 * @screenwright/composables 的注入收敛为一次 initUsePorts 调用：基础设施（router/http）+ 业务端口
 * （数据过滤策略/蓝图追加事件/动作策略/UE4通信/状态动画/保存图层与大屏配置/素材选择弹窗）。
 * 以后 use 包/物料包加后端请求，直接 `import { request } from "@screenwright/composables"`，本文件不动。
 *
 * 主入口（main.ts）与导出入口（exportEntry）各自 createRouter，都必须在挂载前调用一次，
 * 抽到此处共享，避免两个入口各持一份注入而漂移。
 */
export const setupUsePorts = (router: Router) => {
  initUsePorts({
    router,
    http: { request, requestWithCache, serverRequest },
    filterDataApi: { executeSql, queryAPIData, getCsvData },
    dataFilterPersistence: {
      saveLayersByType: (component, isDynamicPanel, options) =>
        saveLayersByType(component, isDynamicPanel, options as any),
      updateLargeScreen
    },
    baseDataExtraEvents: (id) => useBluePrint().eventListMap.value[id] || [],
    actionStrategyExecutor: (actionType, params) => {
      ActionStrategyFactory.getStrategy(actionType)?.execute(params);
    },
    statusAnimationTrigger: (panelStatusAnimationId, panelStatusId) =>
      useStatusAnimation().triggerStatusAnimationByAction(panelStatusAnimationId, panelStatusId),
    assetsPicker: { component: SelectAssets, toPayload: (validated) => toAssetsPayload(validated) }
  });
};
