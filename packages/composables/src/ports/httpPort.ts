import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

/**
 * 通用 HTTP 请求端口：app 一次性注入两个已配置好的请求方法（token / baseURL / 401 登出 / loading /
 * 大屏缓存拦截器等横切关注点已在 app 侧处理好），use 包与物料包只做「聚合 + 暴露」，不重复实现这些关注点。
 *
 * 部署顺序要求：主应用必须在挂载任何发起请求的组件之前调用 initHttpPort。
 */
export type RequestFn = <T = any>(config: AxiosRequestConfig & Record<string, any>) => Promise<T>;

export interface HttpPortImpls {
  /** 不带缓存拦截器的请求方法（指向 Java 后端） */
  request: RequestFn;
  /** 带缓存拦截器的请求方法（指向 Java 后端） */
  requestWithCache: RequestFn;
  /** 指向 Screenwright（Node）后端的请求方法 */
  serverRequest: RequestFn;
}

let impls: HttpPortImpls | null = null;

/** 由主应用在启动时调用一次，注入已配置好的请求方法。 */
export function initHttpPort(config: HttpPortImpls): void {
  impls = config;
}

function getImpls(): HttpPortImpls {
  if (!impls) {
    throw new Error("[@screenwright/composables] http 尚未初始化，请在应用启动时调用 initHttpPort() 注入实现");
  }
  return impls;
}

export const request: RequestFn = (config) => getImpls().request(config);
export const requestWithCache: RequestFn = (config) => getImpls().requestWithCache(config);
export const serverRequest: RequestFn = (config) => getImpls().serverRequest(config);

/** 裸 axios 单例：本包 vite externalize axios，运行时即宿主单例，是常量，无需注入 */
export const rawAxios: AxiosInstance = axios;
