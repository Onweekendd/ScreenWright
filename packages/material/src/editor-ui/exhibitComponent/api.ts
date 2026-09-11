import { BaseName, request } from "@screenwright/composables";

/**
 * 展项配置面板用到的素材库接口（下沉副本），与 app `@/api/assets` 同行为。
 * 物料包不反向依赖主包 api，统一走 @screenwright/composables 注入的 request。
 */
const getFormData = (data: Record<string, any> = {}) => {
  const formData = new FormData();
  for (const k in data) {
    formData.append(k, data[k]);
  }
  return formData;
};

/** 上传素材到 minio */
export const uploadMinioScene = (formData: Record<string, any>): Promise<any> =>
  request({
    url: `${BaseName.Online}/minioAgg/uploadFile`,
    method: "post",
    data: getFormData(formData),
    showLoading: true,
    timeout: 0
  });

/** 本应用资产 / 素材库分页 */
export const minioPage = (data: Record<string, any>): Promise<any> =>
  request({
    url: `${BaseName.System}/minio/page`,
    method: "post",
    showLoading: false,
    data
  });
