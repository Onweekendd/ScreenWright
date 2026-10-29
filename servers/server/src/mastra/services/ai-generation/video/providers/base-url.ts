/**
 * 规范化用户填的视频 Base URL：合并重复斜杠，去掉结尾斜杠和误填的接口路径（`endpointSuffix`），
 * 这样填前缀或完整提交地址都能用。查询参数和片段直接拒绝，拼路径时会被带到错误的位置。
 */
export const normalizeBaseUrl = (baseUrl: string, endpointSuffix: RegExp): string => {
  const url = new URL(baseUrl.trim());
  url.pathname = url.pathname
    .replace(/\/{2,}/g, "/")
    .replace(/\/+$/, "")
    .replace(endpointSuffix, "");
  if (url.search || url.hash) {
    throw new Error("视频 Base URL 不应包含查询参数或片段");
  }
  return url.toString().replace(/\/+$/, "");
};
