import { useGenericAttrs } from "../../chartComponent/useGenericAttrs";

export enum TypeAttrs {
  echartradar = "echartradar",
  RosePie = "RosePie",
  ScalePie = "ScalePie"
}
export interface configDistanceProps {
  type: TypeAttrs;
  isShowBarCategoryGap?: boolean;
}
interface keyAttrs {
  x: string;
  y: string;
  max: string;
  Min: string;
  barCategoryGap: string;
}
const mapTypeToAttrs: Record<TypeAttrs, keyAttrs> = {
  [TypeAttrs.echartradar]: {
    x: "radarCenterX",
    y: "radarCenterY",
    max: "radarRadiusMax",
    Min: "radarRadiusMin",
    barCategoryGap: "barCategoryGap"
  },
  [TypeAttrs.RosePie]: {
    x: "polarCenterX",
    y: "polarCenterY",
    max: "polarRadiusMax",
    Min: "polarRadiusMin",
    barCategoryGap: "barCategoryGap"
  },
  [TypeAttrs.ScalePie]: {
    x: "pieCenterX",
    y: "pieCenterY",
    max: "pieRadiusMax",
    Min: "pieRadiusMin",
    barCategoryGap: "pieRadiusGap"
  }
};
export const useConfigPieStyle = (props: configDistanceProps) => {
  return useGenericAttrs(props, mapTypeToAttrs);
};
