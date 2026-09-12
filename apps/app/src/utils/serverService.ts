import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { ElLoading } from "element-plus";

import { getToken } from "./auth";
import { getVersionCode } from "./version";

let loadingInstance: any = null;

// 免鉴权接口（对齐 service.ts 的 freeAPI：登录/注册/公开大屏等不带 token）
const freeAPI = [
  "/user/login",
  "/user/register",
  "/largeScreen/open",
  "/largeScreenAgg/open",
  "/application/isSuperAdmin"
];

/**
 * 指向 Screenwright 后端的 axios 实例（回落接口专用）。
 * 与 service.ts 的 request 行为一致：注入 X-Access-Token、返回 response.data、401 自动登出。
 * baseURL 来自 import.meta.env.VITE_FUNAI_API_URL（如 http://localhost:4111）。
 */
function createFunaiService(): AxiosInstance {
  const service = axios.create();
  service.interceptors.response.use(
    (response) => {
      if (loadingInstance) {
        loadingInstance.close();
      }
      return response.data;
    },
    (error) => {
      if (loadingInstance) {
        loadingInstance.close();
      }
      // 开源单机版无登录：不再对 401 做登出/刷新
      return Promise.reject(error);
    }
  );
  return service;
}

const funaiAxios = createFunaiService();

export function serverRequest<T>(
  config: AxiosRequestConfig & {
    showLoading?: boolean;
    needAuthor?: boolean;
    timeOut?: number;
    versionCode?: string;
    onProgress?: (percent: ProgressEvent) => void;
    // 与 requestWithCache 兼容的额外字段（Screenwright 侧无缓存/历史，收下即忽略）
    updateHistoryType?: unknown;
    syncWorkspace?: boolean;
    [key: string]: unknown;
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
  config.headers = config.headers || {};
  if (token && !isFree) {
    config.headers["X-Access-Token"] = token;
  }
  // Version-Code 与 token 解耦：开源去登录版没 token，但大屏多版本读写仍要靠这个头
  if (!isFree) {
    const versionCode = config.versionCode || getVersionCode() || "";
    if (versionCode) {
      config.headers["Version-Code"] = versionCode === "undefined" ? "1" : versionCode;
    }
  }
  return funaiAxios({
    baseURL: process.env.VITE_FUNAI_API_URL ?? "http://localhost:4111",
    timeout: config.timeout === 0 ? 0 : config.timeOut || 1000 * 60,
    data: {},
    ...config,
    onDownloadProgress: (e) => {
      if (e && config.onProgress) {
        config.onProgress(e as unknown as ProgressEvent);
      }
    }
  }) as unknown as Promise<T>;
}
