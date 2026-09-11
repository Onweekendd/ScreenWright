import type { LargeScreeInfo } from "@screenwright/types";

import type { BaseEntity } from "@/model/BaseEntity";
import type {
  addSceneObjReq,
  BaseAddSceneObjRes,
  cityScenesReq,
  getMapScreenRes,
  getPublishedSceneRes,
  getSceneObjListRes,
  quoteScreenReq,
  responseReq,
  ScenePublishReq,
  ScenePublishRes,
  ScreenItem,
  ScreenMeta,
  ScreenListRes,
  ScreenReq,
  ScreenReqParams
} from "@/model/Visual";
import { serverRequestWithCache } from "@/utils/cacheService";
import { BaseName } from "@/utils/config";
import { serverRequest } from "@/utils/serverService";
import { request } from "@/utils/service";

// 公共配置
const systemBase = BaseName.System;
const onlineBase = BaseName.Online;
const appCode = BaseName.AppCode;
const { BASE_URL_CITY } = process.env;

// 获取大屏列表（已回落 Screenwright）
export const getScreenList = (data: ScreenReq | ScreenReqParams, base = "/largeScreen") =>
  serverRequest<ScreenListRes>({
    url: `${systemBase}${base}/list`,
    method: "post",
    data
  });

export const cityScenesList = (data: cityScenesReq) => {
  const { WEB_CITY_API_BASE_URL, WEB_APP_API_BASE_URL } = window.webconfig;
  const city_api_url = WEB_CITY_API_BASE_URL || BASE_URL_CITY || WEB_APP_API_BASE_URL;
  return request<ScreenListRes>({
    url: `${city_api_url}${systemBase}/tCityScenes/list`,
    method: "post",
    data
  });
};

export const signaturePadSave = (data: any) =>
  request<BaseEntity<any>>({
    url: `${systemBase}/sign/save`,
    method: "post",
    data
  });
// 大屏复制
export const copyScreenObj = (params: { id: string | number; versionCode: string }, baseUrl = "largeScreenAgg") =>
  request<BaseEntity<ScreenItem>>({
    url: `${onlineBase}/${baseUrl}/copy/${params.id}/${params.versionCode}`,
    method: "get",
    params: {
      ...params,
      applicationCode: appCode
    },
    showLoading: true
  });

// 三维场景--发布
export const handleScenePublish = (data: ScenePublishReq) =>
  request<ScenePublishRes>({
    url: `${systemBase}/scene/publish`,
    method: "post",
    data,
    showLoading: true
  });

/**
 * 获取应用-常规配置 （缓存）
 * @param id 应用id
 * @param base 应用类型
 * @returns 应用配置
 */
export const getScreenObj = (id: string | number, base = "/largeScreen", needAuthor = true) =>
  serverRequestWithCache<BaseEntity<LargeScreeInfo>>({
    url: `${systemBase}${base}/info/${id}`,
    method: "get",
    params: { id },
    needAuthor
  });

export const getSceneVersion = (id: number) =>
  request<
    BaseEntity<{
      versionCode: string;
    }>
  >({
    url: `${systemBase}/scene/version/list/${id}`,
    method: "get",
    params: { id }
  });

export const getScreenObjWithNoCache = (id: string | number, base = "/largeScreen", versionCode: string) =>
  serverRequest<BaseEntity<LargeScreeInfo>>({
    url: `${systemBase}${base}/info/${id}`,
    method: "get",
    params: { id },
    needAuthor: false,
    versionCode
  });

/**
 * 大屏基本信息（不含 layers 及 config/detail/dataFilterArr/aniFrameSet/statusAnimation/encodedControl 等重 JSON）。
 * 供缓存新鲜度比对（updatedTime）、发布弹窗等只需元信息的场景。
 */
export const getScreenMeta = (id: string | number, base = "/largeScreen") =>
  serverRequest<BaseEntity<ScreenMeta>>({
    url: `${systemBase}${base}/meta/${id}`,
    method: "get",
    params: { id }
  });

// 获取引用面板配置（已回落 Screenwright）
export const getQuoteScreenObj = (params: quoteScreenReq, showLoading = true, needAuthor = true) =>
  serverRequest<BaseEntity<LargeScreeInfo & { id: number }>>({
    url: `${systemBase}/largeScreen/quoteInfo`,
    method: "post",
    data: { ...params },
    showLoading,
    needAuthor
  });

// 获取发布引用面板配置（已回落 Screenwright）
export const getOpenQuote = (params: quoteScreenReq, showLoading = true, needAuthor = true) =>
  serverRequest<BaseEntity<LargeScreeInfo & { id: number }>>({
    url: `${systemBase}/largeScreen/openQuote`,
    method: "post",
    data: { ...params, status: 1 },
    showLoading,
    needAuthor
  });

// 获取三维场景-常规配置
export const getMapScreenDetail = (id: string | number) =>
  request<getMapScreenRes>({
    url: `${systemBase}/scene/info/${id}`,
    method: "get",
    params: { id }
  });
// 查询三维场景下的对象列表(会撤销临时增加的场景对象和还原临时删除的场景对象)
export const getSceneObjList = (sceneId: string | number) =>
  request<getSceneObjListRes>({
    url: `${systemBase}/scene/object/list`,
    method: "get",
    params: { sceneId }
  });

/* 三维场景--场景内的对象 */
// 新增
export const addSceneObj = (data: addSceneObjReq) =>
  request<BaseAddSceneObjRes>({
    url: `${BaseName.System}/scene/object/save`,
    method: "post",
    data,
    showLoading: true
  });

// 三维场景--查询三维场景信息(发布与非发布)
export const getPublishedScene = (
  sceneId: string | number,
  versionCode: string,
  isOpen: boolean,
  isSimplified = false,
  largeScreenId: string | number,
  showLoading = false
) =>
  request<BaseEntity<getPublishedSceneRes>>({
    url: `${systemBase}/scene/${
      isOpen ? `open/${sceneId}/${largeScreenId}` : `notOpen/${sceneId}/${largeScreenId}/${isSimplified}`
    }/${versionCode}`,
    method: "get",
    timeout: 0,
    showLoading
  });

// 创建三维场景
export const createSceneData = (params: any) => {
  return request<responseReq>({
    url: `${onlineBase}/sceneAgg/save`,
    method: "POST",
    data: { ...params },
    showLoading: true
  });
};
// 创建城市模板
export const createCityData = (params: any) => {
  return request<responseReq>({
    url: `${onlineBase}/tCityScenesAgg/add`,
    method: "POST",
    data: { ...params },
    showLoading: true
  });
};
// 创建城市模板-初始化
export const cityLayersInit = (moduleId: number, params: any) => {
  return request<responseReq>({
    url: `${systemBase}/cityLayers/init?moduleId=${moduleId}&stateId=0`,
    method: "POST",
    data: { ...params },
    showLoading: true
  });
};

// 大屏复制返回的数据项类型（原由 SimpleBarrage/type 提供，该组件已物料化迁出，
// 此处保留 copyModelLargeScreen 所需的最小本地定义，避免 app 反向依赖物料内部类型）。
interface DataFilterItem {
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
  id: number;
  userId: number;
  name: string;
  layerScrollId: number;
  layerSignId: number;
  sort: number | null;
  signUrl: string;
  status: number | null;
  remark: string | null;
}

export const copyModelLargeScreen = (id: string | number) =>
  request<BaseEntity<DataFilterItem>>({
    url: `${BaseName.Online}/largeScreenAgg/copyModel/${id}`,
    method: "get",
    params: {
      id,
      applicationCode: BaseName.AppCode
    }
  });

export const setLayerLock = (id: string | number) => {
  return serverRequest<BaseEntity<{ userId: number; userName: string; lockValue: string }>>({
    url: `${systemBase}/layers/setLayerLock/${id}`,
    method: "get"
  });
};

// 编辑状态解锁（单机空实现）
export const setLayerUnLock = (id: string | number) => {
  return serverRequest<BaseEntity<string>>({
    url: `${systemBase}/layers/setLayerUnLock/${id}`,
    method: "get"
  });
};

// 获取默认模板（已回落 Screenwright；开源版无种子模板，返回空数组）
export const getDefaultTemplate = () => {
  return serverRequest<
    BaseEntity<
      Array<{
        coverUrl: string;
        id: number;
        name: string;
        templateIdLis: number[];
        templateList: any[];
      }>
    >
  >({
    url: `${systemBase}/largeScreen/group/examples/list`,
    method: "get"
  });
};

// 获取默认模板
export const createDefaultTemplate = (data: { id: number; groupId: number; name: string }) => {
  return request<BaseEntity<any>>({
    url: `${onlineBase}/largeScreenAgg/copyModel`,
    method: "post",
    data: {
      applicationCode: "BI",
      ...data
    }
  });
};
