<template>
  <div class="rank-progressProgress">
    <el-form-item label="边距" :label-width="firstLabelWidth">
      <div class="flex fullWidth flex-center-between">
        <sw-input-number @change="update" v-model="selectTargetData[0].option.bar.margin[0]" bottomLabel="上" />
        <sw-input-number @change="update" v-model="selectTargetData[0].option.bar.margin[2]" bottomLabel="下" />
        <sw-input-number @change="update" v-model="selectTargetData[0].option.bar.margin[3]" bottomLabel="左" />
        <sw-input-number @change="update" v-model="selectTargetData[0].option.bar.margin[1]" bottomLabel="右" />
      </div>
    </el-form-item>
    <el-form-item label="是否滚动" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.bar.isScroll" @change="update" />
    </el-form-item>
    <el-form-item label="滚动方式" :label-width="firstLabelWidth" v-if="selectTargetData[0].option.bar.isScroll">
      <el-select
        v-model="selectTargetData[0].option.bar.scrollType"
        popper-class="sw-select-dropdown"
        @change="update"
      >
        <el-option v-for="item in scrollType" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item
      label="显示圆点"
      v-if="isBoolean(selectTargetData[0].option.bar.showCircle)"
      :label-width="firstLabelWidth"
    >
      <el-checkbox v-model="selectTargetData[0].option.bar.showCircle" @change="update" />
    </el-form-item>
    <el-form-item label="显示个数" :label-width="firstLabelWidth">
      <sw-input-number :min="0" v-model="selectTargetData[0].option.bar.showNum" @change="update" controls />
    </el-form-item>
    <el-form-item label="宽度" :label-width="firstLabelWidth">
      <sw-slider :min="0" :max="100" unit="%" v-model="selectTargetData[0].option.bar.width" @change="update" />
    </el-form-item>

    <el-form-item label="高度" v-if="selectTargetData[0].option.bar.height >= 0" :label-width="firstLabelWidth">
      <sw-input-number
        @change="update"
        controls
        :min="0"
        v-model="selectTargetData[0].option.bar.height"
        bottomLabel="px"
      />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { isBoolean } from "lodash-es";

import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const scrollType = [
  { label: "自动", value: "auto" },
  { label: "滚动条", value: "bar" }
];
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
