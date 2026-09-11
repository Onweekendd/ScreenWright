import type { XAxisType } from "./type";
import type { TypeAttrs } from "./useAttrsByReverse";

export interface xAxisTabProps {
  modelValue: XAxisType;
  type?: TypeAttrs;
}

export const xAxisTabEmits = {
  "update:modelValue": (value: XAxisType) => value,
  change: (value: XAxisType) => value
};
export type xAxisTabEmits = typeof xAxisTabEmits;
