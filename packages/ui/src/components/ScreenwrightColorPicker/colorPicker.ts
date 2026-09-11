export interface XNColorPickerOptions {
  color: string
  selector: string
  showprecolor?: boolean
  prevcolors?: string[] | null
  showhistorycolor?: boolean
  historycolornum?: number
  format?: string
  showPalette?: boolean
  show?: boolean
  lang?: string
  colorTypeOption?: string
  canMove?: boolean
  alwaysShow?: boolean
  autoConfirm?: boolean
  onError?: (_e: any) => void
  onCancel?: (color: any) => void
  onChange?: (color: any) => void
  onConfirm?: (color: any) => void
  hideOpacity?: boolean
  hideInputer?: boolean
  hideCancelButton?: boolean
  hideConfirmButton?: boolean
  [key: string]: any
}

export interface Props {
  modelValue: any
  returnType?: string
  options?: Partial<XNColorPickerOptions>
  border?: boolean
}
