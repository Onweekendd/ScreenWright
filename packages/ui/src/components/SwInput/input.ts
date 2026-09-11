import { type InputProps } from "element-plus"
import { isString } from "lodash-es"

export type FtInputProps = {
  modelValue: string | number
  unit?: string
  width?: string | number
  height?: string | number
  bottomLabel?: string
  componentHeight?: string
} & Partial<InputProps>

export const FtInputEmits = {
  "update:modelValue": (value: string) => isString(value),
  input: (value: string) => isString(value),
  change: (value: string) => isString(value),
  focus: (evt: FocusEvent) => evt instanceof FocusEvent,
  blur: (evt: FocusEvent) => evt instanceof FocusEvent,
  clear: () => true
}
export type FtInputEmits = typeof FtInputEmits
