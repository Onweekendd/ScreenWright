<template>
  <sw-collapse-item title="数据系列" open>
    <template #icon>
      <Icon type="CirclePlus" @click="handleAdd" />
      <Icon type="Delete" @click="handleDel" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="selectTargetData[0].option.seriesTabsName" />
      <div v-if="currentIndex != -1">
        <el-form-item label="映射" :label-width="secondLabelWidth">
          <div class="flex fullWidth flex-center-between">
            <sw-input
              v-model="selectTargetData[0].option.dataSeriesName[currentIndex]"
              bottomLabel="字段名"
              width="90"
              @change="update"
            />
            <sw-input
              v-model="selectTargetData[0].option.seriesTabsName[currentIndex].value"
              bottomLabel="显示名"
              width="90"
              @change="update"
            />
          </div>
        </el-form-item>
        <div class="second_collapse">
          <sw-collapse-item title="折线" open>
            <template #content>
              <el-form-item label="颜色" :label-width="thirdLabelWidth">
                <sw-single-color-picker
                  v-model="selectTargetData[0].option.seriesLineColor[currentIndex]"
                  field="seriesLineColor"
                  @change="update"
                />
              </el-form-item>
              <el-form-item label="粗细" :label-width="thirdLabelWidth">
                <sw-slider v-model="selectTargetData[0].option.seriesLineWidth[currentIndex]" @change="update" />
              </el-form-item>
              <el-form-item label="阴影" :label-width="thirdLabelWidth">
                <div class="flex fullWidth flex-center flex-justify-between">
                  <FrontColorPicker
                    v-model="selectTargetData[0].option.seriesLineShadowColor[currentIndex]"
                    @change="update"
                  />
                  <sw-input-number
                    v-model="selectTargetData[0].option.seriesLineShadowOffsetX[currentIndex]"
                    bottomLabel="X"
                    width="48"
                    @change="update"
                  />
                  <sw-input-number
                    v-model="selectTargetData[0].option.seriesLineShadowOffsetY[currentIndex]"
                    bottomLabel="Y"
                    width="48"
                    @change="update"
                  />
                  <sw-input-number
                    v-model="selectTargetData[0].option.seriesLineShadowBlur[currentIndex]"
                    bottomLabel="模糊"
                    width="48"
                    @change="update"
                  />
                </div>
              </el-form-item>
            </template>
          </sw-collapse-item>
          <sw-collapse-item title="数据标记" open>
            <template #content>
              <el-form-item label="标记图形" title="标记图形" :label-width="thirdLabelWidth">
                <el-select
                  v-model="selectTargetData[0].option.seriesSymbol[currentIndex]"
                  popper-class="sw-select-dropdown"
                  @change="update"
                >
                  <el-option v-for="item in seriesSymbol" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item
                label="图片"
                v-if="selectTargetData[0].option.seriesSymbol[currentIndex] === 'image'"
                :label-width="thirdLabelWidth"
              >
                <sw-upload
                  v-model="selectTargetData[0].option.seriesSymbolImage[currentIndex]"
                  :multiple="false"
                  :showFileList="false"
                  @change="update"
                  @delete="update"
                />
              </el-form-item>
              <el-form-item label="颜色" v-else :label-width="thirdLabelWidth">
                <sw-single-color-picker
                  v-model="selectTargetData[0].option.seriesItemColor[currentIndex]"
                  field="seriesItemColor"
                  @change="update"
                />
              </el-form-item>
              <el-form-item label="尺寸" :label-width="thirdLabelWidth">
                <div class="flex fullWidth flex-justify-between">
                  <sw-input-number
                    v-model.number="selectTargetData[0].option.seriesSymbolWidth[currentIndex]"
                    unit="px"
                    bottomLabel="宽度"
                    :min="0"
                    :controls="false"
                    width="90"
                    @change="update"
                  />
                  <sw-input-number
                    v-model.number="selectTargetData[0].option.seriesSymbolHeight[currentIndex]"
                    unit="px"
                    bottomLabel="高度"
                    :min="0"
                    :controls="false"
                    width="90"
                    @change="update"
                  />
                </div>
              </el-form-item>
              <el-form-item
                label="边框宽度"
                title="边框宽度"
                v-if="selectTargetData[0].option.seriesSymbol[currentIndex] !== 'image'"
                :label-width="thirdLabelWidth"
              >
                <sw-input-number
                  v-model.number="selectTargetData[0].option.seriesItemBorderWidth[currentIndex]"
                  unit="px"
                  :min="0"
                  :controls="false"
                  @change="update"
                />
              </el-form-item>
              <el-form-item
                label="边框颜色"
                title="边框颜色"
                v-if="selectTargetData[0].option.seriesSymbol[currentIndex] !== 'image'"
                :label-width="thirdLabelWidth"
              >
                <sw-single-color-picker
                  v-model="selectTargetData[0].option.seriesItemBorderColor[currentIndex]"
                  field="seriesItemBorderColor"
                  @change="update"
                />
              </el-form-item>
            </template>
          </sw-collapse-item>
          <sw-collapse-item title="区域" open>
            <template #content>
              <el-form-item label="颜色" :label-width="thirdLabelWidth">
                <sw-single-color-picker
                  v-model="selectTargetData[0].option.seriesAreaColor[currentIndex]"
                  field="seriesAreaColor"
                  @change="update"
                />
              </el-form-item>
            </template>
          </sw-collapse-item>
        </div>
      </div>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { ScreenwrightColorPicker as FrontColorPicker } from "@screenwright/ui";
import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth, thirdLabelWidth } from "../../constants";
import { seriesSymbol } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import { useSeries } from "../ItemComponent/ItemSeries/useSeries";

const { selectTargetData, update } = useUpdateInstance();
const seriesTabs = ref("系列1");
const currentIndex = computed(() => {
  return selectTargetData.value[0].option.seriesTabsName.findIndex((item: any) => item.name === seriesTabs.value);
});
const { handleAddSeries, handleDeleteSeries } = useSeries({
  list: [
    "dataSeriesName",
    "seriesLineColor",
    "seriesLineWidth",
    "seriesLineShadowColor",
    "seriesLineShadowOffsetX",
    "seriesLineShadowOffsetY",
    "seriesLineShadowBlur",
    "seriesSymbol",
    "seriesSymbolImage",
    "seriesSymbolWidth",
    "seriesSymbolHeight",
    "seriesItemColor",
    "seriesItemBorderWidth",
    "seriesItemBorderColor",
    "seriesAreaColor"
  ],
  activeTab: seriesTabs,
  seriesName: "seriesTabsName",
  limitNum: 1,
  sName: "系列"
});
const handleAdd = () => {
  handleAddSeries();
};
const handleDel = () => {
  handleDeleteSeries();
};
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
