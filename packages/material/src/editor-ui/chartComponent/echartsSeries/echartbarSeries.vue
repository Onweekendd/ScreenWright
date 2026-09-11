<template>
  <sw-collapse-item title="数据系列" open>
    <template #icon>
      <Icon type="CirclePlus" @click="addSeries" size="14" />
      <Icon type="Delete" @click="deleteSeries" size="14" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="selectTargetData[0].option.seriesTabsName" />
      <div v-if="selectTargetData[0].option.seriesTabsName.length > 0 && currentIndex !== -1">
        <el-form-item label="映射" :label-width="secondLabelWidth">
          <div class="fullWidth flex flex-center-between">
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
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-color-picker
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            :key="selectTargetData[0].option.seriesColor[currentIndex]"
            v-model:color="selectTargetData[0].option.seriesColor[currentIndex]"
            v-model:opacity="selectTargetData[0].option.seriesOpacity[currentIndex]"
            @change="update"
            input-disabled
          />
        </el-form-item>
        <!-- 极值高亮 -->
        <ItemBarextremeShow :currentIndex="currentIndex" />
        <!-- 数据标线 -->
        <div class="second_collapse" v-if="selectTargetData[0].option.markLineShow">
          <ItemBarmarkLineShow :currentIndex="currentIndex" :key="currentIndex" />
        </div>
      </div>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInput } from "@screenwright/ui/input";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import ItemBarextremeShow from "../ItemComponent/ItemBarextremeShow/index.vue";
import ItemBarmarkLineShow from "../ItemComponent/ItemBarmarkLineShow/index.vue";
import { useSeries } from "../ItemComponent/ItemSeries/useSeries";

const { selectTargetData, update } = useUpdateInstance();
const currentIndex = computed(() => {
  return selectTargetData.value[0].option.seriesTabsName.findIndex((item: any) => item.name === seriesTabs.value);
});
const seriesTabs = ref("系列1");
const list = [
  "dataSeriesName",
  "seriesColor",
  "extremeColor",
  "extremeColorpicker",
  "extremeShow",
  "extremeType",
  "extremeOpacity",
  "seriesOpacity",
  "seriesColorpicker",
  "markLineSymbolStart",
  "markLineSymbolStartImage",
  "markLineSymbolEnd",
  "markLineSymbolEndImage",
  "markLineSymbolWidth",
  "markLineSymbolHeight",
  "markLineLabelShow",
  "markLineLabelPosition",
  "markLineLabelDistance",
  "markLineLabelCustom",
  "markLineLabelFontFamily",
  "markLineLabelFontStyle",
  "markLineLabelFontSize",
  "markLineLabelColor",
  "markLineLabelFontWeight",
  "markLineLabelPaddingTop",
  "markLineLabelPaddingRight",
  "markLineLabelPaddingBottom",
  "markLineLabelPaddingLeft",
  "markLineLineColor",
  "markLineLineWidth",
  "markLineLineType",
  "markLineShow",
  "markLineDataType"
];
const { handleAddSeries, handleDeleteSeries } = useSeries({
  list,
  activeTab: seriesTabs,
  seriesName: "seriesTabsName",
  limitNum: 1,
  sName: "系列"
});
const deleteSeries = () => {
  handleDeleteSeries();
};
const addSeries = () => {
  handleAddSeries();
};
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
