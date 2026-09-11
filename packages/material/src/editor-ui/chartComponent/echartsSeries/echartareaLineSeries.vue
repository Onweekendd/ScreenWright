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
        <!-- 折线设置 -->
        <ItemZebraBarAmdLineLineSetting
          :currentIndex="currentIndex"
          useSingleColorPicker
          showTextDynamic
          :showSeriesAreaColor="showSeriesAreaColor"
          :showMarkLineLabelCustom="false"
        />
        <!-- 数据标线 -->
        <template v-if="selectTargetData[0].option.markLineShow">
          <ItemBarmarkLineShow :currentIndex="currentIndex" :showMarkLineLabelCustom="true" :key="currentIndex" />
        </template>
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";

import { isArray } from "lodash-es";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import ItemBarmarkLineShow from "../ItemComponent/ItemBarmarkLineShow/index.vue";
import ItemZebraBarAmdLineLineSetting from "../ItemComponent/ItemZebraBarAmdLineLineSetting/index.vue";

withDefaults(
  defineProps<{
    showSeriesAreaColor: boolean;
  }>(),
  {
    showSeriesAreaColor: true
  }
);
interface seriesTabsNameItem {
  name: string;
  value: string;
}
const { selectTargetData, update } = useUpdateInstance();
const activeTab = ref(selectTargetData.value[0].option.seriesTabsName[0].name);
const currentIndex = computed(() => {
  return selectTargetData.value[0].option.seriesTabsName.findIndex((item: any) => item.name === activeTab.value);
});

const fieldList = ref([
  "dataSeriesName",
  "seriesColor",
  "seriesAreaColor",
  "seriesAreaOpacity",
  "seriesColorpicker",
  "seriesConnectNulls",
  "seriesItemBorderColor",
  "seriesItemBorderWidth",
  "seriesItemColor",
  "seriesLabelColor",
  "seriesLabelFontFamily",
  "seriesLabelFontSize",
  "seriesLabelFontStyle",
  "seriesLabelFontWeight",
  "seriesLabelOffsetX",
  "seriesLabelOffsetY",
  "seriesLabelShow",
  "seriesLineColor",
  "seriesLineOpacity",
  "seriesLineWidth",
  "seriesSmoothShow",
  "seriesName",
  "seriesOpacity",
  "seriesSmooth",
  "seriesSymbol",
  "seriesSymbolHeight",
  "seriesSymbolImage",
  "seriesSymbolShow",
  "seriesSymbolWidth",
  "seriesTabsName",
  "tooltipUnit"
]);
const hanldeAdd = () => {
  const len = selectTargetData.value[0].option.seriesTabsName.length;
  const index = selectTargetData.value[0].option.seriesTabsName.findIndex((item: seriesTabsNameItem) => {
    return item.name === activeTab.value;
  });
  console.log(index, "hanldeAdd");
  fieldList.value.forEach((itemOptionName: string) => {
    if (itemOptionName == "seriesTabsName") {
      selectTargetData.value[0].option[itemOptionName].push({
        name: "系列" + (len + 1),
        value: selectTargetData.value[0].option[itemOptionName][index].value
      });
    } else {
      if (isArray(selectTargetData.value[0].option[itemOptionName])) {
        selectTargetData.value[0].option[itemOptionName].push(selectTargetData.value[0].option[itemOptionName][index]);
      }
    }
  });
  activeTab.value = "系列" + (len + 1);
  update();
};

const handleDel = () => {
  if (selectTargetData.value[0].option.seriesTabsName.length === 1) {
    return;
  }
  const index = selectTargetData.value[0].option.seriesTabsName.findIndex((item: seriesTabsNameItem) => {
    return item.name === activeTab.value;
  });
  fieldList.value.forEach((itemOptionName: string) => {
    if (isArray(selectTargetData.value[0].option[itemOptionName])) {
      selectTargetData.value[0].option[itemOptionName].splice(index, 1);
    }
  });

  selectTargetData.value[0].option.seriesTabsName.forEach((item: seriesTabsNameItem, idx: number) => {
    item.name = "系列" + (idx + 1);
  });

  if (selectTargetData.value[0].option.seriesTabsName.length === 1) {
    activeTab.value =
      selectTargetData.value[0].option.seriesTabsName[selectTargetData.value[0].option.seriesTabsName.length - 1].name;
  }
  if (index === selectTargetData.value[0].option.seriesTabsName.length) {
    activeTab.value = selectTargetData.value[0].option.seriesTabsName[index - 1].name;
  }
  update();
};
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");
</style>
