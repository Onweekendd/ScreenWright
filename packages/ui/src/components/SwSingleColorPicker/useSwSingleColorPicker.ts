import type { SetupContext } from "vue";
import { watch, ref } from "vue";
import { convertRgbaToHexAndAlpha, changeRgbaAlpha, hexToRgba } from "./utils";
import type { FtSingleColorPickerEmits, FtSingleColorPickerProps } from "./SwSingleColorPicker";
import { isNil } from "lodash-es";
export const useSwSingleColorPicker = (
  props: FtSingleColorPickerProps,
  emit: SetupContext<FtSingleColorPickerEmits>["emit"]
) => {
  const hexColor = ref<string>("");
  const alpha = ref<number>(0);
  const rgbaColor = ref<string>("");

  watch(
    () => props.modelValue,
    (nVal) => {
      if (isNil(nVal)) {
        return;
      }
      rgbaColor.value = nVal;
      const { hex, alpha: alphaNumber } = convertRgbaToHexAndAlpha(nVal);
      if (hex && !isNil(alphaNumber)) {
        hexColor.value = hex.substring(1);
        alpha.value = alphaNumber * 100;
      } else {
        hexColor.value = "#000000"; // 默认颜色为黑色
        alpha.value = 100; // 默认透明度为 100%
      }
    },
    {
      immediate: true
    }
  );
  const isValidHexColor = (hex: string): boolean => {
    // 允许的格式: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
    const hexRegex = /^(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    return hexRegex.test(hex);
  };
  const handleHexChange = (value: string | null) => {
    if (isNil(value)) {
      return;
    }
    if (!isValidHexColor(value)) {
      console.error("Invalid hex color format");
      rgbaColor.value = `rgba(0, 0, 0, 1)`;
      alpha.value = 100; // 默认透明度为 100%
      hexColor.value = "000000"; // 默认颜色为黑色
      handleChange(rgbaColor.value);
    } else {
      hexColor.value = value;
      const { r, g, b, a } = hexToRgba(value) || {};
      rgbaColor.value = `rgba(${r}, ${g}, ${b}, ${a})`;
      alpha.value = (a || 1) * 100; // 将透明度转换为百分比
      handleChange(rgbaColor.value);
    }
  };
  const handleChange = (value: string | null) => {
    if (isNil(value)) {
      return;
    }
    emit("update:modelValue", value);
    emit("change", value);
  };
  // 透明度发生改变
  const handleAlphaChange = (value: number | undefined) => {
    if (isNil(value)) {
      return;
    }
    const val = changeRgbaAlpha(rgbaColor.value, value / 100);
    handleChange(val);
  };

  return {
    hexColor,
    alpha,
    rgbaColor,
    handleAlphaChange,
    handleHexChange,
    handleChange
  };
};
