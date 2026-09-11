<template>
  <el-form-item label="启用" :label-width="firstLabelWidth">
    <el-checkbox v-model="selectTargetData[0].option.angleAxisShow" @change="showChange" />
  </el-form-item>
  <el-form-item label="起始角度" :label-width="firstLabelWidth">
    <sw-input-number v-model="selectTargetData[0].option.angleAxisStartAngle" :controls="true" @change="update" />
  </el-form-item>
  <sw-collapse-item title="轴标签" v-model="selectTargetData[0].option.angleAxisLabelShow" showIcon @change="update">
    <template #content>
      <el-form-item label="标签间隔" :label-width="secondLabelWidth">
        <sw-input-number v-model="selectTargetData[0].option.angleAxisInterval" @change="update" />
      </el-form-item>
      <el-form-item label="距离" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.angleAxisMargin"
          unit="px"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="文本样式" :label-width="secondLabelWidth">
        <ConfigTextStyle v-model="angleAxisInput" @change="handleAngleAxisConfigTextChange" />
      </el-form-item>
    </template>
  </sw-collapse-item>
  <sw-collapse-item title="轴线" showIcon v-model="selectTargetData[0].option.angleAxisLineShow" @change="update">
    <template #content>
      <el-form-item label="颜色" :label-width="secondLabelWidth">
        <sw-single-color-picker
          v-model="selectTargetData[0].option.angleAxisLineColor"
          field="angleAxisLineColor"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="粗细" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.angleAxisLineWidth"
          unit="px"
          :min="0"
          :controls="false"
          @change="update"
        />
      </el-form-item>
    </template>
  </sw-collapse-item>
  <sw-collapse-item title="刻度" showIcon v-model="selectTargetData[0].option.angleAxisTickShow">
    <template #content>
      <el-form-item label="颜色" :label-width="secondLabelWidth">
        <sw-single-color-picker
          v-model="selectTargetData[0].option.angleAxisTickColor"
          field="angleAxisTickColor"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="粗细" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.angleAxisTickWidth"
          unit="px"
          :min="0"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="长度" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.angleAxisTickLength"
          unit="px"
          :min="0"
          :controls="false"
          @change="update"
        />
      </el-form-item>
    </template>
  </sw-collapse-item>
  <sw-collapse-item
    title="网格线"
    v-model="selectTargetData[0].option.angleAxisSplitLineShow"
    @change="update"
    showIcon
  >
    <template #content>
      <el-form-item label="颜色" :label-width="secondLabelWidth">
        <sw-single-color-picker
          v-model="selectTargetData[0].option.angleAxisSplitLineColor"
          field="angleAxisSplitLineColor"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="粗细" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.angleAxisSplitLineWidth"
          unit="px"
          :min="0"
          :controls="false"
          @change="update"
        />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import type { CheckboxValueType } from "element-plus";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { useUpdateInstance } from "@editor/useUpdateInstance";

import ConfigTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../../constants";

const { selectTargetData, update } = useUpdateInstance();
const showChange = (value: CheckboxValueType) => {
  selectTargetData.value[0].option.angleAxisShow = value as boolean;
  update();
};
const { input: angleAxisInput, handleConfigTextChange: handleAngleAxisConfigTextChange } = useFontStyleAttrs({
  fontFamily: "angleAxisFontFamily",
  fontSize: "angleAxisFontSize",
  color: "angleAxisColor",
  fontStyle: "angleAxisFontStyle",
  fontWeight: "angleAxisFontWeight"
});
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
