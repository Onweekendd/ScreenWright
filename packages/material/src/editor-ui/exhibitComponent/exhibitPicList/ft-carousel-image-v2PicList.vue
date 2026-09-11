<template>
  <div class="ft-carousel-image-v2-picList" v-if="selectTargetData[0].option.imageList">
    <SwCollapseItem title="图片系列" open>
      <template #icon>
        <Icon type="CirclePlus" size="14" @click="handleAddSeries" />
        <Icon type="Delete" size="14" @click="handleDeleteSeries" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs
          v-model="seriesTabs"
          :tabs="selectTargetData[0].option.imageList.map((sl: any) => sl.name)"
        />
        <div v-for="(item, index) in selectTargetData[0].option.imageList" :key="index">
          <template v-if="selectTargetData[0].option.imageList[index].name === seriesTabs">
            <el-form-item :label-width="secondLabelWidth" label="图片">
              <SwUpload v-model="selectTargetData[0].option.imageList[index].src" @change="update" @delete="update" />
            </el-form-item>
          </template>
        </div>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { has } from "lodash-es";

import { ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const seriesTabs = ref("图片1");

const handleAddSeries = () => {
  if (has(selectTargetData.value[0].option, "imageList")) {
    const target = selectTargetData.value[0].option.imageList.find((it: any) => it.name === seriesTabs.value);
    if (target) {
      const data = JSON.parse(JSON.stringify(target));
      console.log(data, "data");
      data.name = "图片" + (selectTargetData.value[0].option.imageList.length + 1);
      data.id = `${selectTargetData.value[0].option.imageList.length + 1}`;
      selectTargetData.value[0].option.imageList.push(data);
      seriesTabs.value = data.name;
      update();
    }
  }
};

const handleDeleteSeries = () => {
  if (has(selectTargetData.value[0].option, "imageList") && selectTargetData.value[0].option.imageList.length > 1) {
    const index = selectTargetData.value[0].option.imageList.findIndex((it: any) => it.name === seriesTabs.value);

    if (index === selectTargetData.value[0].option.imageList.length - 1) {
      seriesTabs.value = selectTargetData.value[0].option.imageList[index - 1].name;
    }

    selectTargetData.value[0].option.imageList.splice(index, 1);

    selectTargetData.value[0].option.imageList.forEach((item: any, index: number) => {
      item.name = "图片" + (index + 1);
    });

    update();
  }
};
</script>
