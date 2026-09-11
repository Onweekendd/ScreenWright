<template>
  <div class="simple-star-global">
    <el-form-item label="点数" :label-width="firstLabelWidth">
      <sw-input-number v-model="selectTargetData[0].option.dotNum" :min="1" :max="1000" @change="update" />
    </el-form-item>
    <el-form-item label="最大半径" :label-width="firstLabelWidth">
      <sw-input-number v-model="selectTargetData[0].option.radio" :min="0" @change="update" />
    </el-form-item>
    <el-form-item label="颜色" :label-width="firstLabelWidth">
      <sw-single-color-picker v-model="selectTargetData[0].option.color" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui";
import { SwSingleColorPicker } from "@screenwright/ui";

import { firstLabelWidth } from "@editor/constants";
import { useUpdateInstance } from "@editor/useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
console.log(selectTargetData.value[0], "selectTargetData.value[0]");
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
