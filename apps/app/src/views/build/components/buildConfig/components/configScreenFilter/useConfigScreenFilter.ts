import type { SetupContext } from "vue";
import { useVModel } from "@vueuse/core";

import type { configScreenFilterEmits, configScreenFilterProps, ScreenFilterInfo } from "./configScreenFilter";

export const useConfigScreenFilter = (
  props: configScreenFilterProps,
  emit: SetupContext<configScreenFilterEmits>["emit"]
) => {
  const input = useVModel(props, "modelValue", emit);
  const handleChange = (key: keyof ScreenFilterInfo) => {
    if (!input.value) return;
    emit("change", key, input.value);
  };
  return {
    input,
    handleChange
  };
};
