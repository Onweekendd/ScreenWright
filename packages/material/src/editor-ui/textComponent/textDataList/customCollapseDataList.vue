<template>
  <div class="custom-collapse-data-list">
    <sw-collapse-item title="数据内容" open>
      <template #icon>
        <Icon type="CirclePlus" size="20" @click="addSeries" />
        <Icon type="Delete" size="20" @click="deleteSeries" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs
          v-model="seriesTabs"
          :tabs="selectTargetData[0].option.seriesTabsList.map((st: any) => st.name)"
        />
        <div v-for="(item, index) in selectTargetData[0].option.seriesTabsList" :key="index">
          <template v-if="selectTargetData[0].option.seriesTabsList[index].name === seriesTabs">
            <el-form-item label="标题" label-width="73">
              <sw-input v-model="selectTargetData[0].option.seriesTabsList[index].title" @change="update" />
            </el-form-item>
            <el-form-item label="数据类型" label-width="73">
              <el-select
                v-model="selectTargetData[0].option.seriesTabsList[index].type"
                popper-class="sw-select-dropdown"
                @change="update"
              >
                <el-option v-for="item in contentOption" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item
              label="填充类型"
              label-width="73"
              v-if="selectTargetData[0].option.seriesTabsList[index].type !== 'text'"
            >
              <el-select
                v-model="selectTargetData[0].option.seriesTabsList[index].imageSize"
                popper-class="sw-select-dropdown"
                @change="update"
              >
                <el-option v-for="item in objectFit" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item
              label="图片"
              label-width="73"
              v-if="selectTargetData[0].option.seriesTabsList[index].type === 'image'"
            >
              <sw-upload
                v-model="selectTargetData[0].option.seriesTabsList[index].value"
                :multiple="false"
                :showFileList="false"
                :fileType="FileType.img"
                @change="update"
                @delete="update"
              />
            </el-form-item>
            <el-form-item
              label="视频"
              label-width="73"
              v-if="selectTargetData[0].option.seriesTabsList[index].type === 'video'"
            >
              <sw-upload
                v-model="selectTargetData[0].option.seriesTabsList[index].value"
                :multiple="false"
                :notImg="true"
                :fileType="FileType.video"
                :showFileList="false"
                @change="update"
                @delete="update"
              />
            </el-form-item>
            <el-form-item
              label="内容"
              label-width="73"
              v-if="selectTargetData[0].option.seriesTabsList[index].type === 'text'"
            >
              <sw-input
                v-model="selectTargetData[0].option.seriesTabsList[index].value"
                type="textarea"
                :minRows="1"
                :maxRow="5"
                resize="none"
                @change="update"
              />
            </el-form-item>
          </template>
        </div>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { cloneDeep } from "lodash-es";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { FileType } from "@editor/base/SwUpload/SwUpload";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";
import { contentOption, objectFit } from "../textConfig/constants";

interface seriesItem {
  imageSize: string;
  name: string;
  title: string;
  type: string;
  value: string;
}
const { selectTargetData, update } = useUpdateInstance();
const seriesTabs = ref("系列1");
const addSeries = () => {
  const index = selectTargetData.value[0].option.seriesTabsList.findIndex(
    (item: seriesItem) => item.name === seriesTabs.value
  );
  const itemObj = cloneDeep(selectTargetData.value[0].option.seriesTabsList[index]);
  itemObj.name = "系列" + (selectTargetData.value[0].option.seriesTabsList.length + 1);
  selectTargetData.value[0].option.seriesTabsList.push(itemObj);
  seriesTabs.value = itemObj.name;
  update();
  console.log(itemObj);
};
const deleteSeries = () => {
  const index = selectTargetData.value[0].option.seriesTabsList.findIndex(
    (item: seriesItem) => item.name === seriesTabs.value
  );
  selectTargetData.value[0].option.seriesTabsList.splice(index, 1);
  selectTargetData.value[0].option.seriesTabsList.forEach((item: seriesItem, index: number) => {
    item.name = "系列" + (index + 1);
  });

  seriesTabs.value = "系列" + selectTargetData.value[0].option.seriesTabsList.length;
  update();
};
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

:deep(.el-textarea__inner) {
  background-color: #1a1e27 !important;
  border-radius: 4px;
  border: 1px solid #333543 !important;
}
</style>
