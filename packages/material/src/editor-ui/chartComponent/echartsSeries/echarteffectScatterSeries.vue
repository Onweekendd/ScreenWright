<template>
  <div class="echart-effect-scatter-series">
    <sw-collapse-item title="数据节点" open>
      <template #icon>
        <Icon type="CirclePlus" @click="addSeries" />
        <Icon type="Delete" @click="deleteSeries" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs
          v-model="seriesTabs"
          :tabs="selectTargetData[0].option.seriesList.map((item: any) => item.tabName)"
        />
        <div v-if="selectTargetData[0].option.seriesList.length > 0">
          <el-form-item label="节点" :label-width="secondLabelWidth">
            <sw-input
              @change="update"
              v-model="selectTargetData[0].option.seriesList[currentIndex].name"
              bottomLabel="名称"
            />
          </el-form-item>
          <el-form-item label="位置" :label-width="secondLabelWidth">
            <div class="fullWidth flex flex-center-between">
              <sw-input-number
                v-model="selectTargetData[0].option.seriesList[currentIndex].translateX"
                bottomLabel="x"
                unit="%"
                :min="0"
                :max="100"
                :controls="false"
                @change="update"
                width="90"
              />
              <sw-input-number
                v-model="selectTargetData[0].option.seriesList[currentIndex].translateY"
                bottomLabel="y"
                unit="%"
                :min="0"
                :max="100"
                :controls="false"
                @change="update"
                width="90"
              />
            </div>
          </el-form-item>
          <el-form-item label="大小" :label-width="secondLabelWidth">
            <sw-input-number
              @change="update"
              v-model="selectTargetData[0].option.seriesList[currentIndex].size"
              :controls="false"
            />
          </el-form-item>
          <el-form-item label="径内颜色" :label-width="secondLabelWidth">
            <sw-single-color-picker
              @change="update"
              v-model="selectTargetData[0].option.seriesList[currentIndex].insideColor"
            />
          </el-form-item>
          <el-form-item label="径外颜色" :label-width="secondLabelWidth">
            <sw-single-color-picker
              @change="update"
              v-model="selectTargetData[0].option.seriesList[currentIndex].outsideColor"
            />
          </el-form-item>
          <el-form-item label="特效显示" :label-width="secondLabelWidth">
            <sw-radio
              v-model="selectTargetData[0].option.seriesList[currentIndex].showEffectOn"
              :option="showEffectOn"
              @change="update"
              direction="row"
            />
          </el-form-item>
          <ItemseriesLabelValue title="排名" prefix="seriesLabelTop" :currentIndex="currentIndex" />
          <ItemseriesLabelValue title="类目" prefix="seriesLabelName" :currentIndex="currentIndex" />
          <ItemseriesLabelValue title="值" prefix="seriesLabelValue" :currentIndex="currentIndex" />
        </div>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio } from "@screenwright/ui/radio";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "../../constants";
import { showEffectOn } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import { useSeries } from "../ItemComponent/ItemSeries/useSeries";
import ItemseriesLabelValue from "../ItemComponent/ItemseriesLabelValue/index.vue";

const currentIndex = computed(() => {
  return selectTargetData.value[0].option.seriesList.findIndex((item: any) => item.tabName === seriesTabs.value);
});

const { update, selectTargetData } = useUpdateInstance();
const seriesTabs = ref("Top1");
const deleteSeries = () => {
  handleDeleteSeries();
  update();
};
const { handleAddSeries, handleDeleteSeries } = useSeries({
  list: [],
  activeTab: seriesTabs,
  seriesName: "seriesList",
  limitNum: 1,
  sName: "Top",
  tabName: "tabName"
});
const addSeries = () => {
  handleAddSeries();
  update();
};
</script>
