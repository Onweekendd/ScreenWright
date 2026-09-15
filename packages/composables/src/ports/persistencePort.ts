import type { ComponentType } from "@screenwright/types";

/**
 * useUpdateInstance/useDataFilter(views/build) 共同依赖的唯一真正 IO 边界：
 * 保存图层(saveLayersByType，内部耦合状态动画同步/HTTP/DOM reload，整体作为一个端口注入，不拆解)
 * 和保存大屏全局配置(updateLargeScreen，原生 HTTP)。
 *
 * 部署顺序要求：主应用必须在挂载任何触发保存的组件之前调用一次 initDataFilterPersistence。
 */

/** 与 app 侧 buildRender/utils.ts 的 UpdateHistoryTypeEnum 字符串值保持一致的镜像枚举 */
export enum UpdateHistoryTypeEnum {
  ADD = "ADD",
  UPDATE = "UPDATE",
  SKIP = "SKIP",
  DELETE = "DELETE"
}

export type SaveLayersByTypeFn = (
  component: ComponentType,
  isDynamicPanel: boolean,
  options?: {
    fullUpdateGroup?: boolean;
    fullUpdateDynamicPanel?: boolean;
    updateHistoryType?: UpdateHistoryTypeEnum;
    isCache?: boolean;
    showLoading?: boolean;
  }
) => Promise<any>;

export type UpdateLargeScreenFn = (data: Record<string, any>) => Promise<any>;

export interface DataFilterPersistenceImpls {
  saveLayersByType: SaveLayersByTypeFn;
  updateLargeScreen: UpdateLargeScreenFn;
}

let impls: DataFilterPersistenceImpls | null = null;

/** 由主应用在启动时调用一次，注入保存图层/保存大屏配置的真实实现。 */
export function initDataFilterPersistence(fn: DataFilterPersistenceImpls): void {
  impls = fn;
}

/** 内部调用的入口，转发给主应用注入的实现。 */
export function getDataFilterPersistence(): DataFilterPersistenceImpls {
  if (!impls) {
    throw new Error(
      "[@screenwright/composables] 保存图层/保存大屏配置尚未初始化，请在应用启动时调用 initDataFilterPersistence() 注入实现"
    );
  }
  return impls;
}
