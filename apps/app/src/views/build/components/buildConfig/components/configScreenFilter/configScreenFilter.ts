import type { ScreenFilterInfo } from "@screenwright/types";

export type { ScreenFilterInfo };
export interface configScreenFilterProps {
  modelValue: ScreenFilterInfo | undefined;
}

export const configScreenFilterEmits = {
  "update:modelValue": (key: keyof ScreenFilterInfo, value: ScreenFilterInfo) => {
    return key !== undefined && value !== undefined;
  },
  change: (key: keyof ScreenFilterInfo, value: ScreenFilterInfo) => {
    return key !== undefined && value !== undefined;
  }
};
export type configScreenFilterEmits = typeof configScreenFilterEmits;
