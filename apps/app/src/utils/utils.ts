import { nextTick } from "vue";

import { snapdom } from "@zumer/snapdom";
export { batchCompressPic } from "@screenwright/composables";
// 纯逻辑，已迁移到 @screenwright/core；先 import 供本文件内部调用，再 re-export 保持外部调用点零改动
import { uuid } from "@screenwright/core";
import type { UploadFile } from "element-plus";
import Flv from "flv.js";
import Hls from "hls.js";
import html2canvas from "html2canvas";
import { cloneDeep, isArray, isBoolean, isDate, isEmpty, isNil, isNumber, isObject, isString } from "lodash-es";

import IconModal from "@/assets/icon/assets-icon-modal.png";
import { setMinioUrl } from "@/utils/config";
import { BaseName } from "@/utils/config";

import { getRebuiltDom as getClonedDom } from "./dom";
export { uuid };

export const copy = (text: string) => {
  const textRange = document.createElement("textarea");
  document.body.appendChild(textRange);
  textRange.value = text.trim();
  textRange.select();
  if (document.execCommand("copy")) {
    document.execCommand("copy");
  }
  textRange.remove();
};

// handleMessageBox 已下沉到 @screenwright/composables（与此处同 element-plus confirm 交互同行为），
// 先 import 供本文件内部调用，再 re-export 保持既有导入路径（@/utils/utils）可用，避免与物料包各持一份而漂移。
import { handleMessageBox } from "@screenwright/composables";
export { handleMessageBox };

/**
 * 时间戳格式转换以及计算
 * */
export function formatTime(time = 0, format = "YYYY-MM-DD hh:mm:ss") {
  const now = new Date().getTime();

  if (!time) {
    time = now;
  }

  while (time.toString().length < 13) {
    (time as any) += "0";
  }

  const date = new Date(time);
  // 补零
  function zeroFill(val: any) {
    return String(val).length < 2 ? "0" + val : val;
  }
  date.getMonth();
  /** 参数集 年-月-日 时:分:秒 */
  const arg = {
    year: date.getFullYear(),
    month: zeroFill(date.getMonth() + 1),
    day: zeroFill(date.getDate()),
    hours: zeroFill(date.getHours()),
    minutes: zeroFill(date.getMinutes()),
    seconds: zeroFill(date.getSeconds())
  };

  /** 判断有没有指定的时间格式 */
  switch (format) {
    case "YYYY-MM-DD hh:mm:ss":
      return `${arg.year}-${arg.month}-${arg.day} ${arg.hours}:${arg.minutes}:${arg.seconds}`;
    case "YYYY-MM-DD":
      return `${arg.year}-${arg.month}-${arg.day}`;
    case "MM-DD":
      return `${arg.month}-${arg.day}`;
    case "hh:mm:ss":
      return `${arg.hours}:${arg.minutes}:${arg.seconds}`;
    case "hh:mm":
      return `${arg.hours}:${arg.minutes}`;
    case "computed": //判断是不是需要进行计算
      if (now > time) {
        const dt = Math.abs(time - now), //时间已过去多少毫秒
          S = dt / 1000, //秒
          M = S / 60, //分
          H = M / 60, //小时
          D = H / 24, //天
          W = D / 7; //周

        /**
      ~~ ==>表示取整数部分 类似与 parseInt
    */
        if (~~W > 0 && W < 3) {
          return ~~W + "周前";
        } else if (D < 7 && ~~D > 0) {
          return ~~D + "天前";
        } else if (~~H > 0 && H < 24) {
          return ~~H + "小时前";
        } else if (~~M > 0 && M < 60) {
          return ~~M + "分钟前";
        } else if (~~S > 0 && S < 60) {
          return ~~S + "秒前";
        }
      }
      return `${arg.year}-${arg.month}-${arg.day} ${arg.hours}:${arg.minutes}:${arg.seconds}`;
  }
}

export function useInView(refs: any) {
  if (refs && Array.isArray(refs)) {
    // 加工函数
    const processFn = function (entries: any, observer: any) {
      entries.forEach((entry: any) => {
        if (entry.intersectionRatio <= 0) {
          return;
        }
        const target = entry.target;
        const src = target.getAttribute("data-src");
        target.setAttribute("src", src ?? ""); // 将真实的地址赋给 src 属性
        observer.unobserve(target);
      });
    };
    const options = {
      rootMargin: "0px", // 根元素的边距
      threshold: 0.5, // 可见性比例阈值
      once: true
    };
    const observer = new IntersectionObserver(processFn, options);
    Object.keys(refs).forEach((e: any) => {
      observer.observe(refs[e]);
    });
  }
}

export const downloadBlob = (blob: any, name: string) => {
  const blobURL = window.URL.createObjectURL(blob);
  const tempLink = document.createElement("a");
  tempLink.style.display = "none";
  tempLink.href = blobURL;
  tempLink.setAttribute("download", name);
  document.body.appendChild(tempLink);
  tempLink.click();
  tempLink.remove();
};

export function getVideoBase64(url: string, type = "jpeg"): Promise<string> {
  return new Promise(function (resolve) {
    let dataURL = "";
    const video = document.createElement("video");
    video.setAttribute("crossOrigin", "anonymous"); // 处理跨域
    video.setAttribute("src", url);
    video.setAttribute("preload", "auto");
    video.addEventListener("loadeddata", function () {
      const canvas = document.createElement("canvas");
      const width = video.videoWidth || 400; // canvas的尺寸和图片一样
      const height = video.videoHeight || 240; // 设置默认宽高为  400  240
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.drawImage(video, 0, 0, width, height); // 绘制canvas
      dataURL = canvas.toDataURL(`image/${type}`); // 转换为base64
      resolve(dataURL);
    });
  });
}

export const getImageUrl = async (file: string | UploadFile, accept?: Array<string>) => {
  if (typeof file === "string") {
    const type = file.split(".").pop();
    if (type === "mp4") {
      return await getVideoBase64(file);
    }
    return file;
  }

  if (file && file.raw && file.size) {
    if (file.name.includes(".glb")) {
      return IconModal;
    } else if (file.raw.type === "video/mp4") {
      const url = await getVideoBase64(URL.createObjectURL(file.raw));
      return url;
    } else if (accept && accept.includes(file.name)) {
      return URL.createObjectURL(file.raw);
    } else {
      return URL.createObjectURL(file.raw);
    }
  }
  return "";
};
// 纯逻辑，已迁移到 @screenwright/core，这里重新导出保持原有调用点零改动
export { setPx } from "@screenwright/core";

/**
 * 解析url的search
 * 不可用$route.query,因为pushState，replaceState添加的search没有同步更新到$route.query
 * @param {*} search
 * @returns
 */
// 纯逻辑，已迁移到 @screenwright/core，这里重新导出保持原有调用点零改动
export { parseUrl } from "@screenwright/core";

// 纯逻辑，已迁移到 @screenwright/core，这里重新导出保持原有调用点零改动
export { sleep } from "@screenwright/core";

export const handleImgUrl = (url: string) => {
  const arr = url.split(".");
  // 缩略图后缀为glb、glft时更换为默认模型缩略图
  if (["glb", "gltf"].includes(arr[arr.length - 1])) {
    const { MINIO_DEFAULT_PREFIX } = process.env;

    return setMinioUrl(`${MINIO_DEFAULT_PREFIX}assets/scene/cover/defaultModelCover.png`);
  }
  return setMinioUrl(url);
};

export const dataURLtoFile = (dataurl: any, filename: any) => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
export const getSnapdomCoverUrl = async (
  dom: HTMLElement,
  attrs: { width: number; height: number; props?: string }
) => {
  try {
    console.log(dom, "domdom", attrs);
    const result = await snapdom(dom);
    const canvas = await result.toCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    const fileName = new Date().getTime() + ".png";
    const file = dataURLtoFile(dataUrl, fileName);
    const url = URL.createObjectURL(file);
    return { url, file };
  } catch (error) {
    console.error("getCoverUrl 截图生成失败:", error);
    return { url: "", file: "" };
  }
};
export const getCoverUrl = async (dom: HTMLElement, attrs: { width: number; height: number; props?: string }) => {
  // const targetDom = dom.cloneNode(true) as HTMLElement
  // targetDom.style.position = "absolute"
  // targetDom.style.left = "-9999px"
  // targetDom.style.top = "-9999px"
  // document.body.appendChild(targetDom)
  // console.log(targetDom, "targetDomtargetDom")
  const targetDom = await getClonedDom(dom);
  console.log(targetDom, "f");
  try {
    // 尝试直接截图（适用于同源视频）
    // if (!targetDom || !(targetDom instanceof HTMLElement)) {
    //   throw new Error("targetDom is not a valid HTMLElement")
    // }
    const canvas = await html2canvas(targetDom, {
      useCORS: true,
      backgroundColor: null,
      allowTaint: true,
      width: attrs.width,
      height: attrs.height
    });

    // 处理截图结果
    const fileName = new Date().getTime() + ".png";
    const dataUrl = canvas.toDataURL("image/png");
    const file = dataURLtoFile(dataUrl, fileName);
    const url = URL.createObjectURL(file);
    console.log(url, "dataUrldataUrldataUrl");
    // document.body.removeChild(targetDom)
    return { url, file };
  } catch (error) {
    console.log("直接截图失败，尝试视频帧捕获");

    // 直接截图失败时，尝试捕获视频帧
    const videos = dom.querySelectorAll("video") as NodeListOf<HTMLVideoElement>;
    const videoElements = Array.from(videos).filter((video) => video.readyState >= 2);
    if (videoElements.length > 0) {
      // 创建临时 Canvas 捕获视频帧
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = attrs.width;
      tempCanvas.height = attrs.height;
      const ctx = tempCanvas.getContext("2d");

      // 捕获第一帧视频
      const firstVideo = videoElements[0];
      ctx?.drawImage(firstVideo, 0, 0, attrs.width, attrs.height);

      const dataUrl = tempCanvas.toDataURL("image/png");
      const fileName = new Date().getTime() + ".png";
      const file = dataURLtoFile(dataUrl, fileName);
      const url = URL.createObjectURL(file);
      // document.body.removeChild(targetDom)
      return { url, file };
    }

    console.error("生成封面图失败:", error);
    return { url: "", file: {} as File };
  }
};

export const blobUrlToFile = async (blobUrl: string, fileName: string) => {
  try {
    // 使用 fetch 获取 Blob
    const response = await fetch(blobUrl);
    const blob = await response.blob();

    // 使用 File 构造函数将 Blob 转换为 File 对象
    const newFile = new File([blob], fileName, { type: blob.type });
    return newFile;
  } catch (error) {
    console.error("将 Blob URL 转换为 File 对象时出错:", error);
    return null;
  }
};

// 终端交互中继已内建进 Screenwright 后端（servers/server 的 encoded-control-relay），
// 因此这里指向 funAI base 而非旧的 Java 网关（VITE_API_BASE_URL）。
export const getWebsocketUrl = (id: string, type = "bi") => {
  const baseURL = import.meta.env.VITE_FUNAI_API_URL || "http://localhost:4111";
  const doubleSlash = baseURL.indexOf("//");
  const hostAndPath = doubleSlash === -1 ? `//${baseURL}` : baseURL.slice(doubleSlash);
  const protocol = baseURL.startsWith("https:") ? "wss:" : "ws:";
  return `${protocol}${hostAndPath}${BaseName.System}/encodedControl/${type}/${id}`;
};

export const convertFormat = (format: string): string => {
  return format
    .replace(/yyyy/g, "YYYY")
    .replace(/MM/g, "MM")
    .replace(/dd/g, "DD")
    .replace(/HH/g, "HH")
    .replace(/mm/g, "mm")
    .replace(/ss/g, "ss");
};

export const getEchartsAxisNameAndSeriesData = (optionData: any[]): { axisName: string[]; optionData: any[] } => {
  // 获取所有的 axisName
  let axisName: any[] = optionData.flatMap((item) => item.list.map((ele: any) => ele.name));
  axisName = [...new Set(axisName)];
  optionData = optionData.map((item) => {
    const seriesData: any[] = [];
    axisName.forEach((ele) => {
      let flag = 0;
      for (const { name, value } of item.list) {
        if (ele === name) {
          seriesData.push({
            seriesName: item.name,
            name: ele,
            value: value || 100
          });
          flag = 1;
          break;
        }
      }
      if (flag !== 1) {
        seriesData.push({
          seriesName: item.name,
          name: ele,
          value: 2000
        });
      }
    });
    return {
      name: item.name,
      list: seriesData
    };
  });
  return {
    axisName,
    optionData
  };
};

// 将数组根据字段拆分成二维数组
export const splitArray = (array: any[], field: any) => {
  if (array?.length < 1) {
    return [];
  }
  try {
    const newArr: any[] = [];
    array.map((mapItem) => {
      if (newArr.length == 0) {
        newArr.push({ name: mapItem[field], list: [mapItem] });
      } else {
        const res = newArr.some((item) => {
          //判断相同的部门，有就添加到当前项
          if (item.name === mapItem[field]) {
            item.list.push(mapItem);
            return true;
          }
        });
        if (!res) {
          //如果没找相同的部门添加一个新对象
          newArr.push({ name: mapItem[field], list: [mapItem] });
        }
      }
    });
    return newArr;
  } catch (error) {
    console.log("数组拆分失败:", error);
    return [];
  }
};

export const validateNull = (val: any): boolean => {
  // 特殊判断：如果 val 存在且为数字 0
  if (isNumber(val) && val === 0) {
    return false;
  }
  // 如果是日期、布尔值、数字类型，返回 false
  if (isDate(val) || isBoolean(val) || isNumber(val)) {
    return false;
  }
  // 判断是否为 null 或 undefined
  if (isNil(val)) {
    return true;
  }
  // 如果是字符串且为空或 'null' 或 'undefined'
  if (isString(val) && (val === "" || val === "null" || val === "undefined")) {
    return true;
  }
  // 如果是数组且长度为 0
  if (isArray(val) && isEmpty(val)) {
    return true;
  }
  // 如果是对象
  if (isObject(val)) {
    const newVal = cloneDeep(val) as Record<string, any>;
    const list = ["$parent"];
    list.forEach((ele) => {
      delete newVal[ele];
    });
    return isEmpty(newVal);
  }
  return false;
};

export const getFunction = (fun: any, def: any) => {
  if (!validateNull(fun)) {
    try {
      return eval(fun);
    } catch {
      return () => {};
    }
  }
  if (def) {
    return () => {};
  }
};

/**
 * 处理组件id
 * @param component 组件id
 * @returns 组件id
 *
 * @example
 * extractComponentId("$component(1305156)") => 1305156
 */
export const extractComponentId = (component: string | number): number => {
  // 如果是数字，直接返回
  if (isNumber(component)) {
    return component;
  }

  // 如果是字符串
  if (isString(component)) {
    // 如果不包含$component，直接返回
    if (!component.includes("$component")) {
      return Number(component);
    }

    // 如果包含$component，提取括号中的数字
    const match = component.match(/\$component\((\d+)\)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }

  // 其他情况，尝试转换为数字
  return Number(component);
};
// 纯逻辑，已迁移到 @screenwright/core，这里重新导出保持原有调用点零改动
export { lineargradientHandle } from "@screenwright/core";
// 纯逻辑，已迁移到 @screenwright/core，这里重新导出保持原有调用点零改动
export { getPartialGradientCSS } from "@screenwright/core";

// 纯逻辑，已迁移到 @screenwright/core，这里重新导出保持原有调用点零改动
export { getAlign } from "@screenwright/core";

export function getTcpNoticeWebsocketUrl() {
  let url = "";
  let websocketHost = "";
  let protocol = "";
  const { VITE_API_BASE_URL } = process.env || {};
  const baseURL = VITE_API_BASE_URL;
  if (baseURL) {
    // 这个拿不到NODE_ENV，怪
    // if (['development', 'intranet', 'intranetfte', 'intranetvpn'].includes(NODE_ENV)) {
    websocketHost = baseURL.slice(baseURL.indexOf("//")).split(":")[0] + "/bi-application";
    // }
    protocol = baseURL.slice(0, baseURL.indexOf("//")) === "https:" ? "wss:" : "ws:";
    url = `${protocol + websocketHost}/webSocket`;
  }
  return url;
}
const versionList = [
  {
    id: 1,
    createdTime: "2023-12-20"
  },
  {
    id: 2,
    createdTime: "2024-1-24"
  },
  {
    // 抗锯齿（多种类型）、天空盒（支持hdr）
    id: 3,
    createdTime: "2025-4-14"
  },
  {
    // 天气系统
    id: 4,
    createdTime: "2099-5-1"
  }
];

// 遍历versionList的createdTime，当前场景的创建时间在createdTime之前的话则使用当前版本
export const getVersionId = (time: string) => {
  const sceneCreatedTime = new Date(time);
  for (let i = 0; i < versionList.length; i++) {
    const version = versionList[i];
    const versionTime = new Date(version.createdTime);
    if (sceneCreatedTime.getTime() < versionTime.getTime()) {
      return version.id;
    }
  }
  return 0;
};

export const filterSceneObjList = (list: any[], realList: any[]) => {
  const res: any[] = [];
  list.forEach((item) => {
    const obj = item;
    const foundObj = realList.find((realItem) => realItem.name === obj.name);
    if (foundObj) {
      if (obj.type !== "layer" && obj.children && obj.children.length > 0) {
        // 过滤组内的场景对象
        obj.children = obj.children.filter((child: any) => {
          return foundObj.children.findIndex((foundChild: any) => foundChild.name === child.name) > -1;
        });
      }
      res.push(obj);
    }
  });
  return res;
};

export function isSupportedFlv(url: any, videoTips: HTMLElement, video: HTMLMediaElement, player?: any) {
  videoTips.innerHTML = "";
  const flvPlayer = Flv.createPlayer(
    {
      type: "flv",
      url,
      isLive: true,
      hasAudio: false,
      hasVideo: true,
      //@ts-ignore
      enableStashBuffer: true,
      stashInitialSize: 128
    },
    { deferLoadAfterSourceOpen: false }
  );
  flvPlayer.attachMediaElement(video);
  flvPlayer.load();
  // 在 this.player.load() 之后增加如下代码, 初始化 _remuxer
  const controller = player._transmuxer._controller;
  controller._remuxer = {
    flushStashedSamples: function () {
      console.log("flushStashedSamples");
    }
  };
  const playPromise = flvPlayer.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        flvPlayer.play();
      })
      .catch((err) => {
        console.log(err);
      });
  }
  // if (flvPlayer) hls.destroy();
  return flvPlayer;
}
// 支持Hls格式回调 如果存在callback，返回实例不做事件监听
export function isSupportedHls(
  url: string,
  videoTips: HTMLElement,
  video: HTMLVideoElement,
  callback?: (hls: Hls) => void
) {
  const hls = new Hls();
  if (!url) {
    return;
  }
  hls.loadSource(url);
  hls.attachMedia(video);
  if (callback) {
    return callback(hls);
  }
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    nextTick(() => {
      video.play();
      videoTips.innerHTML = "";
    });
  });
  hls.on(Hls.Events.ERROR, (event, data) => {
    if (data.fatal) {
      videoTips.innerHTML = "设备离线";
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          // try to recover network error
          if (
            data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
            data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
            data.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR
          ) {
            //@ts-ignore
            hls.loadSource(videoInfo.value.url);
          } else {
            hls.startLoad();
          }
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          hls.recoverMediaError();
          break;
        default:
          hls.destroy();
          break;
      }
    }
  });
  // if (hls) hls.destroy();
  return hls;
}
export function registerJs(url: string): Promise<string> {
  const { PUBLIC_PATH } = process.env;
  return new Promise((resolve, reject) => {
    const id = url.replace(/\/|\./g, "");
    if (document.getElementById(id)) {
      console.log("register js ok", url);
      resolve(url);
    } else {
      const dom = document.createElement("script");
      const pattern = /http[s]?:\/\//;
      dom.id = id;
      dom.defer = true;
      dom.type = "text/javascript";
      dom.src = pattern.test(url) ? url : (PUBLIC_PATH || "/") + url;
      document.head.appendChild(dom);

      dom.onload = () => {
        console.log("register js ok", url);
        resolve(url);
      };
      dom.onerror = (err) => {
        console.log("register js fail", url, err);
        reject(err);
      };
    }
  });
}
export function removeSurroundingQuotes(str: string) {
  // 先确保输入是字符串类型（处理可能的非字符串输入）
  const input = typeof str === "string" ? str : String(str);

  // 正则匹配并移除前后的双引号
  // ^" 匹配开头的双引号，"$ 匹配结尾的双引号
  return input.replace(/^"|"$/g, "");
}
let fteInitPromise: Promise<void> | null = null;
export const registerFte = (prefix = "/funScene") => {
  if (fteInitPromise) {
    return fteInitPromise;
  }
  fteInitPromise = (async () => {
    if (!(window as any).ftThree || !(window as any).fteApp) {
      await registerJs(`cdn/fte${prefix}/ftthree.js`);
      await registerJs(`cdn/fte${prefix}/fteApp.js`);
      return;
    }
  })();
  return fteInitPromise;
};
export const getIsNeedAuthorization = (error: any): boolean => {
  // const status = get(error, "response.status")
  const needAuthor = error.config.needAuthor;
  if (isNil(needAuthor)) {
    return true;
  }
  return needAuthor;
};

/**
 *
 * @param type 类型
 * @param url 图片url
 * @returns 图片宽高
 */
export const getAssetsWidthHeight = (type: string, url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    let width = 0;
    let height = 0;

    if (!type || !url) {
      resolve({ width, height });
      return;
    }

    switch (type) {
      case "img": {
        const nImg = new Image();
        nImg.src = setMinioUrl(url);
        nImg.onload = () => {
          const imgWidthLarger = nImg.width >= 1920;
          if (imgWidthLarger) {
            width = 1920;
            const scale = Number((width / nImg.width).toFixed(2));
            height = scale * nImg.height;
          } else {
            width = nImg.width;
            height = nImg.height;
          }
          resolve({ width, height });
        };
        break;
      }

      case "video": {
        const video = document.createElement("video");
        video.setAttribute("crossOrigin", "anonymous");
        video.setAttribute("src", setMinioUrl(url));
        video.currentTime = 1;
        video.addEventListener("loadeddata", () => {
          const videoWidthLarger = video.videoWidth > 1920;
          if (videoWidthLarger) {
            width = 1920;
            const scale = Number((width / video.videoWidth).toFixed(2));
            height = scale * video.videoHeight;
          } else {
            width = video.videoWidth;
            height = video.videoHeight;
          }
          resolve({ width, height });
        });
        break;
      }
    }
  });
};
export function randomId() {
  const $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const maxPos = $chars.length;
  let id = "";
  for (let i = 0; i < 16; i++) {
    id += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return id;
}
export const getLocationSearch = (prop = "version") => {
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
// batchCompressPic 已下沉到 @screenwright/composables（见顶部 re-export），此处不再本地实现，避免与物料包各持一份而漂移。
