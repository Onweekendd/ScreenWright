import { type SliderProps } from "element-plus";
import { isNumber } from "lodash-es";
export type valueType = number | undefined;
export type FtSliderProps = {
  modelValue: valueType;
  unit?: string;
  showNumberInput?: boolean;
  width?: string | number;
} & Partial<SliderProps>;

export const FtSliderEmits = {
  "update:modelValue": (value: valueType) => isNumber(value),
  change: (value: valueType) => isNumber(value)
};
export type FtSliderEmits = typeof FtSliderEmits;
