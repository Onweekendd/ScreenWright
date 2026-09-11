<template>
  <div class="ft-rotate-cube-animation">
    <el-form-item label="惯性动画" :label-width="firstLabelWidth">
      <el-switch class="ft-switch" v-model="selectTargetData[0].option.inertia.enabled" @change="update" />
    </el-form-item>
    <el-form-item label="阻尼系数" v-if="selectTargetData[0].option.inertia.enabled" :label-width="firstLabelWidth">
      <sw-slider
        v-model="selectTargetData[0].option.inertia.damping"
        :min="0.7"
        :max="0.99"
        :step="0.01"
        @change="update"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
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
