export interface FtCoordinateTabsProps {
  modelValue: string
  option: Array<{ label: string; value: string }>
}

export const FtCoordinateTabsEmits = {
  change: (value: string) => true,
  "update:modelValue": (value: string) => true
}
export type FtCoordinateTabsEmits = typeof FtCoordinateTabsEmits
