import type { BaseEntity } from "@/model/BaseEntity";
import type { CreateVersion, ScreenData, ScreenVersion, updateScreenVersion } from "@/model/Version";
import type { ScreenItem } from "@/model/Visual";
import { BaseName } from "@/utils/config";
import { serverRequest } from "@/utils/serverService";
import { request } from "@/utils/service";

// const { WEB_APP_RESOURCE_BASE_URL, VUE_APP_RESOURCE_BASE_URL } = (window as any).webconfig
const { MINIO_DEFAULT_PREFIX, MINIO_BASE_URL } = process.env;
const { WEB_APP_MINIO_DEFAULT_PREFIX, WEB_APP_MINIO_BASE_URL } = (window as any).webconfig || {};
const MERGE_MINIO_BASE_URL = WEB_APP_MINIO_BASE_URL || MINIO_BASE_URL;
const MERGE_MINIO_DEFAULT_PREFIX = WEB_APP_MINIO_DEFAULT_PREFIX || MINIO_DEFAULT_PREFIX;

// 公共配置
const systemBase = BaseName.System;
const onlineBase = BaseName.Online;
const appCode = BaseName.AppCode;
const suffix = BaseName.Suffix;
// delete
// 大屏应用-获取版本列表（已回落 Screenwright，单版本模型）
export const getScreenVersionList = (id: string | number, baseUrl = "largeScreen") =>
  serverRequest<BaseEntity<Array<ScreenVersion>>>({
    url: `${systemBase}/${baseUrl}/version/list`,
    method: "get",
    params: { id }
  });
// 更新 version（detail: update | delete | copy）
export const screenVersion = (data: updateScreenVersion | null, detail = "update", baseUrl = "largeScreen") =>
  serverRequest<BaseEntity<ScreenData | null>>({
    url: `${systemBase}/${baseUrl}/version/${detail}`,
    method: "get",
    params: {
      ...data
    }
  });

export const createScreenVersion = (data: CreateVersion, baseUrl = "largeScreen") =>
  serverRequest<BaseEntity<ScreenData>>({
    url: `${systemBase}/${baseUrl}/version/create`,
    method: "post",
    data
  });

// 发布大屏版本
export const publishScreenVersion = (data: ScreenVersion, baseUrl = "largeScreen") =>
  serverRequest<BaseEntity<ScreenItem>>({
    url: `${systemBase}/${baseUrl}/publish`,
    method: "post",
    data
  });

/**
 * 导出应用包 Agg
 * @param data formdata
 * @param base bi-system | online
 */
export const exportPackage = (data: { id: string | number; exportType: string; versionCode: string }) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => formData.append(key, value.toString()));
  formData.append("applicationCode", appCode);
  return request<BaseEntity<null>>({
    url: `${onlineBase}/largeScreen${suffix}/package`,
    method: "post",
    data: formData
  });
};

// 获取Minio ZIP文件
export const getMinoZip = (url: string) =>
  request<BaseEntity<any>>({
    url: `${MERGE_MINIO_BASE_URL || ""}${MERGE_MINIO_DEFAULT_PREFIX || ""}${url}`,
    method: "get",
    timeout: 0,
    responseType: "blob"
  });

// 导入大屏应用包
export const importScreenPackage = (formData: FormData, onProgress?: (event: ProgressEvent) => void) => {
  formData.append("applicationCode", appCode);
  return request({
    url: `${onlineBase}/largeScreen${suffix}/importLargeScreen`,
    method: "post",
    timeout: 0,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onProgress
  });
};

// 分片导入大屏应用包
export const importScreenPackageChunk = (data: any) => {
  const formData = new FormData();
  for (const k in data) {
    const item = data[k as keyof typeof data];
    formData.append(k, item);
  }
  formData.append("applicationCode", appCode);

  return request({
    url: `${onlineBase}/largeScreen${suffix}/uploadChunk`,
    method: "post",
    timeout: 0,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

interface MinioDownloadData {
  fileName: string;
  id: string | number;
  name: string;
  type: number;
  exportType: number;
  domain: string;
}

/**
 * 下载Minio文件 Agg
 * @param data 需要下载的文件信息
 * @returns 输出一个zip包地址
 */
export const downloadMinioFile = (data: MinioDownloadData) =>
  request<BaseEntity<string>>({
    url: `${onlineBase}/minio${suffix}/downloadFile`,
    method: "post",
    timeout: 0,
    data: {
      ...data,
      applicationCode: appCode
    }
  });

/**
 * 获取本地js文件
 * @param url 文件URL
 * @returns 文件内容
 */
export const getJSFile = (url: string) => {
  const { PUBLIC_PATH } = process.env;
  const curUrl = location.origin + (PUBLIC_PATH || "") + url;
  // const curUrl = /(data:image)|(http[s]?:\/\/)/.test(url)
  //   ? url
  //   : `${
  //       process.env.NODE_ENV === "production" ? WEB_APP_RESOURCE_BASE_URL || VUE_APP_RESOURCE_BASE_URL : location.origin
  //     }${url}`
  // console.log(WEB_APP_RESOURCE_BASE_URL, "WEB_APP_RESOURCE_BASE_URL")
  // console.log(VUE_APP_RESOURCE_BASE_URL, "VUE_APP_RESOURCE_BASE_URL")
  // console.log(curUrl, "curUrlcurUrlcurUrl")
  // console.log("PUBLIC_PATH", PUBLIC_PATH)
  return request({
    url: curUrl,
    method: "get",
    timeout: 0,
    responseType: "blob"
  });
};

// 组件分组模板 / 组合案例（groupLayerData/*）：依赖 Screenwright 内部素材云，开源版移除
