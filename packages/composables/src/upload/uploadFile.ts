import { serverRequest } from "../ports/httpPort";
import type { FileType, FtUploadChangePayload } from "../ports/uploadPort";
import { BaseName } from "../utils/baseName";
import { batchCompressPic } from "../utils/imageCompress";
import { FileTypeEnum, ResourceTypeEnum } from "./enums";

/**
 * SwUpload 通用上传（下沉自 app `@/utils/materialUpload` 的 uploadFile）。
 * 图片自动压缩、其余文件类型直传，统一走 Screenwright 的 `${BaseName.Online}/minioAgg/uploadFile`。
 * 基于 httpPort.serverRequest，`largeId` 由调用方传入（use 包不依赖 router）。
 */
const resourceTypeMap: Record<string, ResourceTypeEnum> = {
  img: ResourceTypeEnum.image,
  video: ResourceTypeEnum.video,
  audio: ResourceTypeEnum.video,
  model: ResourceTypeEnum.threeModel,
  imgAndVideo: ResourceTypeEnum.video,
  file: ResourceTypeEnum.video
};

interface UploadFileResponse {
  success: boolean;
  message?: string;
  result: { url: string; [key: string]: any };
}

export const uploadFile = async (
  file: File,
  fileType: FileType,
  largeId?: string | number
): Promise<FtUploadChangePayload | null> => {
  const resourceType = resourceTypeMap[fileType] ?? ResourceTypeEnum.image;
  const uploadFileRaw = resourceType === ResourceTypeEnum.image ? await batchCompressPic(file, 4) : file;

  const formData = new FormData();
  formData.append("name", uploadFileRaw.name);
  formData.append("resourceType", String(resourceType));
  formData.append("fileType", String(FileTypeEnum.personalScreen));
  formData.append("largeId", String(largeId ?? ""));
  formData.append("groupId", "");
  formData.append("file", uploadFileRaw);
  formData.append("applicationCode", BaseName.AppCode);

  const res = await serverRequest<UploadFileResponse>({
    url: `${BaseName.Online}/minioAgg/uploadFile`,
    method: "post",
    data: formData,
    showLoading: true,
    timeout: 0
  });

  if (!res.success) {
    return null;
  }

  // 返回后端原始相对路径（如 /version-test/resource/...），不在此拼接 minio 域名，
  // 由消费方（SwUpload）存相对路径、仅在展示时用 setMinioUrl 拼域名，避免把域名写进 modelValue。
  return { ...res.result } as FtUploadChangePayload;
};
