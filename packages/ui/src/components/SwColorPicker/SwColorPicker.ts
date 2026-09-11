// import { XNColorPickerOptions } from "@/components/ScreenwrightColorPicker/colorPicker"

// 定义颜色类型
type ColorValue = string | { type: string; angle: number; colors: Array<{ color: string; per: number }> }

export interface FtColorPickerProps {
  modelValue?: any
  color?: ColorValue
  opacity?: string | number
  inputDisabled?: boolean
  returnType?: "str" | "arry"
  options?: any
  inputWidth?: string | number
}

export const FtColorPickerEmits = {
  "update:color": (value: ColorValue) => true,
  "update:opacity": (value: number) => true,
  "update:modelValue": (value: any) => true,
  change: (value: any) => true
}
export type FtColorPickerEmits = typeof FtColorPickerEmits
