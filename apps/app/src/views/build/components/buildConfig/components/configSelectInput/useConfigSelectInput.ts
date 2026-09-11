import type { SetupContext } from "vue";
import { computed, ref, watch } from "vue";

import { isUndefined } from "lodash-es";

import type { configSelectInputEmits, configSelectInputProps } from "./configSelectInput";
import { Attrs } from "./configSelectInput";

export const useConfigSelectInput = (
  props: configSelectInputProps,
  emit: SetupContext<configSelectInputEmits>["emit"]
) => {
  const w = ref(0);
  const h = ref(0);
  const selectValue = computed({
    // getter 方法，返回拼接后的完整姓名
    get() {
      return `${w.value},${h.value}`;
    },
    set(newValue) {
      transFormValue(newValue);
    }
  });
  watch(
    () => props.width,
    (nVal) => {
      const width = Number(nVal);
      w.value = width;
    },
    {
      immediate: true
    }
  );
  watch(
    () => props.height,
    (nVal) => {
      const height = Number(nVal);
      h.value = height;
    },
    {
      immediate: true
    }
  );

  const transFormValue = (value: string) => {
    let target = value;
    if (target === "自定义尺寸") {
      target = "1920*1080";
    }
    const values = target.split("*");
    w.value = Number(values[0]) || 0;
    h.value = Number(values[1]) || 0;
  };

  const handleWidthChange = (value: number | undefined) => {
    if (isUndefined(value)) {
      return;
    }
    emit("update:width", value);

    emit("change", Attrs.width, value);
  };
  const handleHeightChange = (value: number | undefined) => {
    if (isUndefined(value)) {
      return;
    }
    emit("update:height", value);
    emit("change", Attrs.height, value);
  };

  const handleSelectValueChange = (value: string) => {
    transFormValue(value);
    emit("update:width", w.value);
    emit("update:height", h.value);
    emit("change", Attrs.selectValue, value);
  };

  return {
    w,
    h,
    selectValue,
    handleWidthChange,
    handleSelectValueChange,
    handleHeightChange
  };
};
