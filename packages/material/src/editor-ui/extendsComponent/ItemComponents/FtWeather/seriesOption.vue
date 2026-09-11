<template>
  <div class="ft-weather-series">
    <SwCollapseItem title="数据系列" open>
      <template #icon>
        <Icon type="CirclePlus" style="color: #fff; margin-bottom: 10px; font-size: 15px" @click="handleAddSeries" />
        <Icon type="Delete" style="color: #fff; margin-bottom: 10px; font-size: 15px" @click="handleDeleteSeries" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="tapList" @change="handleChange" />
        <div v-if="currentData !== null">
          <el-form-item label="字段名" :label-width="secondLabelWidth">
            <sw-input v-model="currentData.fieldName" placeholder="对应数据中的Weather数值" @change="update" />
          </el-form-item>
          <el-form-item label="图标" :label-width="secondLabelWidth">
            <sw-upload
              v-model="currentData.icon"
              :multiple="false"
              :showFileList="false"
              :showDel="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>
        </div>
      </template>
    </SwCollapseItem>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { has } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui";
import { SwInput } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "@editor/constants";
import { useUpdateInstance } from "@editor/useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();

const tapList = computed(() => {
  return selectTargetData.value[0].option.seriesTabsList.map((item: any) => item.name);
});

const handleAddSeries = () => {
  if (has(selectTargetData.value[0].option, "seriesTabsList")) {
    const obj = JSON.parse(JSON.stringify(selectTargetData.value[0].option.seriesTabsList[0]));
    obj.name = "系列" + (selectTargetData.value[0].option.seriesTabsList.length + 1);
    obj.content = "";

    selectTargetData.value[0].option.seriesTabsList.push(obj);

    seriesTabs.value = "系列" + selectTargetData.value[0].option.seriesTabsList.length;
    getCurrent();
    update();
  }
};

const handleDeleteSeries = () => {
  if (
    has(selectTargetData.value[0].option, "seriesTabsList") &&
    selectTargetData.value[0].option.seriesTabsList.length > 1
  ) {
    const index = selectTargetData.value[0].option.seriesTabsList.findIndex((it: any) => it.name === seriesTabs.value);
    selectTargetData.value[0].option.seriesTabsList.splice(index, 1);

    selectTargetData.value[0].option.seriesTabsList.forEach((item: any, index: number) => {
      item.name = "系列" + (index + 1);
    });

    // seriesTabs.value = "系列" + selectTargetData.value[0].option.seriesTabsList.length

    if (selectTargetData.value[0].option.seriesTabsList.length === 1) {
      seriesTabs.value =
        selectTargetData.value[0].option.seriesTabsList[
          selectTargetData.value[0].option.seriesTabsList.length - 1
        ].name;
    }
    if (index === selectTargetData.value[0].option.seriesTabsList.length) {
      seriesTabs.value = selectTargetData.value[0].option.seriesTabsList[index - 1].name;
    }

    getCurrent();
    update();
  }
};

const seriesTabs = ref<string>("系列1");
const currentData = ref<any | null>(null);
const getCurrent = () => {
  currentData.value = selectTargetData.value[0].option.seriesTabsList.find((it: any) => it.name === seriesTabs.value);
};

const handleChange = () => {
  getCurrent();
  update();
};

onMounted(() => {
  getCurrent();
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();

.sw-label-type {
  width: 100%;
  :deep(.el-select) {
    margin-right: 5px;
  }
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
  .sw-label-type-number {
    position: relative;
    top: -2px;
  }
}
</style>
