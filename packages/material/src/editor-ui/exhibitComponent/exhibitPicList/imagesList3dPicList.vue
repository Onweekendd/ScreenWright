<template>
  <div class="imagesList-3d-global">
    <sw-collapse-item title="图片系列" open>
      <template #icon>
        <Icon type="CirclePlus" style="color: #fff; margin-bottom: 10px; font-size: 15px" @click="handleAddSeries" />
        <Icon type="Delete" style="color: #fff; margin-bottom: 10px; font-size: 15px" @click="handleDeleteSeries" />
      </template>
      <template #content v-if="tapList.length > 0">
        <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="tapList" @change="handleChange" />
        <SwCoordinateTabs v-model="placardType" :option="coordinateOption" />
        <template v-if="currentData !== null">
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <sw-upload
              v-model="currentData[placardType].imageSrc"
              :multiple="false"
              :showFileList="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>
          <el-form-item label="缩放" :label-width="secondLabelWidth" v-if="placardType === 'activeObj'">
            <sw-input-number
              v-model="selectTargetData[0].option[placardType].scaleZoom"
              :controls="false"
              :min="0"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="标题" :label-width="secondLabelWidth" v-if="placardType === 'defaultObj'">
            <sw-input v-model="currentData[placardType].title" @change="update" />
          </el-form-item>
          <el-form-item label="内容" :label-width="secondLabelWidth" v-if="placardType === 'defaultObj'">
            <sw-input v-model="currentData[placardType].content" @change="update" />
          </el-form-item>
          <el-form-item label="ID" :label-width="secondLabelWidth">
            <sw-input v-model="currentData.id" :disabled="true" />
          </el-form-item>
        </template>
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { cloneDeep, has } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui";
import { SwCoordinateTabs } from "@screenwright/ui";
import { SwInput } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const placardType = ref("defaultObj");
const coordinateOption = ref([
  {
    label: "默认",
    value: "defaultObj"
  },
  {
    label: "选中",
    value: "activeObj"
  }
]);

const tapList = computed(() => {
  return selectTargetData.value[0].option.seriesTabsList.map((item: any) => item.name);
});

const handleAddSeries = () => {
  if (has(selectTargetData.value[0].option, "seriesTabsList")) {
    const targetData = cloneDeep(selectTargetData.value[0].option.seriesTabsList[0]);
    targetData.id = `${selectTargetData.value[0].option.seriesTabsList.length + 1}`;
    targetData.name = "图片" + `${targetData.id}`;

    selectTargetData.value[0].option.seriesTabsList.push(targetData);

    seriesTabs.value = "图片" + selectTargetData.value[0].option.seriesTabsList.length;
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
      item.name = "图片" + (index + 1);
      item.id = `${index + 1}`;
    });

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

const seriesTabs = ref<string>("图片1");

const currentData = ref<any | null>(null);
const getCurrent = () => {
  currentData.value = selectTargetData.value[0].option.seriesTabsList.find((it: any) => it.name === seriesTabs.value);
};

const handleChange = () => {
  getCurrent();
};

onMounted(() => {
  getCurrent();
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
.imagesList-3d-global {
  color: azure;
}
</style>
