import { isNil, isString } from "lodash-es";

const { PUBLIC_PATH, MINIO_BASE_URL } = process.env;
export const BaseName = {
  System: "/bi-system",
  User: "/user",
  Order: "/order",
  Online: "/online",
  Suffix: "Agg",
  AppCode: "BI",
  BaseName: PUBLIC_PATH || ""
} as const;
function getCurrentBaseUrl() {
  // 空值/非浏览器环境校验
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
function isHttpOrHttpsProtocol() {
  if (typeof window === "undefined" || !window.location) return false;
  const { protocol } = window.location;
  return protocol === "http:" || protocol === "https:";
}
/**
 * minio资源域名公共拼接方法
 * @param url
 * @param toAbsolutePath 是否转换为绝对路径
 * @returns
 */
export const setMinioUrl = (url: string | null | undefined, toAbsolutePath: boolean = false) => {
  const { WEB_APP_MINIO_BASE_URL } = (window as any).webconfig;

  const pattern = /(data:image)|(http[s]?:\/\/)/;
  if (!isString(url)) {
    return "";
  }
  if (!url || isNil(url)) return ""; // 若为空(null/undefined)直接返回空不做判断操作

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

  return pattern.test(url) ? url : (WEB_APP_MINIO_BASE_URL || MINIO_BASE_URL) + url;
};

export function downFile(url: Blob | string, saveName?: string) {
  if (url instanceof Blob) {
    url = URL.createObjectURL(url); // 创建blob地址
  }
  const aLink = document.createElement("a");
  const fileName = saveName || url.slice(url.lastIndexOf("/") + 1);
  aLink.href = url;
  aLink.download = fileName || ""; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
  let event;
  if (window.MouseEvent) {
    event = new MouseEvent("click");
  } else {
    event = document.createEvent("MouseEvents");
    event.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  }
  aLink.dispatchEvent(event);
}

export const fontFamily = [
  { label: "Serif-字体", value: "sans-serif" },
  { label: "Arial-字体", value: "Arial" },
  { label: "思源黑体-Normal", value: "siayuan-normal" },
  { label: "思源黑体-Regular", value: "siayuan-regular" },
  { label: "思源黑体-Bold", value: "siayuan-bold" },
  { label: "DIN-粗体", value: "DIN-Bold" },
  { label: "DIN-黑体", value: "DIN-Black" },
  { label: "DIN-黑斜体", value: "DIN-BlackItalic" },
  { label: "DIN-粗斜体", value: "DIN-BoldItalic" },
  { label: "DINCond-粗体", value: "DINCond-Bold" },
  { label: "DINCond-细体", value: "DINCond-Light" },
  { label: "DINCond-中等体", value: "DIN-Bold-Medium" },
  { label: "DIN-细体", value: "DIN-Light" },
  { label: "DIN-细斜体", value: "DIN-LightItalic" },
  { label: "DIN-中等斜体", value: "DIN-MediumItalic" },
  { label: "DIN-常规体", value: "DIN-Regular" },
  { label: "DIN-常规斜体", value: "DIN-RegularItalic" },
  { label: "D-DIN-压缩体", value: "D-DINCondensed" },
  { label: "D-DIN-压缩粗体", value: "D-DINCondensed-Bold" },
  { label: "OPPO Sans字体", value: "OppOOPPOSans" },
  { label: "庞门正道标题体", value: "PangMenZhengDaoBiaoTiTi-1" },
  { label: "庞门正道粗书体", value: "PangMenZhengDaoCuShuTi-2" },
  { label: "阿里巴巴普惠体", value: "Alibaba-PuHuiTi-Regular" },
  { label: "造字工房悦黑", value: "造字工房悦黑" },
  { label: "优设标题黑", value: "优设标题黑" },
  { label: "液晶字体", value: "DigifaceWide_Regular" },
  { label: "钉钉进步体", value: "DingTalk_JinBuTi_Regular" },
  { label: "方正兰亭中黑简体1", value: "方正兰亭中黑_简体" },
  { label: "方正兰亭中黑简体2", value: "FZLTZHJW" },
  { label: "方正兰亭黑简体", value: "方正兰亭黑简体" },
  { label: "方正兰亭纤黑简体", value: "方正兰亭纤黑简体" },
  { label: "创客贴金刚体", value: "ChuangKeTieJinGangTi" },
  { label: "斗鱼字体", value: "DOUYU_Font" },
  { label: "斗鱼追光体", value: "DY追光体" },
  { label: "GrtskTera-细体", value: "GrtskTera-Light" },
  { label: "GrtskTera-中等体", value: "GrtskTera-Medium" },
  { label: "GrtskTera-半粗体", value: "GrtskTera-Semibold" },
  { label: "GrtskTera-Thin", value: "GrtskTera-Thin" },
  { label: "阿里妈妈数黑体", value: "阿里妈妈黑体" },
  { label: "阿里妈妈灵动体", value: "阿里妈妈灵动体" },
  { label: "阿里妈妈方圆体", value: "AlimamaFangYuanTiVF-Thin" },
  { label: "阿里巴巴细体", value: "AlibabaPuHuiTi-2-55-Regular" },
  { label: "League Gothic", value: "LeagueGothic-Regular" },
  { label: "MiSans-Regular", value: "MiSans-Regular" },
  { label: "MiSans-Bold", value: "MiSans-Bold" },
  { label: "MiSans-Heavy", value: "MiSans-Heavy" },
  { label: "MiSans-Light", value: "MiSans-Light" },
  { label: "MiSans-Medium", value: "MiSans-Medium" },
  { label: "TimesNewRoman", value: "TimesNewRoman" },
  { label: "施耐德正文字体", value: "arialmt" },
  { label: "施耐德标题字体", value: "ARIALROUNDEDMT" }
];
// 动态面板层级限制，过多层级会导致性能问题，建议不超过3层
export const dyPanelCount = 5;
