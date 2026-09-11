<template>
  <div class="imagesList-3d-global">
    <el-form-item label="显示倒影">
      <el-checkbox v-model="selectTargetData[0].option.invertedImage" @change="update" />
    </el-form-item>
    <el-form-item label="尺寸" :label-width="firstLabelWidth">
      <div class="flex flex-center-between">
        <sw-input-number
          v-model.number="selectTargetData[0].option.imgWidth"
          bottomLabel="宽度"
          :min="1"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.imgHeight"
          bottomLabel="高度"
          :min="1"
          @change="update"
        />
      </div>
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
