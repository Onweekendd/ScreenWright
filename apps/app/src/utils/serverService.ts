import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { ElLoading } from "element-plus";

import { getToken } from "./auth";
import { handleUnauthorized } from "./session";
import { getVersionCode } from "./version";

let loadingInstance: any = null;

// 免鉴权接口（对齐 service.ts 的 freeAPI：登录/注册/公开大屏等）。
// 仅用于判断是否附带 Version-Code；令牌只要本地有就一律带上——后端按路径决定哪些接口允许匿名，
// 而不是前端靠这份清单（有些「免鉴权」的数据查询接口在 B/S 下同样需要身份）。
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
      // 令牌过期 / 失效 → 登出跳登录页；登录接口自身的 401（口令错误）交给登录页提示，不能在这里跳转
      if (error?.response?.status === 401 && !String(error.config?.url ?? "").includes("/user/login")) {
        handleUnauthorized();
      }
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
  if (token) {
    config.headers["X-Access-Token"] = token;
  }
  // Version-Code 与 token 解耦：匿名访问分享预览时没 token，但大屏多版本读写仍要靠这个头
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
