import type { ComponentType } from "@screenwright/types";
import { isObject } from "lodash-es";

export interface ftTurnPageProps {
  element: ComponentType;
}

export const FtTurnPageEmits = {
  init: (element: ComponentType) => isObject(element),
  update: (element: ComponentType) => isObject(element),
  flip: (element: ComponentType) => isObject(element),
  changeOrientation: (element: ComponentType) => isObject(element),
  changeState: (element: ComponentType) => isObject(element),
};
export type FtTurnPageEmits = typeof FtTurnPageEmits;
