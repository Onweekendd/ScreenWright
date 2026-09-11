import type { BaseEntity } from "@/model/BaseEntity";
import type { SingleLayerInfoRes } from "@/model/Layer";
import { BaseName } from "@/utils/config";
import { serverRequest } from "@/utils/serverService";

// 图层 / 素材上传已回落 Screenwright（组合案例 groupLayerData/* 开源版移除）

/**
 * @method 获取指定id的组件信息
 * @param componentId 组件id
 * @returns 组件信息
 */
export const getLayerInfo = (componentId: number) => {
  return serverRequest<SingleLayerInfoRes>({
    url: `${BaseName.System}/layers/info/${componentId}?id=${componentId}`,
    method: "get"
  });
};
export const addLayers = (data: any) =>
  serverRequest<BaseEntity<any>>({
    url: `${BaseName.Online}/layers${BaseName.Suffix}/save`,
    method: "post",
    data: {
      ...data,
      applicationCode: BaseName.AppCode
    }
  });
export const minioUploadImageFile = (formdata: any, base = "/minio") => {
  formdata.append("applicationCode", BaseName.AppCode);
  return serverRequest<BaseEntity<any>>({
    url: `${BaseName.Online}${base}${BaseName.Suffix}/uploadFile`,
    method: "post",
    data: formdata,
    timeout: 0,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};
