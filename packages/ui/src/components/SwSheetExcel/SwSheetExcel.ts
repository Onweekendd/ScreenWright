export interface FtSheetExcelProps {
  dataTable?: Array<any>
  mode?: "edit" | "read"
  button?: boolean
  width?: number
  height?: number
  showOverlayer?: boolean
}

export const FtSheetExcelEmits = {
  change: (value: any) => true,
  confirm: (value: any) => true
}
export type FtSheetExcelEmits = typeof FtSheetExcelEmits
