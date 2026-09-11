import { useGenericAttrs } from "../../chartComponent/useGenericAttrs";

export enum TypeAttrs {
  pie = "pie",
  bar = "bar",
  zebra = "zebra",
  rosePie = "rosePie"
}
export interface configDistanceProps {
  type: TypeAttrs;
}
interface keyAttrs {
  top: string;
  bottom: string;
  right: string;
  left: string;
}
const mapTypeToAttrs: Record<TypeAttrs, keyAttrs> = {
  [TypeAttrs.pie]: {
    top: "seriesTop",
    bottom: "seriesBottom",
    left: "seriesLeft",
    right: "seriesRight"
  },
  [TypeAttrs.bar]: {
    top: "gridTop",
    bottom: "gridBottom",
    left: "gridLeft",
    right: "gridRight"
  },
  [TypeAttrs.zebra]: {
    top: "tooltipPaddingTop",
    bottom: "tooltipPaddingBottom",
    left: "tooltipPaddingLeft",
    right: "tooltipPaddingRight"
  },
  [TypeAttrs.rosePie]: {
    top: "radiusAxisNamePaddingTop",
    bottom: "radiusAxisNamePaddingBottom",
    left: "radiusAxisNamePaddingLeft",
    right: "radiusAxisNamePaddingRight"
  }
};
export const useAttrsByType = (props: configDistanceProps) => {
  return useGenericAttrs(props, mapTypeToAttrs);
};
