import { threeSceneQualityEnum } from "./enum";
// 通用接口定义
import type { dictString } from "./type";

// 场景质量
export const threeSceneQuality: dictString[] = [
  {
    label: "原始",
    value: threeSceneQualityEnum.Original
  },
  {
    label: "流畅",
    value: threeSceneQualityEnum.Low
  }
];
