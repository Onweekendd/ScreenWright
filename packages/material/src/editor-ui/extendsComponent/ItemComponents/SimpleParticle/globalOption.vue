<template>
  <div class="simple-particle-global">
    <el-form-item label="粒子大小" :label-width="firstLabelWidth">
      <sw-input-number v-model="selectTargetData[0].option.size" :min="1" :max="1000" @change="update" />
    </el-form-item>
    <el-form-item label="粒子数量" :label-width="firstLabelWidth">
      <sw-input-number v-model="selectTargetData[0].option.number" :min="0" @change="update" />
    </el-form-item>
    <el-form-item label="方向" :label-width="firstLabelWidth">
      <el-select v-model="selectTargetData[0].option.direction" popper-class="sw-select-dropdown" @change="update">
        <el-option v-for="item in dropDownPosition" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="速度" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.speed" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";

import { firstLabelWidth } from "@editor/constants";
import { useUpdateInstance } from "@editor/useUpdateInstance";
import { dropDownPosition } from "../dict";

const { update, selectTargetData } = useUpdateInstance();
console.log(selectTargetData.value[0], "selectTargetData.value[0]");
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

:deep(.el-switch) {
  .el-switch__label * {
    width: fit-content !important;
    font-size: 12px;
    font-family:
      Source Han Sans CN-Normal,
      Source Han Sans CN;
    font-weight: 400;
    color: #b4b7c1 !important;
    line-height: 20px;
  }

  &.is-checked .el-switch__core {
    background-color: var(--sw-theme-color) !important;
    border-color: var(--sw-theme-color) !important;
  }

  .el-switch__core {
    height: 16px;
    background-color: #0f1014 !important;
    border-color: #0f1014 !important;
  }
}
</style>
