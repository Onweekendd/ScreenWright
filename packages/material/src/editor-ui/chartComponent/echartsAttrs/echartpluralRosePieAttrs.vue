<template>
  <div class="echartplural-rose-pie-attrs">
    <SwCoordinateTabs v-model="seriesTabs" :option="coordinateOption" />
    <template v-if="seriesTabs === 'angleAxis'">
      <el-form-item label="启用" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.angleAxisShow" @change="update" />
      </el-form-item>
      <el-form-item label="起始角度" :label-width="firstLabelWidth">
        <sw-input-number controls v-model="selectTargetData[0].option.angleAxisStartAngle" @change="update" />
      </el-form-item>
      <SwCollapseItem title="轴标签" v-model="selectTargetData[0].option.angleAxisLabelShow" show-icon @change="update">
        <template #content>
          <el-form-item label="标签间隔" :label-width="secondLabelWidth">
            <sw-input-number v-model="selectTargetData[0].option.angleAxisInterval" @change="update" />
          </el-form-item>
          <el-form-item label="距离" :label-width="secondLabelWidth">
            <sw-input-number
              v-model="selectTargetData[0].option.angleAxisMargin"
              unit="px"
              @change="update"
              :controls="false"
            />
          </el-form-item>
          <el-form-item label="文本样式" title="文本样式" :label-width="secondLabelWidth">
            <ConfigTextStyle v-model="input" @change="handleConfigTextChange" />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem title="轴线" v-model="selectTargetData[0].option.angleAxisLineShow" show-icon @change="update">
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
              @change="update"
              :controls="false"
            />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem title="刻度" v-model="selectTargetData[0].option.angleAxisTickShow" show-icon @change="update">
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
              v-model="selectTargetData[0].option.angleAxisTickWidth"
              unit="px"
              :min="0"
              @change="update"
              :controls="false"
            />
          </el-form-item>
          <el-form-item label="长度" :label-width="secondLabelWidth">
            <sw-input-number
              v-model.number="selectTargetData[0].option.angleAxisTickLength"
              unit="px"
              :min="0"
              @change="update"
              :controls="false"
            />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem
        title="网格线"
        v-model="selectTargetData[0].option.angleAxisSplitLineShow"
        show-icon
        @change="update"
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
              v-model="selectTargetData[0].option.angleAxisSplitLineWidth"
              unit="px"
              :min="0"
              @change="update"
              :controls="false"
            />
          </el-form-item>
        </template>
      </SwCollapseItem>
    </template>
    <template v-if="seriesTabs === 'radialAxis'">
      <el-form-item label="启用" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.radiusAxisShow" @change="update" />
      </el-form-item>
      <SwCollapseItem
        title="轴标签"
        v-model="selectTargetData[0].option.radiusAxisLabelShow"
        show-icon
        @change="update"
      >
        <template #content>
          <el-form-item label="数值范围" :label-width="secondLabelWidth">
            <div class="flex flex-center-between" style="width: 100%">
              <sw-input-number
                v-model="selectTargetData[0].option.radiusAxisMin"
                bottomLabel="最小值"
                @change="update"
                width="90"
              />
              <sw-input-number
                v-model="selectTargetData[0].option.radiusAxisMax"
                bottomLabel="最大值"
                @change="update"
                width="90"
              />
            </div>
          </el-form-item>
          <el-form-item label="距离" :label-width="secondLabelWidth">
            <sw-input-number
              v-model="selectTargetData[0].option.radiusAxisMargin"
              unit="px"
              :controls="false"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="文本样式" :label-width="secondLabelWidth">
            <ConfigTextStyle v-model="inputAxisLabel" @change="handleAxisLabelChange" />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem title="轴单位" v-model="selectTargetData[0].option.radiusAxisNameShow" show-icon @change="update">
        <template #content>
          <el-form-item label="内容" :label-width="secondLabelWidth">
            <sw-input v-model="selectTargetData[0].option.radiusAxisName" @change="update" />
          </el-form-item>
          <el-form-item label="文本样式" :label-width="secondLabelWidth">
            <ConfigTextStyle v-model="inputAxisName" @change="handleAxisNameChange" />
          </el-form-item>
          <el-form-item label="边距" :label-width="secondLabelWidth">
            <div class="flex">
              <sw-input-number
                v-model.number="selectTargetData[0].option.radiusAxisNamePaddingTop"
                bottomLabel="上"
                :controls="false"
                @change="update"
              />
              <sw-input-number
                v-model.number="selectTargetData[0].option.radiusAxisNamePaddingBottom"
                bottomLabel="下"
                :controls="false"
                @change="update"
              />
              <sw-input-number
                v-model.number="selectTargetData[0].option.radiusAxisNamePaddingLeft"
                bottomLabel="左"
                :controls="false"
                @change="update"
              />
              <sw-input-number
                v-model.number="selectTargetData[0].option.radiusAxisNamePaddingRight"
                bottomLabel="右"
                :controls="false"
                @change="update"
              />
            </div>
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem title="轴线" v-model="selectTargetData[0].option.radiusAxisLineShow" show-icon @change="update">
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
              v-model="selectTargetData[0].option.radiusAxisLineWidth"
              unit="px"
              :min="0"
              :controls="false"
              @change="update"
            />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem title="刻度" v-model="selectTargetData[0].option.radiusAxisTickShow" show-icon @change="update">
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
              v-model="selectTargetData[0].option.radiusAxisTickWidth"
              unit="px"
              :min="0"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="长度" :label-width="secondLabelWidth">
            <sw-input-number
              v-model.number="selectTargetData[0].option.radiusAxisTickLength"
              unit="px"
              :min="0"
              @change="update"
            />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <SwCollapseItem
        title="网格线"
        v-model="selectTargetData[0].option.radiusAxisSplitLineShow"
        show-icon
        @change="update"
      >
        <template #content>
          <el-form-item label="间隔" :label-width="secondLabelWidth">
            <sw-input-number v-model="selectTargetData[0].option.radiusAxisSplitLineNumber" :min="0" @change="update" />
          </el-form-item>
          <el-form-item label="颜色" :label-width="secondLabelWidth">
            <sw-single-color-picker
              v-model="selectTargetData[0].option.radiusAxisSplitLineColor"
              @change="update"
              field="radiusAxisSplitLineColor"
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
      </SwCollapseItem>
    </template>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwCoordinateTabs } from "@screenwright/ui/coordinate-tabs";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import ConfigTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const seriesTabs = ref("angleAxis");
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "angleAxisFontFamily",
  fontSize: "angleAxisFontSize",
  color: "angleAxisColor",
  fontStyle: "angleAxisFontStyle",
  fontWeight: "angleAxisFontWeight"
});
const { input: inputAxisLabel, handleConfigTextChange: handleAxisLabelChange } = useFontStyleAttrs({
  fontFamily: "radiusAxisFontFamily",
  fontSize: "radiusAxisFontSize",
  color: "radiusAxisColor",
  fontStyle: "radiusAxisFontStyle",
  fontWeight: "radiusAxisFontWeight"
});
const { input: inputAxisName, handleConfigTextChange: handleAxisNameChange } = useFontStyleAttrs({
  fontFamily: "radiusAxisNameFontFamily",
  fontSize: "radiusAxisNameFontSize",
  color: "radiusAxisNameColor",
  fontStyle: "radiusAxisNameFontStyle",
  fontWeight: "radiusAxisNameFontWeight"
});
const coordinateOption = ref([
  {
    label: "角度轴",
    value: "angleAxis"
  },
  {
    label: "径向轴",
    value: "radialAxis"
  }
]);
</script>
