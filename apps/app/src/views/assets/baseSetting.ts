import IconAudio from "@/assets/icon/assets-icon-audio.png";
import IconChartlet from "@/assets/icon/assets-icon-chartlet.png";
import IconModal from "@/assets/icon/assets-icon-modal.png";
import IconPicture from "@/assets/icon/assets-icon-picture.png";
import IconVideo from "@/assets/icon/assets-icon-video.png";
import type { assetItem as assetItemProps } from "@/model/Assets";
import { ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

export const glbOptions = [
  {
    value: ResourceTypeEnum.threeModel,
    label: "模型",
    icon: IconModal
  },
  {
    value: ResourceTypeEnum.materialTexture,
    label: "材质贴图",
    icon: IconChartlet
  },
  {
    value: ResourceTypeEnum.geojson,
    label: "音频",
    icon: IconAudio
  }
];
export const radioOptions = [
  {
    value: ResourceTypeEnum.image,
    label: "图片", // 场景资产下特殊点，改为“图标”
    icon: IconPicture
  },
  {
    value: ResourceTypeEnum.video,
    label: "视频",
    icon: IconVideo
  }
];

export const iconTypeOptions = [
  {
    value: ResourceTypeEnum.image,
    label: "图标"
  },
  {
    value: ResourceTypeEnum.threeModel,
    label: "模型"
  },
  {
    value: ResourceTypeEnum.materialTexture,
    label: "材质贴图"
  }
];

export const materialTypeOptions = [...radioOptions, ...glbOptions];
// 获取素材类型的icon
export function getMaterialTypeIcon(assetItem: assetItemProps) {
  const resourceType = assetItem.resourceType;
  if (!resourceType) {
    const type = assetItem.url?.split(".").pop();
    if (assetItem.url && type === "glb") {
      return IconModal;
    }
  }
  return materialTypeOptions.find((item) => item.value === resourceType)?.icon || IconPicture;
}
