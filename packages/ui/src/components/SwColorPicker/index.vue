<template>
  <div class="sw-color-picker flex flex-align-center flex-justify-between">
    <ScreenwrightColorPicker style="top: 2px" v-model="currentColor" :options="options" :return-type="returnType" />
    <sw-input
      v-model="defaultLabel"
      :clearable="false"
      unit="#"
      unitPosition="append"
      :disabled="true"
      :width="inputWidth"
    />
    <sw-input-number
      v-model="newOpacity"
      unit="%"
      :disabled="inputDisabled"
      :max="100"
      :min="0"
      :controls="false"
      width="60"
    />
  </div>
</template>

<script setup lang="ts">
import ScreenwrightColorPicker from "@/components/ScreenwrightColorPicker/index.vue";
import SwInput from "@/components/SwInput/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import { ref, computed, watch } from "vue";
import type { XNColorPickerOptions } from "@/components/ScreenwrightColorPicker/colorPicker";
// 定义颜色类型
type ColorValue = string | { type: string; angle: number; colors: Array<{ color: string; per: number }> };

/**
 * 颜色选择器组件属性接口
 */
interface FtColorPickerProps {
  modelValue?: any;
  /**
   * 颜色值，可以是颜色字符串或渐变对象
   */
  color?: ColorValue;
  /**
   * 透明度，范围 0-100
   */
  opacity?: string | number;
  /**
   * 输入框是否禁用
   */
  inputDisabled?: boolean;
  /**
   * 颜色返回类型 'str' 或 'arry'
   */
  returnType?: "str" | "arry";
  options?: Partial<XNColorPickerOptions>;
  inputWidth?: string | number;
}

// 定义props（使用withDefaults设置默认值）
const props = withDefaults(defineProps<FtColorPickerProps>(), {
  modelValue: "",
  color: "",
  opacity: 100,
  inputDisabled: false,
  returnType: "arry",
  inputWidth: "108"
});
// 定义emit
const emit = defineEmits(["update:color", "update:opacity", "update:modelValue", "change"]);
const currentColor = ref(props.modelValue || props.color);
// 定义响应式变量
const defaultLabel = computed(() => {
  console.log(currentColor.value, "currentColor");
  if (currentColor.value.type) {
    return "渐变色";
  }
  if (typeof currentColor.value === "string" && currentColor.value.startsWith("linear-gradient")) {
    return "渐变色";
  }
  return "纯色";
});

// 处理新颜色值的getter和setter
const newColor = computed({
  get: () => props.color,
  set: (val) => {
    emit("update:color", val);
    emit("change", val);
  }
});
watch(
  () => currentColor.value,
  (val) => {
    newColor.value = val;
    if (props.modelValue) {
      emit("update:modelValue", val);
      emit("change", val);
    }
  },
  { deep: true }
);
// 处理透明度的getter和setter
const newOpacity = computed({
  get: () => (typeof props.opacity === "string" ? Number(props.opacity) : props.opacity),
  set: (val) => {
    emit("update:opacity", val);
    emit("change", val);
  }
});
console.log(props.color, "ftcolor");
</script>

<style lang="scss" scoped>
.sw-color-picker {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  .colorBackground {
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    top: 4px;
    // margin: 5px 0 0 20%;

    z-index: 100;
    cursor: pointer;
  }
  .colorpicker {
    width: 24px;
    height: 24px;
    background: #181b24;
    border-radius: 4px 4px 4px 4px;
    opacity: 0.8;
    border: 1px solid #393b4a;
    margin-top: 1px;
    :deep(.fcolorpicker-curbox) {
      width: 15px;
      height: 15px;
      border-radius: 2px 2px 2px 2px;
      margin: 5px 0 0 19%;
    }
  }
  .fcolorpicker {
    width: 264px;
    background: #181b24;
    border: 1px solid #181b24;
    position: fixed;
    padding: 6px 10px;
    box-sizing: border-box;
    z-index: 999999;
    /* display: none; */
    user-select: none;
  }
  .colorpicker {
    width: 24px;
    height: 24px;
  }

  .fcolorpicker-curbox {
    visibility: hidden;
  }
}
</style>
