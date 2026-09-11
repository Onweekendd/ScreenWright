import { FtSliderProps, FtSliderEmits } from "./SwSlider";
import { useVModel } from "@vueuse/core";
import { omit } from "lodash-es";
import { SetupContext, computed } from "vue";
export const useSwSlider = (props: FtSliderProps, emit: SetupContext<FtSliderEmits>["emit"]) => {
  const input = useVModel(props, "modelValue", emit);
  const handleChange = (value: any) => {
    input.value = value;
    emit("change", value);
  };
  const omitProps = computed(() => {
    return omit(props, ["modelValue", "unit", "width"]);
  });
  return {
    input,
    omitProps,
    handleChange
  };
};
