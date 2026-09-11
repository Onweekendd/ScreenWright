<template>
  <div class="radius-axis">
    <el-form-item label="启用" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.radiusAxisShow" @change="update" />
    </el-form-item>
    <sw-collapse-item title="轴标签" showIcon v-model="selectTargetData[0].option.radiusAxisLabelShow" @change="update">
      <template #content>
        <el-form-item label="数值范围" :label-width="secondLabelWidth">
          <div class="fullWidth flex flex-center-between">
            <sw-input-number
              width="90"
              v-model="selectTargetData[0].option.radiusAxisMin"
              bottomLabel="最小值"
              @change="update"
            />
            <sw-input-number
              width="90"
              v-model="selectTargetData[0].option.radiusAxisMax"
              bottomLabel="最大值"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="距离" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.radiusAxisMargin"
            unit="px"
            :controls="false"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="radiusAxisInput" @change="handleRadiusAxisConfigTextChange" />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="轴单位" v-model="selectTargetData[0].option.radiusAxisNameShow" @change="update" showIcon>
      <template #content>
        <el-form-item label="内容" :label-width="secondLabelWidth">
          <sw-input v-model="selectTargetData[0].option.radiusAxisName" @change="update" />
        </el-form-item>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="radiusAxisNameInput" @change="handleRadiusAxisNameConfigTextChange" />
        </el-form-item>
        <el-form-item label="边距" :label-width="secondLabelWidth">
          <ItemConfigDistance :type="TypeAttrs.rosePie" :labelWidth="secondLabelWidth" />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item
      title="轴线"
      disabledField="radiusAxisLineShow"
      v-model="selectTargetData[0].option.radiusAxisLineShow"
      @change="update"
    >
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            v-model="selectTargetData[0].option.radiusAxisLineColor"
            field="radiusAxisLineColor"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.radiusAxisLineWidth"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="刻度" v-model="selectTargetData[0].option.radiusAxisTickShow" showIcon @change="update">
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            v-model="selectTargetData[0].option.radiusAxisTickColor"
            field="radiusAxisTickColor"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.radiusAxisTickWidth"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="长度" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.radiusAxisTickLength"
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
      showIcon
      v-model="selectTargetData[0].option.radiusAxisSplitLineShow"
      @change="update"
    >
      <template #content>
        <el-form-item label="间隔" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.radiusAxisSplitLineNumber"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            v-model="selectTargetData[0].option.radiusAxisSplitLineColor"
            field="radiusAxisSplitLineColor"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.radiusAxisSplitLineWidth"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { useUpdateInstance } from "@editor/useUpdateInstance";

import ItemConfigDistance from "../../../components/configDistance/index.vue";
import { TypeAttrs } from "../../../components/configDistance/useAttrsByType";
import ConfigTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../../constants";

const { selectTargetData, update } = useUpdateInstance();

const { input: radiusAxisInput, handleConfigTextChange: handleRadiusAxisConfigTextChange } = useFontStyleAttrs({
  fontFamily: "radiusAxisFontFamily",
  fontSize: "radiusAxisFontSize",
  color: "radiusAxisColor",
  fontStyle: "radiusAxisFontStyle",
  fontWeight: "radiusAxisFontWeight"
});
const { input: radiusAxisNameInput, handleConfigTextChange: handleRadiusAxisNameConfigTextChange } = useFontStyleAttrs({
  fontFamily: "radiusAxisNameFontFamily",
  fontSize: "radiusAxisNameFontSize",
  color: "radiusAxisNameColor",
  fontStyle: "radiusAxisNameFontStyle",
  fontWeight: "radiusAxisNameFontWeight"
});
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
