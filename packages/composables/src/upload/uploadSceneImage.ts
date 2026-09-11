import { serverRequest } from "../ports/httpPort";
import { BaseName } from "../utils/baseName";
import { batchCompressPic } from "../utils/imageCompress";
import { FileTypeEnum, ResourceTypeEnum } from "./enums";

/**
 * 场景图片上传（下沉自 app `initSceneImageUpload` 的注入实现）。
 * 压缩 + minio 场景上传；`largeId` / `applicationCode` 由调用方传入（元素周期表等 3D 面板场景）。
 */
export type SceneImageUploadResult = { url: string } | null;

export interface SceneImageUploadContext {
  largeId?: string | number;
  applicationCode?: string;
}

interface SceneImageUploadResponse {
  code: number;
  result: { url: string };
}

export const uploadSceneImage = async (
  file: File,
  maxSizeMB: number = 4,
  context?: SceneImageUploadContext
): Promise<SceneImageUploadResult> => {
  const compressed = await batchCompressPic(file, maxSizeMB);

  const formData = new FormData();
  formData.append("name", compressed.name);
  formData.append("resourceType", String(ResourceTypeEnum.image));
  formData.append("fileType", String(FileTypeEnum.personalScreen));
  formData.append("largeId", String(context?.largeId ?? ""));
  formData.append("groupId", "");
  formData.append("file", compressed);
  formData.append("applicationCode", context?.applicationCode ?? "");

  const res = await serverRequest<SceneImageUploadResponse>({
    url: `${BaseName.Online}/minioAgg/uploadFile`,
    method: "post",
    data: formData,
    showLoading: true,
    timeout: 0
  });

  return res.code === 200 ? { url: res.result.url } : null;
};
