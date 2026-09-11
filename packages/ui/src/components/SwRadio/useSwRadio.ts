import { FtRadioProps, FtRadioEmits } from "./SwRadio"
import { useVModel } from "@vueuse/core"
import { omit } from "lodash-es"
import { SetupContext, computed } from "vue"
export const useSwRadio = (props: FtRadioProps, emit: SetupContext<FtRadioEmits>["emit"]) => {
  const input = useVModel(props, "modelValue", emit)
  const handleChange = (value: any) => {
    input.value = value
    emit("change", value)
  }

  const omitProps = computed(() => {
    return omit(props, ["modelValue", "option"])
  })
  return {
    input,
    omitProps,
    handleChange
  }
}
