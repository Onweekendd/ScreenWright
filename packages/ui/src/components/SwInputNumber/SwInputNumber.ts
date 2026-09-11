import { type InputNumberProps } from "element-plus";
import { isNumber } from "lodash-es";

export type FtInputNumberProps = {
  modelValue: number | string | undefined;
  unit?: string;
  bottomLabel?: string;
  width?: string | number;
  isInputChange?: boolean; // 是否开启输入事件，默认为 true
} & Partial<InputNumberProps>;

export const FtInputNumberEmits = {
  "update:modelValue": (value: number | string | undefined) => isNumber(value),
  change: (value: number | undefined) => isNumber(value),
  input: (value: number | undefined | null) => isNumber(value),
  focus: (evt: FocusEvent) => evt instanceof FocusEvent,
  blur: (evt: FocusEvent) => evt instanceof FocusEvent
};
export type FtInputNumberEmits = typeof FtInputNumberEmits;
