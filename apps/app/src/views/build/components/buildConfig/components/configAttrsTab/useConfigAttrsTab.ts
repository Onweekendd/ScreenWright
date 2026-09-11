import type { SetupContext } from "vue";
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

import type { configAttrsTabEmits, configAttrsTabProps } from "./configAttrsTab";

export const useConfigAttrsTab = (props: configAttrsTabProps, emit: SetupContext<configAttrsTabEmits>["emit"]) => {
  const input = useVModel(props, "modelValue", emit);
  const options = computed(() => props.options);
  const handleChange = (value: string) => {
    if (!input.value) {
      return;
    }
    input.value = value;
    emit("change", input.value);
  };

  return {
    input,
    options,
    handleChange
  };
};
