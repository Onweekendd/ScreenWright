<template>
  <sw-collapse-item title="行" type="dataSeries" open :isSeriesTabs="true">
    <template #icon>
      <Icon type="CirclePlus" @click="handleAdd" size="14" />
      <Icon type="Delete" @click="handleDel" size="14" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs v-model="seriesXTabs" :tabs="selectTargetData[0].option.seriesXTabsName" />
      <div v-for="(item, index) in selectTargetData[0].option.seriesXTabsName" :key="index">
        <div v-if="selectTargetData[0].option.seriesXTabsName[index] === seriesXTabs">
          <sw-collapse-item title="背景" open>
            <template #content>
              <el-form-item label="填充方式" label-width="38px">
                <el-select
                  v-model="selectTargetData[0].option.seriesXbackgroundType[index]"
                  popper-class="sw-select-dropdown"
                  @change="update"
                  style="margin-left: 10px"
                >
                  <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item
                label="颜色"
                label-width="48px"
                v-if="selectTargetData[0].option.seriesXbackgroundType[index] === 'color'"
              >
                <sw-single-color-picker
                  field="seriesXTableBackground"
                  v-model="selectTargetData[0].option.seriesXBackground[index]"
                  @change="update"
                />
              </el-form-item>
              <el-form-item
                label="图片"
                label-width="48px"
                v-if="selectTargetData[0].option.seriesXbackgroundType[index] === 'custom'"
              >
                <sw-upload
                  v-model="selectTargetData[0].option.seriesXbackgroundImage[index]"
                  :multiple="false"
                  :showFileList="false"
                  @change="update"
                  @delete="update"
                />
              </el-form-item>
            </template>
          </sw-collapse-item>
          <el-form-item label="描边" label-width="73px">
            <sw-single-color-picker
              field="seriesXTableBorderColor"
              v-model="selectTargetData[0].option.seriesXBorderColor[index]"
              @change="update"
            />
          </el-form-item>
          <el-form-item label-width="73">
            <sw-input-number
              v-model="selectTargetData[0].option.seriesXBorderWidth[index]"
              unit="px"
              bottomLabel="粗细"
              :controls="false"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="圆角" label-width="73">
            <sw-slider v-model="selectTargetData[0].option.seriesXRadius[index]" unit="%" @change="update" />
          </el-form-item>
          <el-form-item label="偏移量" label-width="73">
            <sw-input-number
              v-model="selectTargetData[0].option.seriesXOffsetX[index]"
              unit="px"
              :controls="false"
              @change="update"
            />
          </el-form-item>
        </div>
      </div>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import { cloneDeep, isArray, isPlainObject } from "lodash-es";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import { backgroundType } from "../../constants";

// seriesXTabsName
const { selectTargetData, update } = useUpdateInstance();
const seriesXTabs = ref("行1");
const list = [
  "seriesXBackground",
  "seriesXbackgroundType",
  "seriesXbackgroundImage",
  "seriesXBorderColor",
  "seriesXBorderWidth",
  "seriesXRadius",
  "seriesXOffsetX"
];
const handleAdd = () => {
  const index = selectTargetData.value[0].option.seriesXTabsName.findIndex((item: string) => {
    return item === seriesXTabs.value;
  });

  const lastName = `行${selectTargetData.value[0].option.seriesXTabsName.length + 1}`;

  for (let i = 0; i < list.length; i++) {
    const itemOptionName = list[i];
    const cpOption = selectTargetData.value[0].option[itemOptionName][index];
    if (isPlainObject(cpOption) || isArray(cpOption)) {
      selectTargetData.value[0].option[itemOptionName].push(cloneDeep(cpOption));
    } else {
      selectTargetData.value[0].option[itemOptionName].push(cpOption);
    }
  }

  selectTargetData.value[0].option.seriesXTabsName.push(lastName);

  seriesXTabs.value = lastName;

  update();
};
const handleDel = () => {
  if (selectTargetData.value[0].option.seriesXTabsName.length > 1) {
    const index = selectTargetData.value[0].option.seriesXTabsName.findIndex((item: string) => {
      return item === seriesXTabs.value;
    });
    if (index === -1) return;
    if (index === selectTargetData.value[0].option.seriesXTabsName.length - 1) {
      seriesXTabs.value = selectTargetData.value[0].option.seriesXTabsName[index - 1];
    }

    selectTargetData.value[0].option.seriesXTabsName.splice(index, 1);
    for (let i = 0; i < list.length; i++) {
      const itemOptionName = list[i];
      selectTargetData.value[0].option[itemOptionName].splice(index, 1);
    }
    for (let i = 0; i < selectTargetData.value[0].option.seriesXTabsName.length; i++) {
      selectTargetData.value[0].option.seriesXTabsName[i] = `行${i + 1}`;
    }
    if (selectTargetData.value[0].option.seriesXTabsName.length === 1) {
      seriesXTabs.value = selectTargetData.value[0].option.seriesXTabsName[0];
    }
    update();
  }
};

watch(
  () => selectTargetData.value[0],
  (newVal, oldVal) => {
    if (
      (newVal?.id == oldVal?.id || oldVal == null) &&
      newVal?.option.seriesXTabsName.length != oldVal?.option.seriesXTabsName.length
    ) {
      seriesXTabs.value = newVal.option.seriesXTabsName[0];
    }
  },
  { immediate: true }
);
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
}
</style>
