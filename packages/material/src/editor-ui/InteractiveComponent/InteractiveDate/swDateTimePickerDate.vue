<template>
  <div class="ft-date-time-picker">
    <el-form-item label="默认显示" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.calendarShow" @change="update" />
    </el-form-item>

    <el-form-item label="位置" :label-width="firstLabelWidth">
      <el-select
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.calendarPosition"
        @change="update"
      >
        <el-option label="在选择器上方" value="top" />
        <el-option label="在选择器下方" value="bottom" />
      </el-select>
    </el-form-item>
    <el-form-item label="间距" :label-width="firstLabelWidth">
      <SwInputNumber @change="update" v-model="selectTargetData[0].option.spacing" unit="px" />
    </el-form-item>
    <el-form-item label="宽度" :label-width="firstLabelWidth">
      <SwInputNumber @change="update" v-model="selectTargetData[0].option.calendarWidth" unit="px" :min="0" />
    </el-form-item>
    <el-form-item label="高度" :label-width="firstLabelWidth">
      <SwInputNumber @change="update" v-model="selectTargetData[0].option.calendarHeight" unit="px" :min="0" />
    </el-form-item>
    <el-form-item label="背景色" :label-width="firstLabelWidth">
      <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.calendarBackgroundColor" />
    </el-form-item>
    <el-form-item label="选中字体背景" :label-width="firstLabelWidth">
      <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.timeSelectColor" />
    </el-form-item>
    <SwCollapseItem title="样式" open>
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>

        <el-form-item label="装饰器" :label-width="secondLabelWidth">
          <SwSingleColorPicker @change="update" v-model="selectTargetData[0].option.lineDecorativeColor" />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="按钮" open>
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="btnInput" @change="handleBtnInputTextChange" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input: btnInput, handleConfigTextChange: handleBtnInputTextChange } = useFontStyleAttrs({
  fontFamily: "buttonFontFamily",
  fontStyle: "buttonFontStyle",
  fontWeight: "buttonFontWeight",
  fontSize: "buttonFontSize",
  color: "buttonColor"
});
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "calendarFontFamily",
  fontStyle: "calendarFontStyle",
  fontWeight: "calendarFontWeight",
  fontSize: "calendarFontSize",
  color: "calendarColor"
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
