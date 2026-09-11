<template>
  <div class="raster-progress-bar-global" v-if="selectTargetData[0].option.globalConfig">
    <el-form-item label="边框" :label-width="firstLabelWidth">
      <el-select
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.globalConfig.numType"
        @change="update"
      >
        <el-option v-for="item in progressSeriesLabelType" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item
      label="极值"
      :label-width="firstLabelWidth"
      v-if="selectTargetData[0].option.globalConfig.numType === 'value'"
    >
      <div class="flex flex-center-between" style="width: 100%">
        <sw-input-number
          v-model="selectTargetData[0].option.globalConfig.extremeValueMin"
          bottomLabel="最小值"
          @change="update"
          width="90"
          controls
        />
        <sw-input-number
          v-model="selectTargetData[0].option.globalConfig.extremeValueMax"
          bottomLabel="最大值"
          @change="update"
          width="90"
          controls
        />
      </div>
    </el-form-item>
    <el-form-item label="启用" :label-width="firstLabelWidth">
      <el-switch class="ft-switch" @change="update" v-model="selectTargetData[0].option.globalConfig.isUsed" />
    </el-form-item>
    <el-form-item label="动画时长" :label-width="firstLabelWidth" v-if="selectTargetData[0].option.globalConfig.isUsed">
      <sw-input-number
        v-model="selectTargetData[0].option.globalConfig.animatieTime"
        :min="0"
        unit="毫秒"
        @change="update"
      />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwInputNumber } from "@screenwright/ui/input-number";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const progressSeriesLabelType = ref([
  { label: "百分比", value: "percent" },
  { label: "真实值", value: "value" }
]);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
