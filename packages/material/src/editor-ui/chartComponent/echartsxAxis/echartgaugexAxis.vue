<template>
  <div class="echartgaugexAxis">
    <el-form-item label="宽度" :label-width="firstLabelWidth">
      <sw-slider @change="update" v-model="selectTargetData[0].option.axisLineWidth" />
    </el-form-item>
    <SwCollapseItem title="数值区间" open>
      <template #icon>
        <Icon type="CirclePlus" size="14" @click="handleAdd" />
        <Icon type="Delete" size="14" @click="handleDelete" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="axisLineTabs" :tabs="selectTargetData[0].option.axisLineTabsName" />
        <div v-for="(item, index) in selectTargetData[0].option.axisLineTabsName" :key="index">
          <template v-if="item === axisLineTabs">
            <el-form-item label="范围" :label-width="secondLabelWidth">
              <sw-slider
                v-model="selectTargetData[0].option.axisLineScope[index]"
                :max="1"
                :min="0"
                :step="0.01"
                @change="update"
              />
            </el-form-item>
            <el-form-item label="颜色" :label-width="secondLabelWidth">
              <sw-single-color-picker v-model="selectTargetData[0].option.axisLineColor[index]" @change="update" />
            </el-form-item>
          </template>
        </div>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const axisLineTabs = ref(selectTargetData.value[0].option.axisLineTabsName[0]);
const handleAdd = () => {
  const target = selectTargetData.value[0].option.axisLineTabsName.find((item: any) => item === axisLineTabs.value);
  const targetIndex = selectTargetData.value[0].option.axisLineTabsName.findIndex(
    (item: any) => item === axisLineTabs.value
  );
  if (target) {
    const axisLineTabsName = `区间${selectTargetData.value[0].option.axisLineTabsName.length + 1}`;
    const targetNumber = selectTargetData.value[0].option.axisLineScope[targetIndex];
    selectTargetData.value[0].option.axisLineTabsName.push(axisLineTabsName);
    axisLineTabs.value = axisLineTabsName;
    const targetColor = selectTargetData.value[0].option.axisLineColor[targetIndex];
    selectTargetData.value[0].option.axisLineColor.push(targetColor || "#000000");
    selectTargetData.value[0].option.axisLineScope.push(targetNumber || 0);
    update();
  }
};
const handleDelete = () => {
  if (selectTargetData.value[0].option.axisLineTabsName.length <= 1) {
    return;
  }
  const index = selectTargetData.value[0].option.axisLineTabsName.indexOf(axisLineTabs.value);
  if (index > -1) {
    selectTargetData.value[0].option.axisLineTabsName.splice(index, 1);
    selectTargetData.value[0].option.axisLineColor.splice(index, 1);
    selectTargetData.value[0].option.axisLineScope.splice(index, 1);
    selectTargetData.value[0].option.axisLineColor.forEach((_item: string, idx: number) => {
      selectTargetData.value[0].option.axisLineTabsName[idx] = `区间${idx + 1}`;
    });
    if (selectTargetData.value[0].option.axisLineTabsName.length === 1) {
      axisLineTabs.value =
        selectTargetData.value[0].option.axisLineTabsName[selectTargetData.value[0].option.axisLineTabsName.length - 1];
    }
    if (index === selectTargetData.value[0].option.axisLineTabsName.length) {
      axisLineTabs.value = selectTargetData.value[0].option.axisLineTabsName[index - 1];
    }
    update();
  }
};

onMounted(() => {
  if (selectTargetData.value && selectTargetData.value[0].option.axisLineTabsName.length > 0) {
    axisLineTabs.value = selectTargetData.value[0].option.axisLineTabsName[0];
  }
});
</script>
