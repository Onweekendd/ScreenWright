import type { BaseEntity } from "@/model/BaseEntity";
import type {
  LayersAggReq,
  ModuleInfo,
  ModuleInfoRes,
  ScreenModuleReq,
  ScreenModuleRes,
  updateLayersAggReq
} from "@/model/Library";
import { serverRequestWithCache } from "@/utils/cacheService";
import { BaseName } from "@/utils/config";
import { serverRequest } from "@/utils/serverService";
import { UpdateHistoryTypeEnum } from "@/views/build/components/buildRender/hooks/useAction";

// 组件模块 / 图层 / 大屏更新已回落 Screenwright（chatBI / 知识库已移除）
export const getModuleInfoList = (params?: { current?: number; size?: number; name?: string }) =>
  serverRequest<
    BaseEntity<{
      records: ModuleInfo[];
    }>
  >({
    url: `${BaseName.System}/module/list`,
    method: "POST",
    data: { current: params?.current || 1, size: params?.size || 200, name: params?.name || "" }
  });

/**
 * @method 保存图层 (缓存)
 * @param {LayersAggReq} data - 保存图层数据
 * @param {boolean} showLoading - 是否显示 loading，默认为 false
 * @param {UpdateHistoryTypeEnum} updateHistoryType - 历史记录更新类型，默认为 UPDATE
 * @returns {Promise<BaseEntity<{config: string, moduleId: number}>>}
 */
export const saveLayersAgg = (
  data: LayersAggReq,
  showLoading = false,
  updateHistoryType: UpdateHistoryTypeEnum = UpdateHistoryTypeEnum.UPDATE
) =>
  serverRequestWithCache<
    BaseEntity<{
      config: string;
      moduleId: number;
    }>
  >({
    url: `${BaseName.Online}/layersAgg/save`,
    method: "POST",
    showLoading,
    updateHistoryType,
    data: {
      ...data,
      applicationCode: BaseName.AppCode
    }
  });

/**
 * @method 更新图层 (缓存)
 * @param {updateLayersAggReq} data
 * @param {UpdateHistoryTypeEnum} updateHistoryType 历史记录更新类型，默认为 UPDATE
 * @param {boolean} showLoading 是否显示 loading，默认为 false
 * @returns {Promise<BaseEntity<{config: string, id: number, moduleId: number}>>}
 */
export const updateLayersAgg = (
  data: updateLayersAggReq,
  updateHistoryType: UpdateHistoryTypeEnum = UpdateHistoryTypeEnum.UPDATE,
  showLoading = false,
  /**
   * 是否把本次改动同步回 agent 工作区，默认 true。
   * 后端推来的组件更新传 false：那条路上工作区已由后端过 core 之后写好了，
   * 前端再全量覆盖一遍等于把后端算出的派生值冲掉（见 useComponentStreamUpdater.applyComponentUpdate）。
   */
  syncWorkspace = true
) =>
  serverRequestWithCache<
    BaseEntity<{
      createdBy: string;
      createdTime: string;
      updatedBy: string;
      updatedTime: string;
      id: number;
      userId: number;
      moduleId: number;
      largeId: number;
      config: string; // 直接使用ComponentConfig类型
      minioIds: any[]; // 直接使用数组类型
      dataJson: Record<string, any>; // 直接使用对象类型
      versionCode: string;
    }>
  >({
    url: `${BaseName.System}/layers/update`,
    method: "put",
    showLoading,
    data,
    updateHistoryType,
    syncWorkspace
  });

/**
 * @method 更新图层 (不缓存)
 * @param {updateLayersAggReq} data
 * @param {boolean} showLoading 是否显示 loading，默认为 false
 * @returns {Promise<BaseEntity<{config: string, id: number, moduleId: number}>>}
 */
export const updateLayersAggNoCache = (
  data: updateLayersAggReq,
  _updateHistoryType: UpdateHistoryTypeEnum = UpdateHistoryTypeEnum.UPDATE,
  showLoading = false
) =>
  serverRequest<
    BaseEntity<{
      createdBy: string;
      createdTime: string;
      updatedBy: string;
      updatedTime: string;
      id: number;
      userId: number;
      moduleId: number;
      largeId: number;
      config: string; // 直接使用ComponentConfig类型
      minioIds: any[]; // 直接使用数组类型
      dataJson: Record<string, any>; // 直接使用对象类型
      versionCode: string;
    }>
  >({
    url: `${BaseName.System}/layers/update`,
    method: "put",
    showLoading,
    data
  });

/**
 * @method 删除图层 (缓存)
 * @param {number} id
 * @returns {Promise<BaseEntity<null>>}
 */
export const delLayersAgg = (id: number, updateHistoryType: UpdateHistoryTypeEnum = UpdateHistoryTypeEnum.DELETE) =>
  serverRequestWithCache<BaseEntity<null>>({
    url: `${BaseName.System}/layers/delete/${id}`,
    method: "DELETE",
    data: { id },
    updateHistoryType
  });

/**
 * @method 复制图层 (缓存)
 * @param {number} id
 * @param {boolean} isSaved
 * @param {boolean} isDynamicPanel
 * @returns {Promise<BaseEntity<{config: string, id: number, moduleId: number}>>}
 */
export const copyLayers = (
  id: number,
  isSaved = true,
  isDynamicPanel = false,
  updateHistoryType: UpdateHistoryTypeEnum = UpdateHistoryTypeEnum.SKIP
) =>
  serverRequestWithCache<
    BaseEntity<{
      config: string;
      id: number;
      moduleId: number;
    }>
  >({
    url: `${BaseName.System}/layers/copy/${id}/${isSaved ? 1 : 0}/${isDynamicPanel ? "true" : "false"}`,
    method: "get",
    data: { id },
    updateHistoryType
  });

/**
 * @method 更新大屏应用 (缓存)
 * @param {any} data
 * @returns {Promise<BaseEntity<null>>}
 */
export const updateLargeScreen = (data: any) =>
  serverRequestWithCache<BaseEntity<null>>({
    url: `${BaseName.System}/largeScreen/update`,
    method: "put",
    data
  });

export const updateLargeNoCacheScreen = (data: any) =>
  serverRequest<BaseEntity<null>>({
    url: `${BaseName.System}/largeScreen/update`,
    method: "put",
    data
  });

/**
 * 模板组件库-获取单个配置
 * @param {number} id
 * @param {boolean} showLoading
 * @returns {Promise<any>}
 */
export const getModuleInfo = (id: string, showLoading = true) =>
  serverRequest<ModuleInfoRes>({
    url: `${BaseName.System}/module/info/${id}`,
    method: "get",
    params: { id },
    showLoading
  });

/**
 * @method 获取应用-模板
 * @type {import('@/types/api/library').GetScreenModule}
 */
export const getScreenModule = (data: ScreenModuleReq, base = "/largeScreen") =>
  serverRequest<ScreenModuleRes>({
    url: `${BaseName.System}${base}/queryModel`,
    method: "post",
    data
  });

export const updateLayers = (data: any) =>
  serverRequest<BaseEntity<any>>({
    url: `${BaseName.System}/layers/update`,
    method: "put",
    data: {
      ...data
    }
  });
