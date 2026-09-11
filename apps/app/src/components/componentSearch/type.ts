export interface tabsItem {
  label: string;
  value: string;
  getApi: (params: { current: number; size: number; name: string }) => Promise<any[]>;
}

export interface Props {
  modelValue: string;
  tabs: Array<tabsItem>;
}
export const searchTabsEmit = {
  "update:modelValue": (value: string) => typeof value === "string"
};
export type searchTabsEmits = typeof searchTabsEmit;
