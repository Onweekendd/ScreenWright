import type { SetupContext } from "vue";
import { computed, watch, ref, onBeforeUnmount } from "vue";
import type { FtInputNumberEmits, FtInputNumberProps } from "./SwInputNumber";
import { debounce, isNil, isNumber, omit } from "lodash-es";

export const useSwInputNumber = (props: FtInputNumberProps, emit: SetupContext<FtInputNumberEmits>["emit"]) => {
  const input = ref<number>(0);

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

  const omitProps = computed(() => {
    return omit(props, ["modelValue", "unit", "unitPosition", "width"]);
  });
  function parsePixelValue(value: string | number) {
    // 检查是否为字符串
    if (typeof value !== "string") {
      return value; // 非字符串直接返回
    }

    // 去除首尾空白字符并转换为小写
    const lowerCaseValue = value.trim().toLowerCase();

    // 检查是否以"px"结尾
    if (lowerCaseValue.endsWith("px")) {
      // 提取数值部分并转换为数字
      const numericValue = parseFloat(lowerCaseValue);
      // 验证转换结果是否为有效数字
      return isNaN(numericValue) ? value : numericValue;
    }

    // 处理非px单位或纯数字字符串
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  watch(
    () => props.modelValue,
    (nVal) => {
      if (nVal === undefined) {
        input.value = 0;
      } else {
        input.value = parsePixelValue(nVal) as number;
      }
    },
    {
      immediate: true
    }
  );
  const emitInput = (currentValue: number | undefined | null) => {
    if (!isNil(currentValue)) {
      emit("update:modelValue", currentValue);
    }
    if (props.isInputChange) {
      if (!isNil(currentValue)) {
        emit("change", currentValue);
      }
    } else {
      emit("input", currentValue);
    }
  };
  const debouncedEmitInput = debounce(emitInput, 50);

  onBeforeUnmount(() => {
    debouncedEmitInput.cancel();
  });

  const handleInput = (currentValue: number | undefined | null) => {
    debouncedEmitInput(currentValue);
  };
  const handleChange = (currentValue: number | undefined) => {
    if (!props.isInputChange) {
      emit("update:modelValue", currentValue);
      emit("change", currentValue);
    }
  };

  const handleFocus = (evt: FocusEvent) => {
    emit("focus", evt);
  };

  const handleBlur = (evt: FocusEvent) => {
    emit("blur", evt);
  };

  return {
    ftStyle,
    input,
    omitProps,
    handleChange,
    handleFocus,
    handleBlur,
    handleInput
  };
};
