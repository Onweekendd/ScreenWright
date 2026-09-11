import { FtLabelTypeProps, FtLabelTypeEmits } from "./SwLabelType";
import { useVModel } from "@vueuse/core";
import { omit } from "lodash-es";
import { SetupContext, computed } from "vue";
import { ref } from "vue";
import { fontFamily } from "@/utils/index";
export const useSwLabelType = (props: FtLabelTypeProps, emit: SetupContext<FtLabelTypeEmits>["emit"]) => {
  const input = useVModel(props, "modelValue", emit);
  const options = ref(fontFamily);
  const handleChange = (key: string) => {
    if (!input.value) return;
    emit("change", key, input.value);
  };
  const omitProps = computed(() => {
    return omit(props, ["modelValue"]);
  });
  return {
    input,
    omitProps,
    options,
    handleChange
  };
};
