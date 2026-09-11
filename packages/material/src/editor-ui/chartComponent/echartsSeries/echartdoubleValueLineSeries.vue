<template>
  <div class="echart-double-value-line-series">
    <sw-collapse-item title="数据系列" open>
      <template #icon>
        <Icon type="CirclePlus" @click="handleAddSeries" size="14" />
        <Icon type="Delete" @click="handleDeleteSeries" size="14" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="selectTargetData[0].option.seriesTabsName" />
        <div v-if="selectTargetData[0].option.seriesTabsName.length > 0">
          <el-form-item label="映射" :label-width="secondLabelWidth">
            <div class="fullWidth flex flex-center-between">
              <sw-input
                v-model="selectTargetData[0].option.dataSeriesName[currentIndex]"
                bottomLabel="字段名"
                @change="update"
              />
              <sw-input v-model="selectTargetData[0].option.seriesTabsName[currentIndex].value" bottomLabel="显示名" />
            </div>
          </el-form-item>
          <el-form-item label="颜色" :label-width="secondLabelWidth">
            <sw-single-color-picker
              v-model="selectTargetData[0].option.seriesColor[currentIndex]"
              field="seriesColor"
              @change="update"
            />
          </el-form-item>
          <SwCollapseItem
            @change="update"
            v-model="selectTargetData[0].option.seriesLabelShow[currentIndex]"
            title="数值标签"
            showIcon
          >
            <template #content>
              <el-form-item label="文本样式" title="文本样式" :label-width="thirdLabelWidth">
                <ConfigTextStyle v-model="input" @change="handleConfigTextChange" />
              </el-form-item>
              <el-form-item label="偏移" :label-width="thirdLabelWidth">
                <div class="flex flex-center-between">
                  <sw-input-number
                    v-model.number="selectTargetData[0].option.seriesLabelOffsetX[currentIndex]"
                    unit="px"
                    bottomLabel="X"
                    :controls="false"
                  />
                  <sw-input-number
                    v-model.number="selectTargetData[0].option.seriesLabelOffsetY[currentIndex]"
                    unit="px"
                    bottomLabel="Y"
                    :controls="false"
                  />
                </div>
              </el-form-item>
            </template>
          </SwCollapseItem>
          <!-- <ItemConfigNumber type="none" :index="currentIndex" :labelWidth="thirdLabelWidth" /> -->
        </div>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import Icon from "@editor/base/Icon/index.vue";

import ConfigTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth, thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import { useSeries } from "../ItemComponent/ItemSeries/useSeries";

const { update, selectTargetData } = useUpdateInstance();

const seriesTabs = ref("系列1");
const list = [
  "dataSeriesName",
  "seriesColor",
  "seriesLabelFontFamily",
  "seriesLabelFontSize",
  "seriesLabelColor",
  "seriesLabelFontStyle",
  "seriesLabelFontWeight",
  "seriesLabelOffsetX",
  "seriesLabelOffsetY"
];
const currentIndex = computed(() => {
  return selectTargetData.value[0].option.seriesTabsName.findIndex((item: any) => item.name === seriesTabs.value);
});
const { input, handleConfigTextChange, setInput } = useFontStyleAttrs(
  {
    fontFamily: "seriesLabelFontFamily",
    fontSize: "seriesLabelFontSize",
    color: "seriesLabelColor",
    fontStyle: "seriesLabelFontStyle",
    fontWeight: "seriesLabelFontWeight"
  },
  currentIndex.value
);
watch(
  () => currentIndex.value,
  (nVal) => {
    setInput(
      {
        fontFamily: "seriesLabelFontFamily",
        fontSize: "seriesLabelFontSize",
        color: "seriesLabelColor",
        fontStyle: "seriesLabelFontStyle",
        fontWeight: "seriesLabelFontWeight"
      },
      nVal
    );
    console.log(nVal, "nVal");
  }
);
const { handleAddSeries, handleDeleteSeries } = useSeries({
  list,
  activeTab: seriesTabs,
  seriesName: "seriesTabsName",
  limitNum: 1,
  sName: "系列"
});
</script>
