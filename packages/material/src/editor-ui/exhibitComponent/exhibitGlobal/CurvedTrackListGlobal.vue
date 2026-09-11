<template>
  <div class="ft-filter-global">
    <el-form-item label="弧形方向" :label-width="firstLabelWidth">
      <el-select
        @change="update"
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.curveDirection"
      >
        <el-option v-for="item in curveDirectionOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="间隔" :label-width="firstLabelWidth">
      <SwInputNumber v-model="selectTargetData[0].option.gap" @change="update" :min="5" :controls="true" />
    </el-form-item>
    <el-form-item label="弧度强度" :label-width="firstLabelWidth">
      <SwInputNumber
        v-model="selectTargetData[0].option.curveStrength"
        @change="update"
        :min="0"
        :max="10"
        :controls="true"
      />
    </el-form-item>
    <el-form-item label="图片尺寸" :label-width="firstLabelWidth">
      <div class="flex">
        <SwInputNumber v-model="selectTargetData[0].option.imageSize[0]" @change="update" unit="px" bottom-label="宽" />
        <SwInputNumber v-model="selectTargetData[0].option.imageSize[1]" @change="update" unit="px" bottom-label="高" />
      </div>
      <!--  -->
    </el-form-item>
    <el-form-item label="滚轮方向" :label-width="firstLabelWidth">
      <el-select
        @change="update"
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.wheelDirection"
      >
        <el-option v-for="item in wheelDirectionOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <el-form-item label="滚轮速度" :label-width="firstLabelWidth">
      <SwInputNumber
        v-model="selectTargetData[0].option.wheelFactor"
        @change="update"
        :min="0"
        :max="20"
        :controls="true"
      />
    </el-form-item>

    <el-form-item label="禁止滚动" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.disabledScroll" @change="update" />
    </el-form-item>
  </div>
</template>
<script lang="ts" setup>
import { reactive } from "vue";

import { SwInputNumber } from "@screenwright/ui";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const curveDirectionOption = reactive([
  {
    label: "外凸",
    value: 1
  },
  {
    label: "内凹",
    value: -1
  }
]);

const wheelDirectionOption = reactive([
  {
    label: "同向",
    value: 1
  },
  {
    label: "反向",
    value: -1
  }
]);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
