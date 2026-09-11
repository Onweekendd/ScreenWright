import type { SetupContext } from "vue";
import { useVModel } from "@vueuse/core";

import type { configWaterEmits, configWaterProps, WaterMark } from "./configWater";

export const useWaterConfig = (props: configWaterProps, emit: SetupContext<configWaterEmits>["emit"]) => {
  const input = useVModel(props, "modelValue", emit);
  const handleChange = (key: keyof WaterMark) => {
    if (!input.value) return;
    emit("change", key, input.value);
  };
  return {
    input,
    handleChange
  };
};
