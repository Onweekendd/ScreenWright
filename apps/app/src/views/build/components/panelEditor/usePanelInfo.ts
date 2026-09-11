import { createGlobalState } from "@vueuse/core";

import { useCommonPanelInfo } from "../common/useCommonPanelInfo";
import { usePanelData } from "./usePanelData";

/**
 * 面板业务逻辑管理 hooks
 * 专门负责面板相关的业务逻辑处理，依赖数据管理 hooks
 */
export const usePanelInfo = createGlobalState(() => {
  // 使用数据管理 hooks
  const dataHooks = usePanelData();

  // 使用通用业务逻辑 hooks，配置为动态面板模式
  const commonInfoHooks = useCommonPanelInfo({
    componentMapKey: "allComponentMap",
    paramKey: "cid",
    commonDataHooks: dataHooks
  });

  return {
    // 从数据层导出的状态和方法
    ...dataHooks,
    // 从通用业务层导出的方法
    ...commonInfoHooks
  };
});
