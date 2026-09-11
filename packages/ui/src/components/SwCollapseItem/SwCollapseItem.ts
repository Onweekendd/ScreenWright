import { isString } from "lodash-es"

export interface FtCollapseItemProps {
  title?: string
  disabled?: boolean
  modelValue?: any
  open?: boolean
  showIcon?: boolean
}

export const FtCollapseItemEmits = {
  "update:modelValue": (value: any) => true,
  change: (value: boolean) => true
}
export type FtCollapseItemEmits = typeof FtCollapseItemEmits
