<template>
  <sw-collapse-item title="数据排名" open>
    <template #icon>
      <Icon type="CirclePlus" @click="addSeries" size="14" />
      <Icon type="Delete" @click="removeSeries" size="14" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="selectTargetData[0].option.seriesTabsName" />
      <div v-if="selectTargetData[0].option.seriesTabsName.length > 0 && currentIndex != -1">
        <div class="second_collapse">
          <sw-collapse-item title="条形样式" open>
            <template #content>
              <el-form-item label="颜色" :label-width="thirdLabelWidth">
                <!-- 排名图的透明度是不能修改 -->
                <sw-color-picker
                  :key="selectTargetData[0].option.seriesColor[currentIndex]"
                  v-model:color="selectTargetData[0].option.seriesColor[currentIndex]"
                  v-model:opacity="selectTargetData[0].option.seriesOpacity[currentIndex]"
                  field="seriesColor"
                  inputDisabled
                  @change="update"
                />
              </el-form-item>
            </template>
          </sw-collapse-item>
          <sw-collapse-item title="排名标签" open>
            <template #content>
              <el-form-item label="背景" :label-width="thirdLabelWidth">
                <sw-upload
                  v-model="selectTargetData[0].option.seriesLabelBackground[currentIndex]"
                  :multiple="false"
                  :showFileList="false"
                  @change="update"
                  @delete="update"
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

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import { useSeries } from "../ItemComponent/ItemSeries/useSeries";

const { selectTargetData, update } = useUpdateInstance();
const seriesTabs = ref("排名1");
const list = ["seriesColor", "seriesOpacity", "seriesLabelBackground"];
const { handleAddSeries, handleDeleteSeries } = useSeries({
  list,
  activeTab: seriesTabs,
  seriesName: "seriesTabsName",
  limitNum: 0,
  sName: "排名"
});
const currentIndex = computed(() => {
  return selectTargetData.value[0].option.seriesTabsName.findIndex((item: any) => item === seriesTabs.value);
});
const addSeries = () => {
  if (selectTargetData.value[0].option.seriesColor.length > 0) {
    handleAddSeries();
  } else {
    selectTargetData.value[0].option.seriesColor = [
      {
        type: "linear-gradient",
        angle: "90",
        colors: [
          {
            color: "rgba(62,67,244,1)",
            per: 0
          },
          {
            color: "rgba(137,181,252,1)",
            per: 100
          }
        ]
      }
    ];
    selectTargetData.value[0].option.seriesOpacity = [1];
    selectTargetData.value[0].option.seriesLabelBackground = [""];
    selectTargetData.value[0].option.seriesTabsName = ["排名1"];
    seriesTabs.value = "排名1";
  }
};
const removeSeries = () => {
  handleDeleteSeries();
};
</script>
