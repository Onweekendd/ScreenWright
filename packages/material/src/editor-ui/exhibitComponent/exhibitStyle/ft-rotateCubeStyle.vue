<template>
  <div class="ft-rotate-cube-style">
    <el-form-item label="边框光源" :label-width="firstLabelWidth">
      <el-switch class="ft-switch" v-model="selectTargetData[0].option.borderLight.enabled" @change="update" />
    </el-form-item>
    <el-form-item label="光源颜色" v-if="selectTargetData[0].option.borderLight.enabled" :label-width="firstLabelWidth">
      <sw-color-picker
        class="colorPicker"
        size="small"
        :show-alpha="true"
        v-model="selectTargetData[0].option.borderLight.color"
        @change="update"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { SwColorPicker } from "@screenwright/ui";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
