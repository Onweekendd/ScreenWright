<template>
  <div class="sw-slider flex">
    <el-slider v-model="input" v-bind="omitProps" @change="handleChange" />
    <SwInputNumber v-model="input" width="75" :unit="unit" @change="handleChange" v-if="showNumberInput" />
  </div>
</template>
<script lang="ts" setup>
import SwInputNumber from "../SwInputNumber/index.vue";
import { FtSliderProps, FtSliderEmits } from "./SwSlider";
import { useSwSlider } from "./useSwSlider";
const props = withDefaults(defineProps<FtSliderProps>(), {
  showNumberInput: true
});
const emit = defineEmits(FtSliderEmits);
const { input, omitProps, handleChange } = useSwSlider(props, emit);
</script>
<style lang="scss" scoped>
.sw-slider {
  width: 100%;

  :deep(.el-slider) {
    --el-slider-height: 9px;
  }
  :deep(.el-slider__runway) {
    margin-right: 16px;
    background-color: #0f1014 !important;
  }
  :deep(.el-slider__bar) {
    background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
    opacity: 0.8;
  }
  :deep(.el-slider__button) {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid var(--sw-theme-color);
    position: relative;
    top: 2px;
  }
  :deep(.el-slider__input) {
    width: 55px;
  }
}
</style>
