export interface FtLabelTypeProps {
  modelValue?: {
    fontFamily?: string
    fontSize?: number
  }
  isShowFontSize?: boolean
  selectWidth?: number
}

export const FtLabelTypeEmits = {
  change: (key: string, value: any) => true,
  "update:modelValue": (value: any) => true
}
export type FtLabelTypeEmits = typeof FtLabelTypeEmits
