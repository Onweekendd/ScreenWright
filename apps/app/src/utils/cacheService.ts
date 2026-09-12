import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { ElLoading } from "element-plus";
import { get, merge } from "lodash-es";

import type { UpdateHistoryTypeEnum } from "@/views/build/components/buildRender/hooks/useAction";
import { useCacheData } from "@/views/build/useCacheData";

import { getToken } from "./auth";
import { handleNotAuthor } from "./handleNotAuthor";
import { removeSurroundingQuotes } from "./utils";
import { getVersionCode } from "./version";

export interface CacheRequestConfig extends AxiosRequestConfig {
  showLoading?: boolean;
  updateHistoryType?: UpdateHistoryTypeEnum;
  syncWorkspace?: boolean;
  needAuthor?: boolean;
}

let loadingInstance: any = null;

const freeAPI = [
  "/user/login",
  "/user/register",
  "/largeScreen/open",
  "/largeScreenAgg/open",
  "/data/local/getLocalData",
  "/data/db/executeSql",
  "/data/api/connect",
  "/scene/open",
  "/tCityScenes/open",
  "/largeScreen/openQuote",
  "/application/isExists",
  "/application/isSuperAdmin"
];

const getLocationSearch = (prop = "version") => {
  const search = location.search.slice(1).split("&");
  if (!search) {
    return search;
  }
  const paramsInfo: { [key: string]: string } = {};
  search.forEach((i) => {
    const field = i.split("=");
    paramsInfo[field[0]] = decodeURIComponent(field[1]).replace(/"/g, "");
  });
  return paramsInfo[prop] || "";
};

/** 获取缓存数据处理函数 */
const getCacheHandlers = () => {
  const { handleResponseCacheInterceptor, handleRequestCacheInterceptor, handleCacheErrorResponse } = useCacheData();
  return { handleResponseCacheInterceptor, handleRequestCacheInterceptor, handleCacheErrorResponse };
};

/** 创建带缓存拦截器的请求实例 */
function createServiceWithCache() {
  // 创建一个 axios 实例命名为 serviceWithCache
  const serviceWithCache = axios.create();

  // 延迟获取缓存处理函数，避免初始化顺序问题
  let cacheHandlers: ReturnType<typeof getCacheHandlers> | null = null;

  const getCacheHandlersLazily = () => {
    if (!cacheHandlers) {
      cacheHandlers = getCacheHandlers();
    }
    return cacheHandlers;
  };

  // 请求拦截
  serviceWithCache.interceptors.request.use(
    async (config) => {
      const { handleRequestCacheInterceptor } = getCacheHandlersLazily();
      return await handleRequestCacheInterceptor(config);
    },
    // 发送失败
    (error) => Promise.reject(error)
  );
  // 响应拦截（带缓存逻辑）
  serviceWithCache.interceptors.response.use(
    (response) => {
      const { handleResponseCacheInterceptor } = getCacheHandlersLazily();

      handleResponseCacheInterceptor(response);

      // apiData 是 api 返回的数据
      if (loadingInstance) {
        loadingInstance.close();
      }
      const apiData = response.data;
      return apiData;
    },
    (error) => {
      if (loadingInstance) {
        loadingInstance.close();
      }

      try {
        const { handleCacheErrorResponse } = getCacheHandlersLazily();
        // 处理缓存返回的伪造错误
        return handleCacheErrorResponse(error);
      } catch (e) {
        console.error("处理缓存错误时发生异常:", e);
        // 如果不是缓存错误，继续处理其他错误
        const status = get(error, "response.status");
        // 开源单机版无登录：不再对 401 做登出/刷新
        handleNotAuthor(status);
        return Promise.reject(error);
      }
    }
  );
  return serviceWithCache;
}

/** 创建请求方法 */
function createRequestWithCache(service: AxiosInstance, resolveBaseURL: () => string) {
  return function <T>(config: CacheRequestConfig): Promise<T> {
    const BASE_URL = resolveBaseURL();
    if (config?.showLoading) {
      loadingInstance = ElLoading.service({
        lock: true,
        text: "Loading",
        background: "rgba(0, 0, 0, 0.7)"
      });
    }
    const token = getToken();
    const isFree = freeAPI.findIndex((url) => config.url?.indexOf(url) !== -1) !== -1;
    const versionCode = getLocationSearch() || getVersionCode() || "";
    config.headers = config.headers || {};
    if (token && !isFree) {
      config.headers["X-Access-Token"] = token;
    }
    // Version-Code 与 token 解耦：开源去登录版没 token，但大屏多版本读取仍要靠这个头
    if (!isFree && versionCode) {
      config.headers["Version-Code"] = versionCode === "undefined" ? "1" : removeSurroundingQuotes(versionCode);
    }
    const defaultConfig = {
      baseURL: BASE_URL,
      timeout: 1000 * 60, // 请求超时
      data: {}
    };
    // 将默认配置 defaultConfig 和传入的自定义配置 config 进行合并成为 mergeConfig
    const mergeConfig = merge(defaultConfig, config);
    return service(mergeConfig);
  };
}

/** 用于网络请求的实例（带缓存） */
const serviceWithCache = createServiceWithCache();

/** 用于需要缓存的网络请求的方法（带缓存，指向 Java 后端） */
export const requestWithCache = createRequestWithCache(serviceWithCache, () => import.meta.env.VITE_API_BASE_URL);

/**
 * 指向 Screenwright（Node）后端、同样带缓存拦截器的请求方法。
 * 缓存逻辑（IndexedDB 草稿、撤销/重做历史、写后回灌）全部基于 config.url 与本地存储，
 * 与后端无关，故直接复用同一套 useCacheData 拦截器，仅 baseURL 指向 Screenwright。
 * 供 saveLayersAgg / updateLayersAgg / delLayersAgg / copyLayers / updateLargeScreen /
 * getScreenObj 等原先走 requestWithCache 的回落接口使用。
 */
export const serverRequestWithCache = createRequestWithCache(
  createServiceWithCache(),
  () => import.meta.env.VITE_FUNAI_API_URL ?? "http://localhost:4111"
);
