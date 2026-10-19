/** 本机开发时后端的默认地址（没配 VITE_FUNAI_API_URL 时用） */
export const DEV_API_BASE_URL = "http://localhost:4111";

/**
 * 解析后端基址：
 * - 未配置（undefined）：本机开发默认地址；
 * - 配成空串：同源。生产环境前端与后端在同一个域名下，由网关按路径分流，浏览器只认当前页面的 origin；
 * - 其余：用配置值，去掉末尾斜杠。
 */
export const resolveApiBase = (raw: string | undefined, origin: string): string => {
  if (raw === undefined) {
    return DEV_API_BASE_URL;
  }
  return (raw || origin).replace(/\/+$/, "");
};

export const getApiBaseUrl = (): string => resolveApiBase(import.meta.env.VITE_FUNAI_API_URL, window.location.origin);
