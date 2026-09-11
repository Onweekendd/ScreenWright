<template>
  <div class="rank-progressSeries">
    <SwCollapseItem title="数据节点" open>
      <template #icon>
        <Icon type="CirclePlus" size="14" @click="handleAdd" />
        <Icon type="Delete" size="14" @click="handleDel" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs
          v-model="seriesName"
          :tabs="selectTargetData[0].option.seriesTabs.map((item: any) => item.tabName)"
        />
        <div v-for="(item, index) in selectTargetData[0].option.seriesTabs" :key="index">
          <div v-if="item.tabName === seriesName">
            <el-form-item label="名称" :label-width="secondLabelWidth">
              <sw-input v-model="item.name" @change="update" />
            </el-form-item>
            <el-form-item label="颜色" :label-width="secondLabelWidth">
              <sw-single-color-picker @change="update" v-model="item.color" />
            </el-form-item>
          </div>
        </div>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";

import { cloneDeep } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const seriesName = ref(selectTargetData.value[0].option.seriesTabs[0].tabName);
const handleAdd = () => {
  const target = selectTargetData.value[0].option.seriesTabs.find((item: any) => item.tabName === seriesName.value);
  if (target) {
    const data = cloneDeep(target);
    data.tabName = `排名${selectTargetData.value[0].option.seriesTabs.length + 1}`;
    data.name = target.name || `排名${selectTargetData.value[0].option.seriesTabs.length + 1}`;
    seriesName.value = data.tabName;
    selectTargetData.value[0].option.seriesTabs.push(data);
    update();
  }
};
const handleDel = () => {
  if (selectTargetData.value[0].option.seriesTabs.length <= 1) {
    return;
  }
  const index = selectTargetData.value[0].option.seriesTabs.findIndex((item: any) => item.tabName === seriesName.value);
  if (index !== -1) {
    selectTargetData.value[0].option.seriesTabs.splice(index, 1);
    selectTargetData.value[0].option.seriesTabs.forEach((item: any, index: number) => {
      item.tabName = "排名" + (index + 1);
    });
    if (selectTargetData.value[0].option.seriesTabs.length === 1) {
      seriesName.value =
        selectTargetData.value[0].option.seriesTabs[selectTargetData.value[0].option.seriesTabs.length - 1].tabName;
    }
    if (index === selectTargetData.value[0].option.seriesTabs.length) {
      seriesName.value = selectTargetData.value[0].option.seriesTabs[index - 1].tabName;
    }
    update();
  }
};

onMounted(() => {
  if (selectTargetData.value[0].option.seriesTabs.length > 0) {
    seriesName.value = selectTargetData.value[0].option.seriesTabs[0].tabName;
  }
});
</script>
