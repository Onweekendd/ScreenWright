<template>
  <el-form-item label="系列样式优先" :label-width="firstLabelWidth">
    <el-checkbox v-model="selectTargetData[0].option.isSeriesFirst" @change="update" />
  </el-form-item>
  <SwCollapseItem title="数据系列" open>
    <template #icon>
      <Icon type="CirclePlus" size="14" @click="addSeries" />
      <Icon type="Delete" size="14" @click="deleteSeries" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs
        v-if="selectTargetData[0].option.seriesTabsList && selectTargetData[0].option.seriesTabsList.length > 0"
        v-model="seriesTabs"
        :tabs="selectTargetData[0].option.seriesTabsList.map((st: any) => st.name)"
        @change="handleSeriesTabs"
      />
      <SwCoordinateTabs v-model="tabsActive" :option="coordinate" />
      <seriesTextShadow
        v-if="selectTargetData[0].option.seriesTabsList && selectTargetData[0].option.seriesTabsList.length > 0"
        :attrs="tabsActive"
        :index="currentIndex"
      />
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { cloneDeep, hasIn } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui";
import { SwCoordinateTabs } from "@screenwright/ui";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import seriesTextShadow from "./seriesTextShadow.vue";

const { selectTargetData, update } = useUpdateInstance();
const seriesTabs = ref("系列1");
const tabsActive = ref("defaultObj");
const currentIndex = ref(0);

const coordinateOption = ref([
  {
    label: "默认",
    value: "defaultObj"
  },
  {
    label: "悬停",
    value: "hoverObj"
  },
  {
    label: "选中",
    value: "activeObj"
  }
]);
// filter((it:any) => it !== '悬停'
const coordinate = computed(() => {
  return selectTargetData.value[0].option.isHovered
    ? coordinateOption.value
    : coordinateOption.value.filter((it) => it.label !== "悬停");
});
const handleSeriesTabs = (val: string | number) => {
  console.log("handleSeriesTabs", val);
  currentIndex.value = selectTargetData.value[0].option.seriesTabsList.findIndex((item: any) => item.name === val);
  tabsActive.value = "defaultObj";
};

const addSeries = () => {
  const target = cloneDeep(selectTargetData.value[0].option.seriesTabsList[currentIndex.value]);
  target.name = `系列${selectTargetData.value[0].option.seriesTabsList.length + 1}`;
  selectTargetData.value[0].option.seriesTabsList.push(target);
  seriesTabs.value = target.name;
  currentIndex.value = selectTargetData.value[0].option.seriesTabsList.length - 1;
  tabsActive.value = "defaultObj";
  update();
};
const deleteSeries = () => {
  if (selectTargetData.value[0].option.seriesTabsList.length <= 1) {
    return;
  }
  selectTargetData.value[0].option.seriesTabsList.splice(currentIndex.value, 1);
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
  seriesTabs.value = selectTargetData.value[0].option.seriesTabsList[currentIndex.value].name;
  tabsActive.value = "defaultObj";
  update();
};
onMounted(() => {
  if (!selectTargetData.value[0] || selectTargetData.value.length === 0) {
    return;
  }
  if (!hasIn(selectTargetData.value[0].option, "seriesTabsList")) {
    const activeDFObj = {
      textTranslateX: 0,
      textTranslateY: 0,
      isBorder: true,
      borderWidth: 2,
      borderColor: "rgba(138, 86, 232, 0.9)",
      backgroundColor: "rgba(139, 88, 231, 0.6)",
      backgroundImage: "",
      backgroundImageType: "100% 100%",
      backgroundType: "color",
      fontSize: 16,
      fontWeight: false,
      fontStyle: false,
      fontFamily: "sans-serif",
      fontColor: "rgba(255, 255, 255, 1)",
      isTextShadow: false,
      textShadow: {
        x: 0,
        y: 0,
        blur: 0,
        color: "rgba(255, 255, 255, 1)",
        extend: 0
      }
    };
    selectTargetData.value[0].option.seriesTabsList = [{}, {}, {}];
    const len = selectTargetData.value[0].option.seriesTabsList.length;
    for (let i = 0; i < len; i++) {
      selectTargetData.value[0].option.seriesTabsList[i] = {
        activeObj: {
          ...activeDFObj
        },
        defaultObj: {
          ...activeDFObj,
          borderColor: "rgba(160,169,184,0.30)",
          backgroundColor: "rgba(15,22,34,0.60)"
        },
        hoverObj: {
          ...activeDFObj
        },
        name: `系列${i + 1}`
      };
    }
  }
});
</script>
