<template>
  <div class="echartscatter-series">
    <sw-collapse-item title="数据系列" open>
      <template #icon>
        <Icon type="CirclePlus" @click="handleAddSeries" />
        <Icon type="Delete" @click="handleDeleteSeries" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="selectTargetData[0].option.seriesTabsName" />
        <div v-for="(item, index) in selectTargetData[0].option.dataSeriesName" :key="index">
          <div v-if="selectTargetData[0].option.seriesTabsName[index].name === seriesTabs">
            <el-form-item label="映射">
              <div class="fullWidth flex flex-center-between">
                <sw-input
                  @change="update"
                  width="90"
                  v-model="selectTargetData[0].option.dataSeriesName[index]"
                  bottomLabel="字段名"
                />
                <sw-input
                  width="90"
                  v-model="selectTargetData[0].option.seriesTabsName[index].value"
                  bottomLabel="显示名"
                  @change="update"
                />
              </div>
            </el-form-item>
            <el-form-item label="半径">
              <sw-input-number
                @change="update"
                v-model.number="selectTargetData[0].option.seriesSymbolSize[index]"
                unit="px"
                :min="0"
                :controls="false"
              />
            </el-form-item>
            <el-form-item label="填充">
              <sw-single-color-picker
                @change="update"
                v-model="selectTargetData[0].option.seriesColor[index]"
                field="seriesColor"
              />
            </el-form-item>

            <sw-collapse-item title="边框" showIcon v-model="selectTargetData[0].option.seriesItemBorderShow[index]">
              <template #content>
                <el-form-item label="颜色">
                  <sw-single-color-picker
                    @change="update"
                    v-model="selectTargetData[0].option.seriesItemBorderColor[index]"
                    field="seriesItemBorderColor"
                  />
                </el-form-item>
                <el-form-item label="粗细">
                  <sw-input-number
                    @change="update"
                    v-model.number="selectTargetData[0].option.seriesItemBorderWidth[index]"
                    unit="px"
                    :min="0"
                    :controls="false"
                  />
                </el-form-item>
              </template>
            </sw-collapse-item>
          </div>
        </div>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";
import { useSeries } from "../ItemComponent/ItemSeries/useSeries";

const { update, selectTargetData } = useUpdateInstance();
const seriesTabs = ref("系列1");
const list = [
  "dataSeriesName",
  "seriesSymbolSize",
  "seriesColor",
  "seriesItemBorderShow",
  "seriesItemBorderColor",
  "seriesItemBorderWidth"
];
const { handleAddSeries, handleDeleteSeries } = useSeries({
  list,
  activeTab: seriesTabs,
  seriesName: "seriesTabsName",
  limitNum: 1,
  sName: "系列"
});
</script>
