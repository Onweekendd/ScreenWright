<!-- 多选框 -->
<template>
  <div class="ft-checkbox" :style="styleSizeName">
    <div ref="checkbox" class="ft-checkbox-container" :style="containerStyle">
      <el-checkbox-group
        v-model="checkList"
        :text-color="option.textColor"
        :fill="option.fillColor"
        :min="Math.min(option.min, checkList.length)"
        :max="option.max"
        :style="textStyle"
        @change="handleChange as any"
      >
        <el-checkbox
          v-for="(item, i) in dataChart"
          :key="i"
          :value="item.label"
          :label="item.label"
          :data-translate="item.label"
        />
      </el-checkbox-group>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { useBaseData } from "@screenwright/composables"
import { setPx } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";

import { useCheckbox } from "./useCheckbox";

defineOptions({
  name: "formCheckbox"
});

const props = defineProps<{
  element: ComponentType;
}>();
// const { option } = useBaseData(props.element)

// 使用提取的hook
const { styleSizeName, option, checkbox, checkList, containerStyle, textStyle, dataChart, handleChange } = useCheckbox(
  props.element
);
</script>

<style lang="scss" scoped>
.ft-checkbox {
  height: 100%;
  width: 100%;
}

.ft-checkbox-container {
  height: 100%;
  overflow: auto;
  --sizeX: v-bind("setPx(option.sizeX)");
  --sizeY: v-bind("setPx(option.sizeY)");
  --textColor: v-bind("option.textColor") !important;
  --fontcolor: v-bind("option.fontColor") !important;
  --fontSize: v-bind("setPx(option.fontSize)");
  --fontWeight: v-bind("option.fontWeight") !important;
  --fontStyle: v-bind("option.fontStyle") !important;
  --fillColor: v-bind("option.fillColor") !important;
  --fontFamily: v-bind("option.fontFamily") !important;
  & > div {
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: wrap;
  }
  :deep(.el-checkbox) {
    border-right: none;
    border-bottom: none;
    color: var(--fontcolor);
    .el-checkbox__label {
      font-size: var(--fontSize);
      font-weight: var(--fontWeight);
      font-style: var(--fontStyle);
      font-family: var(--fontFamily);
      color: var(--fontColor);
    }
    .el-checkbox__inner {
      width: var(--sizeX);
      height: var(--sizeY);
      z-index: 0 !important;
    }
    &.is-checked .el-checkbox__inner {
      border-color: var(--fillColor) !important;
      background: var(--fillColor) !important;
      &::after {
        border-color: var(--textColor);
        width: calc(var(--sizeX) / 4);
        height: calc(var(--sizeY) / 2);
        // 垂直居中：top = (复选框高度 - 钩子高度) / 2 = sizeY / 4
        top: calc(50% - var(--sizeY) / 20);
        // 水平居中：left = (复选框宽度 - 钩子宽度) / 2 = sizeX * 3 / 8
        left: calc(var(--sizeX) * 3.5 / 8);
      }
    }
    &.is-checked .el-checkbox__label {
      color: var(--textColor);
    }
  }
}
</style>
