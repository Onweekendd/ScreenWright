<template>
  <el-form-item label="字体填充" :label-width="100">
    <el-select
      v-model="selectTargetData[0].option.selectedTextType"
      popper-class="sw-select-dropdown"
      @change="update"
    >
      <el-option v-for="item in textColorType" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
  <template v-if="selectTargetData[0].option.selectedTextType === 'normal'">
    <el-form-item label="颜色" :label-width="100">
      <SwSingleColorPicker v-model="selectTargetData[0].option.color" @change="update" />
    </el-form-item>
    <el-form-item label="字体背景" :label-width="100">
      <SwSingleColorPicker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
    </el-form-item>
  </template>

  <el-form-item :label-width="100" label="颜色" v-if="selectTargetData[0].option.selectedTextType === 'gradient'">
    <sw-color-picker
      :options="{ colorTypeOption: 'linear-gradient,single' }"
      v-model:color="selectTargetData[0].option.selectedTextColor"
      v-model:opacity="selectTargetData[0].option.selectedTextOpacity"
      field="textGradientColor"
      @change="update"
    />
  </el-form-item>
</template>
<script setup lang="ts">
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import { textColorType } from "../../constants";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
