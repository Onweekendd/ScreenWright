<template>
  <div class="map-effect-scatter-global">
    <SwCollapseItem title="数据标记" open>
      <template #content>
        <el-form-item label="标记大小" :label-width="secondLabelWidth">
          <sw-input-number @change="update" v-model="currentChildrenItem.option.symbolSize" />
        </el-form-item>
        <el-form-item label="标记颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="currentChildrenItem.option.insideColor" @change="update" />
        </el-form-item>

        <el-form-item label="边框宽度" :label-width="secondLabelWidth">
          <sw-input-number v-model="currentChildrenItem.option.borderWidth" unit="px" :min="0" @change="update" />
        </el-form-item>
        <el-form-item label="边框颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="currentChildrenItem.option.borderColor" @change="update" />
        </el-form-item>
        <el-form-item label="特效显示" :label-width="secondLabelWidth">
          <sw-radio
            direction="row"
            v-model="currentChildrenItem.option.showEffectOn"
            :option="showEffectOnType"
            @change="update"
          />
        </el-form-item>
        <SwCollapseItem
          @change="update"
          title="类目"
          show-icon
          v-model="currentChildrenItem.option.seriesLabelNameShow"
        >
          <template #content>
            <el-form-item label="文本样式" :label-width="38">
              <configTextStyle v-model="input" @change="handleChange" />
            </el-form-item>
          </template>
        </SwCollapseItem>
        <SwCollapseItem @change="update" title="值" show-icon v-model="currentChildrenItem.option.seriesLabelValueShow">
          <template #content>
            <el-form-item label="文本样式" :label-width="38">
              <configTextStyle v-model="seriesInput" @change="handleSeriesChange" />
            </el-form-item>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="波纹" open>
      <template #content>
        <el-form-item label="周期" :label-width="secondLabelWidth">
          <sw-input-number v-model="currentChildrenItem.option.rippleEffectPeriod" unit="s" :min="0" @change="update" />
        </el-form-item>
        <el-form-item label="缩放比例" :label-width="secondLabelWidth">
          <sw-input-number v-model="currentChildrenItem.option.rippleEffectScale" :min="0" @change="update" />
        </el-form-item>
        <el-form-item label="绘制方式" :label-width="secondLabelWidth">
          <sw-radio
            v-model="currentChildrenItem.option.rippleEffectBrushType"
            :option="rippleEffectBrushType"
            @change="update"
            direction="row"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwRadio from "@/components/SwRadio/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";

import type { StyleProps } from "../../../../components/configTextStyle/configTextStyle";
import configTextStyle from "../../../../components/configTextStyle/index.vue";
import { secondLabelWidth } from "../../../../constants";
import { useChildrenDrawer } from "../../useChildrenDrawer";

const { currentChildrenItem, update } = useChildrenDrawer();
const showEffectOnType = ref([
  { label: "绘制后", value: "render" },
  { label: "高亮时", value: "emphasis" }
]);
const rippleEffectBrushType = ref([
  { label: "填充", value: "fill" },
  { label: "单纹", value: "stroke" }
]);
const seriesInput = ref({
  fontSize: currentChildrenItem.value.option.seriesLabelValueFontSize,
  fontFamily: currentChildrenItem.value.option.seriesLabelValueFontFamily,
  fontWeight: currentChildrenItem.value.option.seriesLabelValueFontWeight,
  fontStyle: currentChildrenItem.value.option.seriesLabelValueFontStyle,
  color: currentChildrenItem.value.option.seriesLabelValueColor
});
const handleSeriesChange = (key: string, value: StyleProps) => {
  currentChildrenItem.value.option.seriesLabelValueColor = value.color;
  currentChildrenItem.value.option.seriesLabelValueFontSize = value.fontSize;
  currentChildrenItem.value.option.seriesLabelValueFontFamily = value.fontFamily;
  currentChildrenItem.value.option.seriesLabelValueFontWeight = value.fontWeight;
  currentChildrenItem.value.option.seriesLabelValueFontStyle = value.fontStyle;
  update();
};
const input = ref({
  fontSize: currentChildrenItem.value.option.seriesLabelNameFontSize,
  fontFamily: currentChildrenItem.value.option.seriesLabelNameFontFamily,
  fontWeight: currentChildrenItem.value.option.seriesLabelNameFontWeight,
  fontStyle: currentChildrenItem.value.option.seriesLabelNameFontStyle,
  color: currentChildrenItem.value.option.seriesLabelNameColor
});
const handleChange = (key: string, value: StyleProps) => {
  currentChildrenItem.value.option.seriesLabelNameColor = value.color;
  currentChildrenItem.value.option.seriesLabelNameFontSize = value.fontSize;
  currentChildrenItem.value.option.seriesLabelNameFontFamily = value.fontFamily;
  currentChildrenItem.value.option.seriesLabelNameFontWeight = value.fontWeight;
  currentChildrenItem.value.option.seriesLabelNameFontStyle = value.fontStyle;
  update();
};
</script>
<style lang="scss" scoped>
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
