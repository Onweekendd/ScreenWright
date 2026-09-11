<template>
  <div class="echart-growth-rate-bar-series">
    <sw-collapse-item title="数据系列" open>
      <template #content>
        <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="selectTargetData[0].option.seriesTabsName" />
        <div v-if="selectTargetData[0].option.seriesTabsName.length > 0">
          <el-form-item label="映射" :label-width="secondLabelWidth">
            <div class="fullWidth flex flex-center-between">
              <sw-input
                @change="update"
                width="90"
                v-model="selectTargetData[0].option.seriesName[currentIndex]"
                bottomLabel="字段名"
              />
              <sw-input
                @change="update"
                width="90"
                v-model="selectTargetData[0].option.dataSeriesName[currentIndex]"
                bottomLabel="显示名"
              />
            </div>
          </el-form-item>
          <el-form-item label="颜色" :label-width="secondLabelWidth">
            <sw-single-color-picker @change="update" v-model="selectTargetData[0].option.seriesColor[currentIndex]" />
          </el-form-item>
          <el-form-item label="边框颜色" :label-width="secondLabelWidth">
            <sw-single-color-picker @change="update" v-model="selectTargetData[0].option.borderColor[currentIndex]" />
          </el-form-item>
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
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const seriesTabs = ref("系列1");
const currentIndex = computed(() => {
  return selectTargetData.value[0].option.seriesTabsName.findIndex((item: any) => item === seriesTabs.value);
});
</script>
