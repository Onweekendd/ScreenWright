<template>
  <div class="sw-single-color-picker flex flex-align-center flex-justify-between">
    <FrontColorPicker
      :options="{ colorTypeOption: props.colorTypeOption }"
      v-model="rgbaColor"
      style="position: relative; top: 2px"
      @confirm="handleChange"
      :border="false"
    />
    <SwInput
      v-if="colorTypeOption === 'single'"
      v-model="hexColor"
      :clearable="false"
      unit="#"
      unitPosition="append"
      :width="width"
      @change="handleHexChange"
    />
    <SwInput
      v-else-if="colorTypeOption === 'linear-gradient'"
      v-model="defaultHexColor"
      @change="handleChange"
      :clearable="false"
      unit="#"
      unitPosition="append"
      :width="width"
    />
    <SwInputNumber
      @change="handleAlphaChange"
      v-model="alpha"
      width="60"
      :max="100"
      :min="0"
      :controls="false"
      unit="%"
    />
  </div>
</template>
<script lang="ts" setup>
import FrontColorPicker from "@/components/ScreenwrightColorPicker/index.vue";
import SwInput from "../SwInput/index.vue";
import SwInputNumber from "../SwInputNumber/index.vue";
import type { FtSingleColorPickerProps } from "./SwSingleColorPicker";
import { FtSingleColorPickerEmits } from "./SwSingleColorPicker";
import { useSwSingleColorPicker } from "./useSwSingleColorPicker";
import { ref } from "vue";
defineOptions({
  name: "SwSingleColorPicker",
  inheritAttrs: true
});
const props = withDefaults(defineProps<FtSingleColorPickerProps>(), {
  width: 108,
  colorTypeOption: "single"
});
const emit = defineEmits(FtSingleColorPickerEmits);
const defaultHexColor = ref("线性渐变");
const { rgbaColor, hexColor, alpha, handleChange, handleHexChange, handleAlphaChange } = useSwSingleColorPicker(
  props,
  emit
);
</script>
<style lang="scss" scoped>
.sw-single-color-picker {
  width: 100%;
  .sw-color-picker {
    border-radius: 4px 4px 4px 4px;
    opacity: 0.8;
    border: 1px solid #393b4a;
  }
  :deep(.el-input__inner) {
    font-size: 12px !important;
  }
}
</style>
