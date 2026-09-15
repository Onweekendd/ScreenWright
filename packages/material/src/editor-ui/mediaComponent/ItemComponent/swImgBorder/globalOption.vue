<template>
  <el-form-item label="背景色" :label-width="firstLabelWidth">
    <sw-single-color-picker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
  </el-form-item>
  <el-form-item label="图片透明度" :label-width="firstLabelWidth">
    <SwSlider v-model="selectTargetData[0].option.opacity" :max="1" :step="0.1" @change="update" />
  </el-form-item>
  <el-form-item label="图片地址" :label-width="firstLabelWidth">
    <sw-upload v-model="imgBorderValue" :multiple="false" :showFileList="false" />
  </el-form-item>
  <el-form-item label="图片宽度" :label-width="firstLabelWidth">
    <div class="flex flex-center-between">
      <sw-input-number
        v-model.number="selectTargetData[0].option.topWidth"
        bottomLabel="上"
        unit="px"
        @change="update"
      />
      <sw-input-number
        v-model.number="selectTargetData[0].option.bottomWidth"
        bottomLabel="下"
        unit="px"
        @change="update"
      />
      <sw-input-number
        v-model.number="selectTargetData[0].option.leftWidth"
        bottomLabel="左"
        unit="px"
        @change="update"
      />
      <sw-input-number
        v-model.number="selectTargetData[0].option.rightWidth"
        bottomLabel="右"
        unit="px"
        @change="update"
      />
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { isPlainObject } from "lodash-es";

import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { firstLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();

const imgBorderValue = computed({
  get() {
    const data = selectTargetData.value[0].data;
    if (Array.isArray(data)) {
      return data[0].value;
    } else if (isPlainObject(data)) {
      return data.value;
    } else {
      return data;
    }
  },
  set(newValue) {
    const data = selectTargetData.value[0].data;

    if (Array.isArray(data)) {
      data[0].value = newValue;
    } else if (isPlainObject(data)) {
      data.value = newValue;
    } else {
      selectTargetData.value[0].data = newValue;
    }
    update();
  }
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
