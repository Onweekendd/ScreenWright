export interface FtRadioProps {
  modelValue?: any
  option?: Array<{ label: string; value: any; disabled?: boolean }>
  direction?: "row" | "column"
}

export const FtRadioEmits = {
  change: (value: any) => true,
  "update:modelValue": (value: any) => true
}
export type FtRadioEmits = typeof FtRadioEmits
