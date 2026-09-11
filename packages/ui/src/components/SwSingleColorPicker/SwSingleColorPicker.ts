export interface FtSingleColorPickerProps {
  modelValue?: string
  width?: string | number
  colorTypeOption?: "single" | "linear-gradient"
}

export const FtSingleColorPickerEmits = {
  change: (value: any) => true,
  "update:modelValue": (value: string) => true
}
export type FtSingleColorPickerEmits = typeof FtSingleColorPickerEmits
