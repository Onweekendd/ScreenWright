export interface FtGridButtonProps {
  modelValue: {
    top?: string | number
    left?: string | number
    right?: string | number
    bottom?: string | number
  }
}

export const FtGridButtonEmits = {
  change: (value: any) => true,
  "update:modelValue": (value: any) => true
}
export type FtGridButtonEmits = typeof FtGridButtonEmits
