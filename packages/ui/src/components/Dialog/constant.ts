import type { InjectionKey } from "vue"
export type DialogContext = {
  confirm: () => void
  cancel: () => void
}
export const dialogInjectionKey: InjectionKey<DialogContext> = Symbol("dialogInjectionKey")
