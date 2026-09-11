<!-- 条形样式配置 -->
<template>
  <div class="config-strip-style" v-if="selectTargetData[0].option">
    <el-form-item label="条形类型" :label-width="labelWidth" v-if="isBarBorderRadius">
      <el-select
        v-model="selectTargetData[0].option.barBorderRadius"
        popper-class="sw-select-dropdown"
        placeholder="Select"
        style="width: 100%"
        @change="update"
      >
        <el-option v-for="item in barType" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="默认颜色" :label-width="labelWidth" v-if="isDefaultColor">
      <sw-color-picker
        :options="{ colorTypeOption: 'linear-gradient,single' }"
        v-model:color="selectTargetData[0].option.defaultSeriesColor"
        v-model:opacity="selectTargetData[0].option.defaultSeriesOpacity"
        field="defaultSeriesColor"
        inputDisabled
        @change="update"
      />
    </el-form-item>
    <el-form-item label="系列间距" :label-width="labelWidth" v-if="isBarGap">
      <SwSlider v-model="selectTargetData[0].option.barGap" @change="update" />
    </el-form-item>
    <el-form-item label="柱间间距" :label-width="labelWidth" v-if="isBarCategoryGap">
      <SwSlider v-model="selectTargetData[0].option.barCategoryGap" @change="update" />
    </el-form-item>

    <el-form-item label="柱子背景" :label-width="labelWidth" v-if="isBarBackgroundColor">
      <SwSingleColorPicker v-model="selectTargetData[0].option.barBackgroundColor" @change="update" />
    </el-form-item>

    <el-form-item label="是否合并" :label-width="labelWidth" v-if="isStack">
      <el-checkbox v-model="selectTargetData[0].option[barStack]" @change="update" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import { useUpdateInstance } from "../../useUpdateInstance";
import { barType } from "./options";

const { update, selectTargetData } = useUpdateInstance();
interface Props {
  labelWidth?: string;
  isBarBorderRadius?: boolean;
  isBarGap?: boolean;
  isBarCategoryGap?: boolean;
  isBarBackgroundColor?: boolean;
  isStack?: boolean;
  barStack?: string;
  isDefaultColor?: boolean;
}
withDefaults(defineProps<Props>(), {
  labelWidth: "73",
  isBarBorderRadius: true,
  isBarGap: true,
  isBarCategoryGap: true,
  isBarBackgroundColor: true,
  isStack: true,
  isDefaultColor: false,
  barStack: "stack"
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.config-strip-style {
  @include common-element-style(".el-select__wrapper");
  @include checkbox-style();
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
}
</style>
