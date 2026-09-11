<!-- 环状饼图-图例 -->
<template>
  <sw-collapse-item title="图例" v-model="selectTargetData[0].option.legendShow" showIcon @change="update">
    <template #content>
      <el-form-item label="图标尺寸">
        <sw-slider v-model="selectTargetData[0].option.legendItemWidthHeight" :max="40" @change="update" />
      </el-form-item>
      <sw-collapse-item title="类目" v-model="selectTargetData[0].option.legendSeriesShow" showIcon>
        <template #content>
          <el-form-item label="文本样式" title="文本样式" :label-width="thirdLabelWidth">
            <configTextStyle v-model="input" @change="handleConfigTextChange" />
          </el-form-item>
        </template>
      </sw-collapse-item>
      <!-- 真实值 -->
      <PieRealConfig />
      <!-- 占比值 -->
      <proportionConfig />
      <sw-collapse-item title="分隔线" v-model="selectTargetData[0].option.legendUnderlineShow" showIcon>
        >
        <template #content>
          <el-form-item label="宽度" :label-width="thirdLabelWidth">
            <sw-slider v-model="selectTargetData[0].option.legendUnderlineWidth" :max="15" @change="update" />
          </el-form-item>
          <el-form-item label="间距" :label-width="thirdLabelWidth">
            <sw-input-number
              v-model="selectTargetData[0].option.legendUnderlineInterval"
              unit="px"
              :controls="false"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="偏移" :label-width="thirdLabelWidth">
            <div class="fullWidth flex flex-center-between">
              <sw-input-number
                v-model="selectTargetData[0].option.legendUnderlineOffsetX"
                unit="%"
                bottomLabel="X"
                :controls="false"
                @change="update"
                width="90"
              />
              <sw-input-number
                v-model="selectTargetData[0].option.legendUnderlineOffsetY"
                unit="%"
                bottomLabel="Y"
                :controls="false"
                @change="update"
                width="90"
              />
            </div>
          </el-form-item>
        </template>
      </sw-collapse-item>

      <sw-collapse-item title="布局">
        <template #content>
          <el-form-item label="间距" :label-width="thirdLabelWidth">
            <sw-input-number
              v-model.number="selectTargetData[0].option.legendItemGap"
              unit="%"
              :controls="false"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="偏移" :label-width="thirdLabelWidth">
            <div class="input-wrap flex flex-center-between">
              <sw-input-number
                v-model.number="selectTargetData[0].option.legendOffsetX"
                unit="%"
                bottomLabel="X"
                :controls="false"
                @change="update"
                width="90"
              />
              <sw-input-number
                v-model.number="selectTargetData[0].option.legendOffsetY"
                unit="%"
                bottomLabel="Y"
                :controls="false"
                @change="update"
                width="90"
              />
            </div>
          </el-form-item>
        </template>
      </sw-collapse-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { thirdLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import PieRealConfig from "../ItemPieConfigLegend/pieRealConfig.vue";
import proportionConfig from "../ItemPieConfigLegend/proportionConfig.vue";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "legendSeriesFontFamily",
  fontStyle: "legendSeriesFontStyle",
  fontWeight: "legendSeriesFontWeight",
  fontSize: "legendSeriesFontSize",
  color: "legendSeriesColor"
});
</script>

<style lang="scss" scoped>
.input-wrap {
  width: 100%;
}
</style>
