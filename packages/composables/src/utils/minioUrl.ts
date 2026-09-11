import { isNil, isString } from "lodash-es";

const { PUBLIC_PATH, MINIO_BASE_URL } = process.env;

/** 获取当前页面的基础路径（http(s) 与 file 协议分别处理），纯读取 window.location，无 app 耦合 */
function getCurrentBaseUrl(): string {
  if (typeof window === "undefined" || !window.location) {
    return "";
  }

  const { protocol, href } = window.location;
  const isHttpProtocol = protocol === "http:" || protocol === "https:";

  // 场景1：http/https协议 - 补充上下文（提取到项目根路径）
  if (isHttpProtocol) {
    try {
      // 移除锚点 + 解析URL
      const urlWithoutHash = href.split("#")[0];
      const parsedUrl = new URL(urlWithoutHash);
      // 拼接协议+主机+路径，移除末尾斜杠
      let baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
      // 移除末尾斜杠，确保路径整洁（如 /vue3-todo-app/ → /vue3-todo-app）
      baseUrl = baseUrl.replace(/\/$/, "");
      // 处理根路径场景（如 http://localhost:5175/ → http://localhost:5175）
      if (baseUrl.endsWith("/") || parsedUrl.pathname === "/") {
        baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      }
      return baseUrl;
    } catch (e) {
      console.error("HTTP/HTTPS URL解析失败:", e);
      return "";
    }
  }

  // 场景2：file协议 - 提取文件目录的基础路径
  if (protocol === "file:") {
    try {
      const urlWithoutHash = href.split("#")[0];
      const parsedUrl = new URL(urlWithoutHash);
      // 解码路径（处理%20等编码）+ 截取到文件上级目录
      const decodedPath = decodeURIComponent(parsedUrl.pathname);
      const lastSlashIndex = decodedPath.lastIndexOf("/");
      const dirPath = decodedPath.substring(0, lastSlashIndex);
      // 重新编码并拼接回file协议
      const encodedDirPath = encodeURIComponent(dirPath).replace(/%2F/g, "/");
      return `file://${encodedDirPath}`;
    } catch (e) {
      console.error("File URL解析失败:", e);
      return "";
    }
  }

  // 其他协议（如ftp等）- 返回空
  return "";
}

function isHttpOrHttpsProtocol(): boolean {
  if (typeof window === "undefined" || !window.location) {
    return false;
  }
  const { protocol } = window.location;
  return protocol === "http:" || protocol === "https:";
}

/**
 * minio资源域名公共拼接方法
 * @param url
 * @param toAbsolutePath 是否转换为绝对路径
 * @returns
 */
export const setMinioUrl = (url: string, toAbsolutePath: boolean = false): string => {
  const pattern = /(data:image)|(http[s]?:\/\/)/;
  if (!isString(url)) {
    return "";
  }
  if (!url || isNil(url)) {
    return "";
  } // 若为空(null/undefined)直接返回空不做判断操作

  if (url && (url.slice(0, 2) == "./" || url.slice(0, 5) == "/img/")) {
    // 检测是否为文件协议环境

    if (!toAbsolutePath) {
      if (url?.startsWith("/img/")) {
        const publicPath = PUBLIC_PATH || "";
        // 确保路径拼接正确，避免双斜杠
        const normalizedPublicPath = publicPath.endsWith("/") ? publicPath.slice(0, -1) : publicPath;
        return normalizedPublicPath + url;
      }

      // ue导出后 基于文件协议进行读取 需要使用相对路径
      return url;
    }
    const isFileProtocol = typeof window !== "undefined" && window.location.protocol === "file:";
    if (isFileProtocol) {
      // 在文件协议下，使用 URL API 确保路径相对于 HTML 文件正确解析
      // 避免因 JS 文件和 HTML 文件不在同一目录导致的路径错误
      try {
        const baseUrl = typeof window !== "undefined" ? window.location.href : "";
        const normalizedUrl = url.startsWith("/") ? `.${url}` : url;
        const absoluteUrl = new URL(normalizedUrl, baseUrl).href;
        return absoluteUrl;
      } catch {
        // 如果 URL 解析失败，返回原始相对路径
        return url.startsWith("/") ? url.replace(/^\//, "./") : url;
      }
    }

    if (url?.startsWith("./")) {
      if (isHttpOrHttpsProtocol()) {
        let assetUrl = url.replace(/^\.\//, "/");
        const currentBaseUrl = getCurrentBaseUrl();
        if (currentBaseUrl) {
          assetUrl = currentBaseUrl + assetUrl;
        }
        return assetUrl;
      }
      return url.replace(/^\.\//, "/");
    }
  }

  return pattern.test(url) ? url : MINIO_BASE_URL + url;
};
