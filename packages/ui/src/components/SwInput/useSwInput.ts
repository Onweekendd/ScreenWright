import type { SetupContext } from "vue";
import { computed, watch, ref } from "vue";
import type { FtInputEmits, FtInputProps } from "./input";
import { isNumber, omit } from "lodash-es";

export const useSwInput = (props: FtInputProps, emit: SetupContext<FtInputEmits>["emit"]) => {
  const input = ref<string | number>("");

  const ftStyle = computed(() => {
    if (!props.width) {
      return {
        width: "100%"
      };
    }
    if (isNumber(props.width)) {
      return {
        width: props.width + "px"
      };
    }
    return {
      width: props.width.includes("%") ? props.width : props.width + "px"
    };
  });
  const cHeight = computed(() => {
    if (props.height) {
      if (typeof props.height === "number") {
        return `${props.height}px`;
      } else {
        return props.height;
      }
    } else {
      return "26px";
    }
  });

  const omitProps = computed(() => {
    return omit(props, ["modelValue", "unit", "unitPosition", "width"]);
  });

  watch(
    () => props.modelValue,
    (nVal) => {
      input.value = nVal;
    },
    {
      immediate: true
    }
  );

  const handleInput = (value: string) => {
    emit("update:modelValue", value);
    emit("input", value);
  };

  const handleChange = (value: string) => {
    emit("update:modelValue", value);
    emit("change", value);
  };

  const handleFocus = (evt: FocusEvent) => {
    emit("focus", evt);
  };

  const handleBlur = (evt: FocusEvent) => {
    emit("blur", evt);
  };

  const handleClear = () => {
    emit("update:modelValue", "");
    emit("clear");
  };

  return {
    ftStyle,
    input,
    omitProps,
    cHeight,
    handleInput,
    handleChange,
    handleFocus,
    handleBlur,
    handleClear
  };
};
