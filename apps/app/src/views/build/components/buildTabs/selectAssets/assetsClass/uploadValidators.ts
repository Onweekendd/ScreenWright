import { ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

/**
 * 获取文件扩展名（小写）
 * @param filename 文件名
 * @returns 文件扩展名（不含点号）
 */
function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return "";
  }
  return filename.slice(lastDotIndex + 1).toLowerCase();
}

/**
 * 检查文件是否为压缩文件（根据扩展名）
 * @param file 文件对象
 * @returns 是否为压缩文件
 */
function isCompressedFile(file: File): boolean {
  const ext = getFileExtension(file.name);
  const compressedExts = ["zip", "7z", "rar", "gz", "tar"];
  return compressedExts.includes(ext);
}

/**
 * 资源类型到文件接受类型的映射
 */
export const RESOURCE_ACCEPT_MAP = new Map<ResourceTypeEnum, string>([
  [ResourceTypeEnum.image, "image/jpeg,image/png,image/gif,image/webp"],
  [ResourceTypeEnum.video, "video/mp4,video/webm,video/ogg"],
  [ResourceTypeEnum.threeModel, ".zip,.7z,.rar,.gz,.tar,.glb,.gltf,.fbx,.GLB,.GLTF,.FBX,.ply,.splat,.ksplat"],
  [ResourceTypeEnum.materialTexture, "image/hdr,image/exr"],
  [ResourceTypeEnum.geojson, ".json,.geojson,.zip"],
  [ResourceTypeEnum.skyBoxZipOrPdf, ".zip,.7z,.rar,.gz,.tar"]
]);

/**
 * 资源类型到文件验证函数的映射
 * 注意：压缩文件类型现在根据文件扩展名判断，而不是 MIME 类型
 */
export const RESOURCE_FILE_VALIDATORS: Record<ResourceTypeEnum, (file: File) => boolean> = {
  [ResourceTypeEnum.threeModel]: (file: File) => isCompressedFile(file),
  [ResourceTypeEnum.image]: (file: File) => file.type.startsWith("image/"),
  [ResourceTypeEnum.video]: (file: File) => file.type.startsWith("video/"),
  [ResourceTypeEnum.materialTexture]: (file: File) =>
    file.type === "image/hdr" || file.type === "image/exr" || file.type.startsWith("image/"),
  [ResourceTypeEnum.geojson]: (file: File) => {
    const ext = getFileExtension(file.name);
    return (
      ["json", "geojson", "zip"].includes(ext) ||
      file.type === "application/json" ||
      file.type === "application/geo+json"
    );
  },
  [ResourceTypeEnum.skyBoxZipOrPdf]: (file: File) => isCompressedFile(file)
};

/**
 * 资源类型到中文名称的映射
 */
export const RESOURCE_TYPE_NAMES: Record<ResourceTypeEnum, string> = {
  [ResourceTypeEnum.image]: "图片",
  [ResourceTypeEnum.video]: "视频",
  [ResourceTypeEnum.threeModel]: "三维模型压缩包",
  [ResourceTypeEnum.materialTexture]: "材质贴图",
  [ResourceTypeEnum.geojson]: "GeoJSON",
  [ResourceTypeEnum.skyBoxZipOrPdf]: "天空盒压缩包"
};

/**
 * 根据资源类型获取 accept 字符串
 * @param type 资源类型
 * @returns accept 字符串
 */
export function getAcceptByResourceType(type: ResourceTypeEnum): string {
  return RESOURCE_ACCEPT_MAP.get(type) || RESOURCE_ACCEPT_MAP.get(ResourceTypeEnum.threeModel)!;
}

/**
 * 根据资源类型验证文件
 * @param file 文件对象
 * @param type 资源类型
 * @returns 验证结果
 */
export function validateFileByResourceType(file: File, type: ResourceTypeEnum): { success: boolean; message: string } {
  const validator = RESOURCE_FILE_VALIDATORS[type];

  if (!validator) {
    return {
      success: false,
      message: `不支持的资源类型`
    };
  }

  const isValid = validator(file);

  if (!isValid) {
    const typeName = RESOURCE_TYPE_NAMES[type] || "文件";
    return {
      success: false,
      message: `请上传${typeName}文件`
    };
  }

  return {
    success: true,
    message: "验证通过"
  };
}

/**
 * 获取资源类型的中文名称
 * @param type 资源类型
 * @returns 中文名称
 */
export function getResourceTypeName(type: ResourceTypeEnum): string {
  return RESOURCE_TYPE_NAMES[type] || "文件";
}
