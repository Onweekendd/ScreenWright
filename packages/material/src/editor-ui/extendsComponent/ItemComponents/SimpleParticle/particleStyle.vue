<template>
  <div class="simple-particle-style">
    <SwCollapseItem title="颜色系列" open>
      <template #icon>
        <Icon type="CirclePlus" style="color: #fff; margin-bottom: 10px; font-size: 15px" @click="handleAddSeries" />
        <Icon type="Delete" style="color: #fff; margin-bottom: 10px; font-size: 15px" @click="handleDeleteSeries" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="seriesTabs" :tabs="colorList" @change="handleChange" />
        <div v-if="currentData !== null">
          <el-form-item label="颜色" :label-width="secondLabelWidth">
            <sw-single-color-picker v-model="currentData.color" @change="update" />
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
import { SwSingleColorPicker } from "@screenwright/ui";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "@editor/constants";
import { useUpdateInstance } from "@editor/useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();

const colorList = computed(() => {
  return selectTargetData.value[0].option.colorList.map((item: any) => item.name);
});

const handleAddSeries = () => {
  if (has(selectTargetData.value[0].option, "colorList")) {
    const obj = JSON.parse(JSON.stringify(selectTargetData.value[0].option.colorList[0]));
    obj.name = "颜色" + (selectTargetData.value[0].option.colorList.length + 1);
    obj.content = "";

    selectTargetData.value[0].option.colorList.push(obj);

    seriesTabs.value = "颜色" + selectTargetData.value[0].option.colorList.length;
    getCurrent();
    update();
  }
};

const handleDeleteSeries = () => {
  if (has(selectTargetData.value[0].option, "colorList") && selectTargetData.value[0].option.colorList.length > 1) {
    const index = selectTargetData.value[0].option.colorList.findIndex((it: any) => it.name === seriesTabs.value);
    selectTargetData.value[0].option.colorList.splice(index, 1);

    selectTargetData.value[0].option.colorList.forEach((item: any, index: number) => {
      item.name = "颜色" + (index + 1);
    });

    if (selectTargetData.value[0].option.colorList.length === 1) {
      seriesTabs.value =
        selectTargetData.value[0].option.colorList[selectTargetData.value[0].option.colorList.length - 1].name;
    }
    if (index === selectTargetData.value[0].option.colorList.length) {
      seriesTabs.value = selectTargetData.value[0].option.colorList[index - 1].name;
    }

    getCurrent();
    update();
  }
};

const seriesTabs = ref<string>("颜色1");
const currentData = ref<any | null>(null);
const getCurrent = () => {
  currentData.value = selectTargetData.value[0].option.colorList.find((it: any) => it.name === seriesTabs.value);
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
