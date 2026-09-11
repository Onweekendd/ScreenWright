<template>
  <div class="echart-zebra-bar-and-line-series">
    <sw-collapse-item title="数据系列" open>
      <template #icon>
        <Icon type="CirclePlus" @click="hanldeAdd" size="14" />
        <Icon type="Delete" @click="handleDel" size="14" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="activeTab" :tabs="selectTargetData[0].option.seriesTabsName" />

        <el-form-item label="映射" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input
              v-model="selectTargetData[0].option.dataSeriesName[currentIndex]"
              bottomLabel="字段名"
              @change="update"
            />
            <sw-input
              v-model="selectTargetData[0].option.seriesTabsName[currentIndex].value"
              bottomLabel="显示名"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="类型" :label-width="secondLabelWidth">
          <sw-radio
            v-model="selectTargetData[0].option.seriesType[currentIndex]"
            :option="seriesType"
            :disabled="typeDisabled"
            direction="row"
            @change="update"
          />
        </el-form-item>

        <el-form-item
          label="Y轴索引"
          v-if="selectTargetData[0].option.yAxisIndex && isShowYAxisIndex"
          :label-width="secondLabelWidth"
        >
          <el-radio v-model="selectTargetData[0].option.yAxisIndex[currentIndex]" :label="0" @change="update"
            >左轴</el-radio
          >
          <el-radio v-model="selectTargetData[0].option.yAxisIndex[currentIndex]" :label="1" @change="update"
            >右轴</el-radio
          >
        </el-form-item>

        <template v-if="selectTargetData[0].option.seriesType[currentIndex] === 'bar'">
          <ItemZebraBarAmdLineBarSetting
            :currentIndex="currentIndex"
            :showSeriesWidth="showSeriesWidth"
            :showIntervalColor="showIntervalColor"
            :showSeriesLabel="showSeriesLabel"
            :showTextDynamic="showTextDynamic"
            :showMarkLineLabelCustom="showMarkLineLabelCustom"
          />
        </template>
        <template v-if="selectTargetData[0].option.seriesType[currentIndex] === 'line'">
          <ItemZebraBarAmdLineLineSetting
            :currentIndex="currentIndex"
            :showSeriesAreaColor="showSeriesAreaColor"
            :showTextDynamic="showTextDynamic"
            :useSingleColorPicker="useSingleColorPicker"
            :showMarkLineLabelCustom="showMarkLineLabelCustom"
          />
        </template>
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwRadio } from "@screenwright/ui/radio";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "../../constants";
import { seriesType } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import { useSeries } from "../ItemComponent/ItemSeries/useSeries";
import ItemZebraBarAmdLineBarSetting from "../ItemComponent/ItemZebraBarAmdLineBarSetting/index.vue";
import ItemZebraBarAmdLineLineSetting from "../ItemComponent/ItemZebraBarAmdLineLineSetting/index.vue";

withDefaults(
  defineProps<{
    showSeriesWidth?: boolean;
    showIntervalColor?: boolean;
    useSingleColorPicker?: boolean;
    showSeriesAreaColor?: boolean;
    showSeriesLabel?: boolean;
    showMarkLineLabelCustom?: boolean;
    showTextDynamic?: boolean;
    typeDisabled?: boolean;
    isShowYAxisIndex?: boolean;
  }>(),
  {
    showSeriesWidth: true,
    showIntervalColor: true,
    useSingleColorPicker: false,
    showSeriesAreaColor: false,
    showSeriesLabel: false,
    showMarkLineLabelCustom: true,
    showTextDynamic: false,
    typeDisabled: true,
    isShowYAxisIndex: false
  }
);
const { selectTargetData, update } = useUpdateInstance();
const activeTab = ref("系列1");
const currentIndex = computed(() => {
  return selectTargetData.value[0].option.seriesTabsName.findIndex((item: any) => item.name === activeTab.value);
});

const fieldList = ref([
  "dataSeriesName",
  "seriesType",
  "seriesLineColor",
  "seriesLineOpacity",
  "seriesLineWidth",
  "seriesSmoothShow",
  "seriesSmooth",
  "seriesSymbolShow",
  "seriesSymbol",
  "seriesSymbolImage",
  "seriesSymbolWidth",
  "seriesSymbolHeight",
  "seriesItemColor",
  "seriesItemBorderWidth",
  "seriesItemBorderColor",
  "seriesLabelShow",
  "seriesLabelColor",
  "seriesLabelFontFamily",
  "seriesLabelFontSize",
  "seriesLabelFontWeight",
  "seriesLabelFontStyle",
  "seriesLabelOffsetX",
  "seriesLabelOffsetY",
  "seriesWidth",
  "seriesBarColor",
  "seriesBarOpacity",
  "intervalColor",
  "seriesAreaOpacity"
]);
const { handleAddSeries, handleDeleteSeries } = useSeries({
  list: fieldList.value,
  activeTab: activeTab,
  seriesName: "seriesTabsName",
  limitNum: 1,
  sName: "系列"
});
const hanldeAdd = () => {
  // const len = selectTargetData.value[0].option.seriesTabsName.length - 1
  // fieldList.value.forEach((item) => {
  //   if (item == "seriesTabsName") {
  //     selectTargetData.value[0].option[item].push({
  //       name: "系列" + (len + 2),
  //       value: selectTargetData.value[0].option.seriesTabsName[len].value
  //     })
  //   } else {
  //     selectTargetData.value[0].option[item].push(selectTargetData.value[0].option[item][len])
  //   }
  // })
  // activeTab.value = selectTargetData.value[0].option.seriesTabsName[len + 1].name
  handleAddSeries();
  update();
};
const handleDel = () => {
  // if (selectTargetData.value[0].option.seriesTabsName.length == 1) {
  //   return
  // }
  // fieldList.value.forEach((item) => {
  //   selectTargetData.value[0].option[item].pop()
  // })
  // const len = selectTargetData.value[0].option.seriesTabsName.length - 1
  // activeTab.value = selectTargetData.value[0].option.seriesTabsName[len].name
  handleDeleteSeries();
  update();
};
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
@include radio-style();
</style>
