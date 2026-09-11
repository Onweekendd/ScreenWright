import { FileType, type FtUploadChangePayload, type UploadFn } from "@screenwright/composables";
import { ElMessage } from "element-plus";

import { uploadMinioScene } from "@/api/assets";
import router from "@/router";
import { BaseName, setMinioUrl } from "@/utils/config";
import { batchCompressPic } from "@/utils/utils";
import { FileTypeEnum, ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

const resourceTypeMap: Record<FileType, ResourceTypeEnum> = {
  [FileType.img]: ResourceTypeEnum.image,
  [FileType.video]: ResourceTypeEnum.video,
  [FileType.audio]: ResourceTypeEnum.video,
  [FileType.model]: ResourceTypeEnum.threeModel,
  [FileType.imgAndVideo]: ResourceTypeEnum.video,
  [FileType.file]: ResourceTypeEnum.video
};

export const uploadFile: UploadFn = async (file, fileType) => {
  const resourceType = resourceTypeMap[fileType] ?? ResourceTypeEnum.image;
  const uploadFileRaw = resourceType === ResourceTypeEnum.image ? await batchCompressPic(file, 4) : file;
  const routeId = router.currentRoute.value.params.id;

  const res = await uploadMinioScene({
    name: uploadFileRaw.name,
    resourceType,
    fileType: FileTypeEnum.personalScreen,
    largeId: Array.isArray(routeId) ? routeId[0] : routeId,
    groupId: "",
    file: uploadFileRaw,
    coverFile: null,
    coverFileUrl: null,
    fileUrl: null,
    applicationCode: BaseName.AppCode
  });

  if (!res.success) {
    ElMessage.error(res.message || "上传失败，请稍后再试");
    return null;
  }

  return { ...res.result, url: setMinioUrl(res.result.url) } as FtUploadChangePayload;
};

export const toAssetsPayload = (validated: any): FtUploadChangePayload | null => {
  if (!validated?.url) {
    return null;
  }
  return { ...validated, url: setMinioUrl(validated.url) };
};
