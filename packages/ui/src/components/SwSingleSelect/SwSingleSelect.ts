export interface FtSingleSelectProps {
  modelValue?: string
  option?: Array<{
    label: string
    value: string
    cover?: string
  }>
  filterable?: boolean
  clearable?: boolean
  showImage?: boolean
  isSquareImage?: boolean
  isNotValueHideImage?: boolean
}

export const FtSingleSelectEmits = {
  "update:modelValue": (value: string) => true,
  change: (value: string) => true,
  handleSelect: (value: string, oldValue: string) => true
}
export type FtSingleSelectEmits = typeof FtSingleSelectEmits
