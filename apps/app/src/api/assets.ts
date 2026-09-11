import type { FileResourceInfo } from "@/components/SwUpload/SwUpload";
import type { assetItemReq, DetailListRes, LargeUseRes, uploadFileReq, UsedSizeRes } from "@/model/Assets";
import type { BaseEntity } from "@/model/BaseEntity";
import { BaseName } from "@/utils/config";
import { serverRequest } from "@/utils/serverService";
import type { FileTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

const getFormData = (data = {}) => {
  const formData = new FormData();
  for (const k in data) {
    const item = data[k as keyof typeof data];
    formData.append(k, item);
  }
  return formData;
};
export const getVisualAssetUsedSize = () =>
  serverRequest<UsedSizeRes>({
    url: `${BaseName.Online}/minioAgg/size/BI`,
    method: "get",
    showLoading: true
  });

/**
 * 素材列表数据
 */
export const getVisualAssetDetailList = (data: assetItemReq, base = "/minio") =>
  serverRequest<DetailListRes>({
    url: `${BaseName.System}${base}/page`,
    method: "post",
    data,
    showLoading: true
  });

// minio获取文件大屏使用情况
export const minioGetLargeUse = (id: string | number, base = "/minio") =>
  serverRequest<LargeUseRes>({
    url: `${BaseName.System}${base}/getLargeUse/${id || ""}`,
    method: "get"
  });
// minio三维场景中间表-复制
export const copyMinioScene = (id: string | number) => {
  const formData = new FormData();
  formData.append("id", id.toString());
  formData.append("applicationCode", BaseName.AppCode);
  return serverRequest<BaseEntity<any>>({
    url: `${BaseName.Online}/minioAgg/copy/`,
    method: "post",
    data: formData
  });
};
// 删除素材
export const deleteMinioScene = (id: string | number) =>
  serverRequest<BaseEntity<any>>({
    url: `${BaseName.System}/minio/deleteFile/${id}`,
    method: "delete"
  });

// 批量删除素材
export const deleteBatchMinioScene = (data: { fileType: FileTypeEnum; ids: string }) =>
  serverRequest<BaseEntity<any>>({
    url: `${BaseName.System}/minio/deleteBatch`,
    method: "delete",
    data
  });

// 上传素材
export const uploadMinioScene = (formData: uploadFileReq) => {
  return serverRequest<BaseEntity<FileResourceInfo>>({
    url: `${BaseName.Online}/minioAgg/uploadFile`,
    method: "post",
    data: getFormData(formData),
    showLoading: true,
    timeout: 0
  });
};
// 大屏封面-上传资源
export const minioUploadFile = (params: any) =>
  serverRequest<BaseEntity<any>>({
    url: `${BaseName.System}/minio/uploadFile`,
    method: "post",
    data: params,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
// 获取素材详情
export const getMinioScene = (id: string | number) =>
  serverRequest<BaseEntity<any>>({
    url: `${BaseName.System}/minio/info/${id}`,
    method: "get"
  });

// 更新素材详情
export const updateFileScene = (formData: uploadFileReq) =>
  serverRequest<BaseEntity<any>>({
    url: `${BaseName.Online}/minioAgg/updateFile`,
    method: "post",
    data: getFormData(formData),
    showLoading: true
  });

// 素材库 资产库 和本应用资产
export const minioGroupList = () =>
  serverRequest<BaseEntity<any>>({
    url: `${BaseName.System}/minioGroup/list`,
    method: "get",
    showLoading: false
  });

/**
 * 本应用资产 资产库
 * @param data
 * @returns
 */
export const minioPage = (data: assetItemReq) =>
  serverRequest<DetailListRes>({
    url: `${BaseName.System}/minio/page`,
    method: "post",
    showLoading: false,
    data
  });

// 组合案例 / 用户资产（groupLayerData/*）、系统素材（minioLargeSystem/*）：依赖 Screenwright 内部素材云，开源版移除

// 分组列表数据
export const getAssetsGroup = (base = "/minioGroup") =>
  serverRequest<BaseEntity<any>>({
    url: `${BaseName.System}${base}/list`,
    method: "get"
  });

// 代码包 / 自定义组件功能已移除
