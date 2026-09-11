<!-- 滑块组件 -->
<template>
  <div class="sw-form-slider" :style="{ ...styleSizeName }">
    <div ref="slider" :class="componentClasses" class="slider-container" :style="containerStyle">
      <div
        v-for="(item, index) in dataChart"
        :key="index"
        :style="{
          'flex-direction': option.vertical ? 'column' : 'row'
        }"
      >
        <span :style="textStyle" v-if="option.showLabel" :data-translate="item.label">{{ item.label }}</span>
        <el-slider
          :class="[option.vertical ? 'slider-vertical' : 'slider-vertical-not']"
          :style="sliderStyle"
          v-model="item.value"
          :show-tooltip="false"
          :disabled="option.disabled"
          :min="option.min"
          :max="option.max"
          :step="option.step"
          height="100%"
          :vertical="option.vertical"
          :show-stops="option.showStops"
          @input="handleInput(item)"
          @change="handleChange(item)"
        />
        <span
          :style="{
            ...textStyle,
            transform: `translate(${option.vertical ? option.textTranslateX : -option.textTranslateX}px, ${
              option.vertical ? -option.textTranslateY : option.textTranslateY
            }px)`
          }"
          v-if="option.showValue"
          v-html="item.value"
          :data-translate="item.value"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";

import useFormSlider from "./useFormSlider";

defineOptions({
  name: "formSlider"
});
const props = defineProps<{ element: ComponentType }>();

// 获取组合式函数
const {
  slider,
  dataChart,
  option,
  styleSizeName,
  containerStyle,
  textStyle,
  defaultColorValue,
  activeColorValue,
  pointColorValue,
  pointSizeValue,
  pointX,
  barSizeValue,
  borderRadius,
  borderColor,
  borderImage,
  componentClasses,
  handleInput,
  handleChange,
  sliderStyle
} = useFormSlider(props.element);
</script>

<style lang="scss" scoped>
.slider-container {
  height: 100%;
  overflow: auto;
  background-repeat: no-repeat;
  background-size: cover;
  --defaultColor: v-bind("defaultColorValue");
  --activeColor: v-bind("activeColorValue");
  --pointColor: v-bind("pointColorValue");
  --pointSize: v-bind("pointSizeValue");
  --bar-Size: v-bind("barSizeValue");
  --border-radius-Size: v-bind("borderRadius");
  --border-Color: v-bind("borderColor");
  --border-Image: v-bind("borderImage");
  --pointXValue: v-bind("pointX");
  & > div {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  span {
    display: inline-block;
    white-space: nowrap;
  }
  :deep(.el-slider) {
    display: flex;
    align-items: center;
    justify-content: center;
    &.slider-vertical {
      height: 100%;
      .el-slider__runway,
      .el-slider__bar {
        width: var(--bar-Size);
        height: 100%;
      }
      .el-slider__button-wrapper {
        left: 50%;
        transform: translate(-50%, 50%);
      }
    }
    &.slider-vertical-not {
      .el-slider__runway,
      .el-slider__bar {
        height: var(--bar-Size);
      }
      .el-slider__button-wrapper {
        display: flex;
        top: var(--pointXValue);
      }
    }
    .el-slider__runway {
      margin: 0 auto;
      position: relative;
      border-color: var(--defaultColor) !important;
      background-color: var(--defaultColor) !important;
      border-radius: var(--border-radius-Size);
    }
    .el-slider__bar {
      background: var(--activeColor);
    }
    .el-slider__button-wrapper {
      width: var(--pointSize);
      height: var(--pointSize);
      z-index: 0 !important;
    }
    .el-slider__button-wrapper .el-slider__button {
      width: var(--pointSize);
      height: var(--pointSize);
      border-color: var(--border-Color);
      background: var(--pointColor);
      background-size: cover; /* 使背景图片完全覆盖div，可能会裁剪图片 */
      background-repeat: no-repeat; /* 防止图片重复 */
      background-position: center; /* 图片在div中居中显示 */
    }
  }
  :deep(.el-slider__bar) {
    border-bottom-left-radius: var(--border-radius-Size) !important;
    border-top-left-radius: var(--border-radius-Size) !important;
  }
}
</style>
