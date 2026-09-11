<!-- 开关 -->
<template>
  <div class="ft-form-switch" :style="{ ...styleSizeName }">
    <div
      ref="switchRef"
      :class="{
        'switch-container': true,
        ...componentClasses
      }"
      :style="containerStyle"
    >
      <div v-for="(item, index) in dataChart" :key="index" :style="textStyle">
        <el-switch
          :class="'switch-' + option.type"
          v-model="item.value"
          :disabled="option.disabled"
          :active-color="option.activeColor"
          :inactive-color="option.inactiveColor"
          :active-text="option.activeText"
          :inactive-text="option.inactiveText"
          :width="width"
          @change="handleChange(item)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { setPx } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";

import useFormSwitch from "./useFormSwitch";

defineOptions({
  name: "formSwitch"
});
const props = defineProps<{ element: ComponentType }>();
// 获取组合式函数
const {
  switchRef,
  containerStyle,
  textStyle,
  dataChart,
  styleSizeName,
  width,
  option,
  fontWeightValue,
  borderRadiusValue,
  pointColorValue,
  pointColor2Value,
  activeColorValue,
  inactiveColorValue,
  componentClasses,
  handleChange
} = useFormSwitch(props.element);
</script>

<style lang="scss" scoped>
.switch-container {
  height: 100%;
  overflow: auto;
  background-repeat: no-repeat;
  background-size: cover;
  --inactiveColor: v-bind("inactiveColorValue");
  --activeColor: v-bind("activeColorValue");
  --pointColor: v-bind("pointColorValue");
  --pointColor2: v-bind("pointColor2Value");
  --pointSize: v-bind("setPx(option.pointSize)");
  --borderRadius: v-bind("borderRadiusValue");
  --fontColor: v-bind("option.fontColor");
  --fontSize: v-bind("setPx(option.fontSize)");
  --fontWeight: v-bind("fontWeightValue");
  & > div {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  :deep(.el-switch) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    .el-switch__label {
      white-space: nowrap;
      // color: var(--fontColor);
      // font-size: var(--fontSize);
      height: fit-content;
      font-weight: var(--fontWeight);
      & > span {
        font-size: var(--fontSize);
      }
      &.is-active {
        color: var(--fontColor);
      }
    }
    .el-switch__core {
      height: 100%;
      box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.1);
      border-radius: var(--borderRadius);
      border-color: transparent !important;
      background: var(--inactiveColor) !important;
      background-size: 100% 100% !important;
      background-repeat: no-repeat !important;
      flex: 1;
      .el-switch__action {
        width: var(--pointSize);
        height: var(--pointSize);
        left: 2%;
        top: 50%;
        transform: translateY(-50%);
        background: var(--pointColor2);
        background-size: 100% 100%;
        background-repeat: no-repeat;
      }
    }
    &.switch-image .el-switch__core {
      box-shadow: none !important;
    }
    &.is-checked {
      .el-switch__core {
        border-color: transparent !important;
        background: var(--activeColor) !important;
        background-size: 100% 100% !important;
        background-repeat: no-repeat !important;
        .el-switch__action {
          left: 98%;
          margin-left: 0;
          transform: translateX(-100%) translateY(-50%);
          background: var(--pointColor);
          background-size: 100% 100%;
          background-repeat: no-repeat;
        }
      }
    }
  }
}
</style>
