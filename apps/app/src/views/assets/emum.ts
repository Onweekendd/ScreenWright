import type { Ref } from "vue";

import { type MenuItem } from "@/layout/Siderbar/components/config/menuConfig";

import { FileTypeEnum } from "../build/components/buildTabs/assetsEditFrom/type";

export const imgUploadAccept = [
  ".gif",
  ".jpg",
  ".jpeg",
  ".png",
  ".apng",
  ".svg",
  ".webp",
  ".GIF",
  ".JPG",
  ".PNG",
  ".WEBP"
];

export const videoUploadAccept = [
  ".swf",
  ".avi",
  ".flv",
  ".mpg",
  ".rm",
  ".mov",
  ".wav",
  ".asf",
  ".3gp",
  ".mkv",
  ".rmvb",
  ".ogg",
  ".mp4",
  ".webm"
];
// 上传-贴图-默认限制的格式
export const mapUploadAccept = [
  ".gif",
  ".jpg",
  ".jpeg",
  ".png",
  ".apng",
  ".svg",
  ".webp",
  ".GIF",
  ".JPG",
  ".PNG",
  ".WEBP",
  ".mp4",
  ".MP4",
  ".WEBM",
  ".webm"
];
// 上传 音频-默认限制的格式
export const audioUploadAccept = [".ogg", ".mp3", ".wav"];
// 上传 geoJSon-默认限制的格式
export const geoJsonUploadAccept = [".geojson", ".json", ".shp", ".zip"];
// 上传 模型-默认限制的格式
export const modalUploadAccept = [".glb", ".gltf", ".fbx", ".GLB", ".GLTF", ".FBX", ".ply", ".splat", ".ksplat"];
// 上传 hdr-默认限制的格式
export const hdrUploadAccept = [".hdr", ".HDR"];
// 上传 zip-默认限制的格式
export const zipUploadAccept = [".zip"];

export const getFileType = (currentNode: Ref<MenuItem | null>, treeData: Ref<MenuItem[]>): FileTypeEnum | null => {
  if (!currentNode.value) {
    return null;
  }
  const typeMap: { [key: string]: FileTypeEnum } = {
    pageGroups: FileTypeEnum.personalPageAssets,
    modelGroups: FileTypeEnum.personalSceneAssets
  };
  const targetName = currentNode.value.name;
  if (typeMap[targetName]) {
    return typeMap[targetName];
  }

  if (currentNode.value.pid) {
    const parent = treeData.value.find((item) => item.id === currentNode.value?.pid);
    if (parent && typeMap[parent.name]) {
      return typeMap[parent.name];
    }
  }
  return null;
};
