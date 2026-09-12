import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { ElLoading } from "element-plus";
import { get, merge } from "lodash-es";

import { removeSurroundingQuotes } from "@/utils/utils";

import { getToken } from "./auth";
import { handleNotAuthor } from "./handleNotAuthor";
import { getVersionCode } from "./version";

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
    paramsInfo[field[0]] = field[1];
  });
  return paramsInfo[prop] || "";
};

/** 创建不带缓存拦截器的请求实例 */
function createServiceWithoutCache() {
  // 创建一个 axios 实例命名为 serviceWithoutCache
  const serviceWithoutCache = axios.create();
  // 请求拦截（不包含缓存逻辑）
  serviceWithoutCache.interceptors.request.use(
    (config) => {
      // 直接返回配置，不处理缓存
      return config;
    },
    // 发送失败
    (error) => Promise.reject(error)
  );
  // 响应拦截（不包含缓存逻辑）
  serviceWithoutCache.interceptors.response.use(
    (response) => {
      // apiData 是 api 返回的数据
      if (loadingInstance) {
        loadingInstance.close();
      }
      const apiData = response.data;
      return apiData;
    },
    (error) => {
      console.log(error, "errorerror");
      if (loadingInstance) {
        loadingInstance.close();
      }

      const status = get(error, "response.status");
      // 开源单机版无登录：不再对 401 做登出/刷新
      handleNotAuthor(status);
      return Promise.reject(error);
    }
  );
  return serviceWithoutCache;
}

/** 创建请求方法 */
function createRequest(service: AxiosInstance) {
  const { VITE_API_BASE_URL } = process.env;
  const BASE_URL = VITE_API_BASE_URL;

  return function <T>(
    config: AxiosRequestConfig & {
      showLoading?: boolean;
      needAuthor?: boolean;
      // 超时时间，单位：毫秒，默认60秒，0表示不限制
      timeOut?: number;
      versionCode?: string;
      onProgress?: (percent: ProgressEvent) => void;
    }
  ): Promise<T> {
    if (config?.showLoading) {
      loadingInstance = ElLoading.service({
        lock: true,
        text: "Loading",
        background: "rgba(0, 0, 0, 0.7)"
      });
    }
    const token = getToken();
    const isFree = freeAPI.findIndex((url) => config.url?.indexOf(url) !== -1) !== -1;
    const versionCode = getLocationSearch() || config.versionCode || getVersionCode() || "";
    config.headers = config.headers || {};
    if (token && !isFree) {
      if (config.headers) {
        config.headers["X-Access-Token"] = token;
        if (versionCode) {
          config.headers["Version-Code"] = versionCode === "undefined" ? "1" : removeSurroundingQuotes(versionCode);
        }
      }
    }
    // 默认配置，超时时间60秒
    const defaultConfig = {
      baseURL: BASE_URL,
      timeout: 1000 * 60, // 默认60秒超时
      data: {}
    };

    // 处理超时逻辑：如果timeOut为0则不限制，否则使用指定值或默认值
    const requestConfig = {
      ...config,
      timeout: config.timeout === 0 ? 0 : config.timeOut || defaultConfig.timeout
    };

    const handleProgress = (e: ProgressEvent) => {
      if (e && config.onProgress) {
        config.onProgress(e);
      }
    };

    // 合并配置：上传走 onUploadProgress，下载/SSE 走 onDownloadProgress
    const mergeConfig = merge(defaultConfig, requestConfig, {
      onUploadProgress: handleProgress,
      onDownloadProgress: handleProgress
    });
    return service(mergeConfig);
  };
}

/** 用于网络请求的实例（不带缓存） */
const serviceWithoutCache = createServiceWithoutCache();

/** 用于普通网络请求的方法（不带缓存） */
export const request = createRequest(serviceWithoutCache);
