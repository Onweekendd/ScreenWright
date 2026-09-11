import type { BaseEntity } from "@/model/BaseEntity";
import type { CreateVersion, ScreenData, ScreenVersion, updateScreenVersion } from "@/model/Version";
import type { ScreenItem } from "@/model/Visual";
import { BaseName } from "@/utils/config";
import { serverRequest } from "@/utils/serverService";
import { request } from "@/utils/service";

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

// 组件分组模板 / 组合案例（groupLayerData/*）：依赖 Screenwright 内部素材云，开源版移除
