<template>
  <div class="sw-color-picker flex flex-center" :class="colorClass">
    <div class="color-preview" :style="{ background: previewColor }" @click="showColorPicker" />
    <div :id="id" class="colorpicker-container" />
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";
import { computed } from "vue";
import { useVModel } from "@vueuse/core";

import { uuid } from "@/utils/utils";

import type { Props, XNColorPickerOptions } from "./colorPicker";

import "./xncolorpicker.js";

const props = withDefaults(defineProps<Props>(), {
  returnType: "str",
  options: () => ({ colorTypeOption: "single" }),
  border: true
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string];
  confirm: [value: string];
}>();

const color = useVModel(props, "modelValue", emit);

const id = ref<string>(`colorpicker-${uuid()}`);
const colorClass = computed(() => {
  return props.border ? "border" : "";
});

type PickerColorStop = {
  color: string;
  per: number | string;
};

type PickerGradient = {
  type?: string;
  angle?: number | string;
  colors: PickerColorStop[];
};

type PickerColorValue = {
  str?: string;
  arry?: PickerGradient;
  rgba?: string;
  hex?: string;
};

type PickerConfirmColor = {
  colorType?: string;
  color?: PickerColorValue;
};

type ColorPickerInstance = {
  destroy: () => void;
};

type XNColorPickerWindow = Window & {
  XNColorPicker: new (options: XNColorPickerOptions) => ColorPickerInstance;
};

let colorPickerInstance: ColorPickerInstance | null = null;

const normalizeGradientString = (value: string): string => {
  if (!value) {
    return "";
  }

  return value
    .replace(/rgba\(\s*,\s*,\s*,\s*\)/g, "rgba(0,0,0,0)")
    .replace(/\s+/g, " ")
    .trim();
};

const getConfirmedColor = (colorObj: PickerConfirmColor): string => {
  if (!colorObj || !colorObj.color) {
    return "";
  }

  if (colorObj.colorType === "linear-gradient" || colorObj.colorType === "radial-gradient") {
    if (typeof colorObj.color.str === "string") {
      return normalizeGradientString(colorObj.color.str);
    }

    if (colorObj.color.arry) {
      const gradient = colorObj.color.arry;
      const isLinear = gradient.type === "linear-gradient";
      let result = `${gradient.type}(`;

      if (isLinear) {
        const angleValue = gradient.angle === undefined || gradient.angle === null ? 0 : gradient.angle;
        result += `${Number.parseFloat(`${angleValue}`).toFixed(1)}deg,`;
      }

      const colors = gradient.colors as Array<{ color: string; per: number | string }>;
      for (let index = 0; index < colors.length; index += 1) {
        const item = colors[index];
        result += `${item.color} ${Number.parseFloat(String(item.per)).toFixed(1)}%`;
        if (index < colors.length - 1) {
          result += ",";
        }
      }

      result += ")";
      return normalizeGradientString(result);
    }

    return "";
  }

  if (props.returnType === "rgba" && typeof colorObj.color.rgba === "string") {
    return colorObj.color.rgba;
  }

  if (props.returnType === "hex" && typeof colorObj.color.hex === "string") {
    return colorObj.color.hex;
  }

  if (typeof colorObj.color.rgba === "string") {
    return colorObj.color.rgba;
  }

  if (typeof colorObj.color.hex === "string") {
    return colorObj.color.hex;
  }

  return "";
};

const showColorPicker = () => {
  if (colorPickerInstance) {
    colorPickerInstance.destroy();
  }
  initColorPicker();
};
const previewColor = ref("");
const initColorPicker = () => {
  const defaultOptions: XNColorPickerOptions = {
    color: color.value,
    selector: `#${id.value}`,
    showprecolor: false,
    prevcolors: null,
    showhistorycolor: true,
    historycolornum: 16,
    format: "rgba",
    showPalette: true,
    show: true,
    alwaysShow: false,
    lang: "cn",
    colorTypeOption: props.options.colorTypeOption,
    canMove: false,
    autoConfirm: false,
    hideInputer: false,
    hideCancelButton: false,
    hideConfirmButton: false,
    onError: (_e: unknown) => {
      console.log(_e, "e");
    },
    onCancel: (_color: unknown) => {
      console.log("cancel", _color);
    },
    onChange: (colorObj: PickerConfirmColor) => {
      console.log("change", colorObj);
    },
    onConfirm: (colorObj: PickerConfirmColor) => {
      const confirmColor = getConfirmedColor(colorObj);
      color.value = confirmColor;
      handleNewColorUpdate();
      emit("confirm", confirmColor);
      emit("change", confirmColor);
    }
  };

  try {
    const pickerWindow = window as unknown as XNColorPickerWindow;
    colorPickerInstance = new pickerWindow.XNColorPicker({
      ...defaultOptions,
      ...props.options
    });
  } catch (error) {
    console.error("初始化颜色选择器失败:", error);
  }
};
// 处理新颜色更新
const handleNewColorUpdate = () => {
  if (typeof color.value === "object" && color.value?.type === "linear-gradient") {
    let res = "linear-gradient(" + color.value.angle + "deg";
    color.value.colors.forEach((item: { color: string; per: number }) => {
      res += "," + item.color + item.per + "%";
    });
    res += ")";
    previewColor.value = res;
  } else if (typeof color.value === "string") {
    previewColor.value = color.value;
  }
};
watch(
  () => color.value,
  () => {
    handleNewColorUpdate();
  },
  { deep: true, immediate: true }
);
onUnmounted(() => {
  if (colorPickerInstance) {
    colorPickerInstance.destroy();
  }
});
</script>

<style lang="scss" scoped>
.sw-color-picker {
  height: 24px;
  width: 24px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  &.border {
    border: 1px solid #393b4a;
  }

  .color-preview {
    width: 16px;
    height: 16px;
    cursor: pointer;
    border-radius: 4px;
  }

  .colorpicker-container {
    width: 0;
    height: 0;

    :deep(.fcolorpicker) {
      width: 264px;
      background: #181b24 !important;
      border: 1px solid #181b24 !important;
      position: fixed;
      padding: 6px 10px;
      box-sizing: border-box;
      z-index: 999999;
      user-select: none;
    }

    :deep(.fcolorpicker .color-slidedown p) {
      margin: 0;
      cursor: pointer;
      color: #fff;
    }
    :deep(.fcolorpicker-curbox) {
      position: absolute;
      visibility: hidden;
      top: 0;
      left: 0;
      width: 15px;
      height: 15px;
      border-radius: 2px 2px 2px 2px;
      margin: 5px 0 0 20%;
    }
  }
}
</style>
