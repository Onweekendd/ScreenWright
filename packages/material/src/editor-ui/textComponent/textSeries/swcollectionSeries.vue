<template>
  <div class="ft-collection-series">
    <sw-collapse-item title="数据系列" open>
      <template #icon>
        <Icon type="CirclePlus" @click="addSeries" />
        <Icon type="Delete" @click="deleteSeries" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="seriesTabsName" />
        <div v-for="(item, index) in seriesTabsName" :key="index">
          <div v-if="item === seriesTabs">
            <el-form-item label="资源" label-width="73">
              <sw-upload
                v-model="selectTargetData[0].data[index].src"
                :fileType="FileType.imgAndVideo"
                :multiple="false"
                :showFileList="false"
                @change="update"
                @delete="update"
              />
            </el-form-item>
          </div>
        </div>
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";

import { cloneDeep } from "lodash-es";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { FileType } from "@editor/base/SwUpload/SwUpload";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const seriesTabsName = computed(() => {
  if (!selectTargetData.value || !selectTargetData.value[0] || !selectTargetData.value[0].data) {
    return [];
  }
  return selectTargetData.value[0].data.map((st: any, index: number) => {
    return `系列${index + 1}`;
  });
});
const seriesTabs = ref("系列1");
const addSeries = () => {
  changeSeriesData("add");
};
const deleteSeries = () => {
  changeSeriesData("delete");
};
const changeSeriesData = (val: string) => {
  const index = seriesTabsName.value.findIndex((it: string) => it == seriesTabs.value);
  const len = seriesTabsName.value.length;
  if (val == "add") {
    const last = selectTargetData.value[0].data[index];
    selectTargetData.value[0].data.push(cloneDeep(last));
    seriesTabs.value = seriesTabsName.value[seriesTabsName.value.length - 1];
  } else if (val == "delete" && len > 1) {
    selectTargetData.value[0].data.splice(index, 1);
    if (index == len - 1) seriesTabs.value = seriesTabsName.value[seriesTabsName.value.length - 1];
  }
  update();
};
</script>
