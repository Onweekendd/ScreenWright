<template>
  <div class="ft-signature-pad-global">
    <el-form-item label="画笔颜色" :label-width="firstLabelWidth">
      <sw-color-picker
        class="colorPicker"
        size="small"
        :show-alpha="true"
        v-model="selectTargetData[0].option.penColor"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="背景颜色" :label-width="firstLabelWidth">
      <sw-color-picker
        class="colorPicker"
        size="small"
        :show-alpha="true"
        v-model="selectTargetData[0].option.backgroundColor"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="线条宽度" v-if="!selectTargetData[0].openFilter" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].data[0].penWidth" :min="1" :max="20" @change="update" />
    </el-form-item>

    <el-form-item label="点大小" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.dotSize" :min="1" :max="20" @change="update" />
    </el-form-item>

    <el-form-item label="最小距离" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.minDistance" :min="1" :max="20" @change="update" />
    </el-form-item>

    <el-form-item label="速度过滤权重" :label-width="firstLabelWidth">
      <sw-slider
        v-model="selectTargetData[0].option.velocityFilterWeight"
        :min="0"
        :max="1"
        :step="0.1"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="节流时间" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.throttle" :min="1" :max="100" @change="update" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwColorPicker } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
