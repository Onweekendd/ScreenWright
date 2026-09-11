<!-- 系列设置 -->
<template>
  <sw-collapse-item title="数据系列" open>
    <template #icon>
      <Icon type="CirclePlus" @click="handleAddSeries" />
      <Icon type="Delete" @click="handleDeleteSeries" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="selectTargetData[0].option.dataSeriesName" />
      <template v-if="selectTargetData[0].option.dataSeriesName.length > 0">
        <el-form-item label="类目名" :label-width="secondLabelWidth">
          <sw-input @change="update" v-model="selectTargetData[0].option.seriesTabsName[currentIndex]" />
        </el-form-item>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <Ft-single-color-picker
            @change="update"
            v-model="selectTargetData[0].option.seriesColor[currentIndex]"
            field="seriesColor"
          />
        </el-form-item>
      </template>
    </template>
  </sw-collapse-item>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import { useSeries } from "../ItemComponent/ItemSeries/useSeries";

const { selectTargetData, update } = useUpdateInstance();
const seriesTabs = ref("系列1");
const currentIndex = computed(() => {
  return selectTargetData.value[0].option.dataSeriesName.findIndex((item: any) => item === seriesTabs.value);
});

const list = ["seriesTabsName", "seriesColor"];
const { handleAddSeries, handleDeleteSeries } = useSeries({
  list,
  activeTab: seriesTabs,
  seriesName: "dataSeriesName",
  limitNum: 1,
  sName: "系列"
});
</script>
<style lang="scss" scoped>
.input-wrap {
  width: 100%;
}
</style>
