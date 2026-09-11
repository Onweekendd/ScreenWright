import { useGenericAttrs } from "./useGenericAttrs";

export enum TypeAttrs {
  children = "children",
  parent = "parent",
}
export interface Props {
  type: TypeAttrs;
  title: string;
}
interface keyAttrs {
  color: string;
  width: string;
}
const mapTypeToAttrs: Record<TypeAttrs, keyAttrs> = {
  [TypeAttrs.children]: {
    color: "seriesChildBorderColor",
    width: "seriesChildBorderWidth",
  },
  [TypeAttrs.parent]: {
    color: "seriesBorderColor",
    width: "seriesBorderWidth",
  },
};
export const useDistanceConfig = (props: Props) => {
  return useGenericAttrs(props, mapTypeToAttrs);
};
