import type { WaterMark } from "@screenwright/types";

export type { WaterMark };
export interface configWaterProps {
  modelValue: WaterMark | undefined;
}

export const configWaterEmits = {
  "update:modelValue": (key: keyof WaterMark, value: WaterMark) => {
    return key !== undefined && value !== undefined;
  },
  change: (key: keyof WaterMark, value: WaterMark) => {
    return key !== undefined && value !== undefined;
  }
};
export type configWaterEmits = typeof configWaterEmits;
