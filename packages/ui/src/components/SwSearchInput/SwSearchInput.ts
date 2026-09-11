export interface FtSearchInputProps {
  modelValue?: string
  placeholder?: string
  size?: "large" | "default" | "small"
  clearable?: boolean
  valueKey?: string
  popperClass?: string
  queryData?: any[]
}

export const FtSearchInputEmits = {
  "update:modelValue": (value: string) => true,
  select: (item: any) => true,
  change: (value: string) => true,
  clear: () => true
}
export type FtSearchInputEmits = typeof FtSearchInputEmits
