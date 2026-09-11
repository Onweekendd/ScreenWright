<template>
  <div class="sw-color-picker flex flex-center" :class="colorClass">
    <div class="color-preview" :style="{ background: previewColor }" @click="showColorPicker" />
    <div :id="id" class="colorpicker-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick, onMounted } from "vue";
import { uuid } from "@/utils/index";
import "./xncolorpicker.min.js";
import { useVModel } from "@vueuse/core";
import type { XNColorPickerOptions, Props } from "./colorPicker.js";
import { computed } from "vue";

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

let colorPickerInstance: any = null;
function isWhiteColor(color: string) {
  // 空值直接返回false，同时统一转小写、去除所有空格（处理rgba(255, 255, 255, 1)带空格的情况）
  if (!color || typeof color !== "string") return false;
  const pureColor = color.toLowerCase().replace(/\s+/g, "");

  // 匹配情况1：纯英文白色 white
  if (pureColor === "white") return true;

  // 匹配情况2：十六进制 支持#fff(简写) 和 #ffffff(全写)
  const hexReg = /^#([0-9a-f]{3}|[0-9a-f]{6})$/;
  if (hexReg.test(pureColor)) {
    const hex = pureColor.slice(1);
    // 简写#fff转全写#ffffff，再判断是否为ffffff
    const fullHex =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    return fullHex === "ffffff";
  }

  // 匹配情况3：rgb/rgba格式 支持rgba(255,255,255,1)、rgb(255,255,255)
  const rgbReg = /^rgba?\((\d+),(\d+),(\d+)(,[\d.]+)?\)$/;
  const rgbMatch = pureColor.match(rgbReg);
  if (rgbMatch) {
    const [r, g, b] = [rgbMatch[1], rgbMatch[2], rgbMatch[3]].map(Number);
    // 白色的RGB通道必须都是255，透明度不影响（比如rgba(255,255,255,0)也是白色，只是完全透明）
    return r === 255 && g === 255 && b === 255;
  }

  // 其他未匹配的颜色格式（如hsl），默认返回false
  return false;
}
const showColorPicker = () => {
  console.log("Showing color picker", color.value);
  if (colorPickerInstance) {
    colorPickerInstance.destroy();
  }
  handleNewColorUpdate();
  emit("confirm", color.value);
  emit("change", color.value);
  initColorPicker();
};
const previewColor = ref("");

const initColorPicker = async () => {
  await nextTick();
  console.log("初始化这里");
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
    onError: (_e: any) => {
      console.log(_e, "e");
    },
    onCancel: (color: any) => {
      console.log("cancel", color);
    },
    onChange: (colorObj: any) => {
      console.log("change", colorObj);
    },
    onConfirm: (colorObj: any) => {
      let confirmColor = "";
      if (colorObj.colorType === "linear-gradient") {
        confirmColor = colorObj.color[props.returnType];
      }
      if (colorObj && colorObj.color && colorObj.color.rgba) {
        confirmColor = colorObj.color.rgba;
      }
      color.value = confirmColor;
      handleNewColorUpdate();
      emit("confirm", confirmColor);
      emit("change", confirmColor);
    }
  };

  try {
    colorPickerInstance = new (window as any).XNColorPicker({
      ...defaultOptions,
      ...props.options
    });
    if (isWhiteColor(color.value)) {
      colorPickerInstance.setColor("rgba(252,248,248,1)");
    }
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
  { deep: true }
);
onMounted(async () => {
  await nextTick();
  handleNewColorUpdate();
});
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
