<template>
  <div class="photo-sphere-viewer-picture">
    <el-form-item label="启用" :label-width="firstLabelWidth">
      <el-checkbox @change="update" v-model="selectTargetData[0].option.showGallery" disabled />
    </el-form-item>
    <el-form-item label="缩略图" v-if="selectTargetData[0].option.thumbnailSize" :label-width="firstLabelWidth">
      <div class="flex flex-justify-between" style="width: 100%">
        <sw-input-number
          v-model="selectTargetData[0].option.thumbnailSize.width"
          unit="px"
          bottomLabel="宽"
          @change="update"
          width="90"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.thumbnailSize.height"
          unit="px"
          bottomLabel="高"
          @change="update"
          width="90"
        />
      </div>
    </el-form-item>
    <SwCollapseItem
      v-if="selectTargetData[0].option.galleryItems"
      title="图片系列"
      v-model="selectTargetData[0].option.showGallery"
      show-icon
    >
      <template #icon>
        <Icon type="CirclePlus" size="14" @click="handleAdd" />
        <Icon type="Delete" size="14" @click="handleDel" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs
          v-model="seriesTabs"
          :tabs="selectTargetData[0].option.galleryItems.map((sl: any) => sl.name)"
        />
        <div v-for="(item, index) in selectTargetData[0].option.galleryItems" :key="index">
          <template v-if="item.name === seriesTabs">
            <el-form-item label="图片" :label-width="secondLabelWidth">
              <sw-upload
                v-model="selectTargetData[0].option.galleryItems[index].panorama"
                @change="update"
                @delete="update"
              />
            </el-form-item>
            <el-form-item label="缩略图" :label-width="secondLabelWidth">
              <sw-upload
                v-model="selectTargetData[0].option.galleryItems[index].thumbnail"
                @change="update"
                @delete="update"
              />
            </el-form-item>
            <el-form-item label="说明文本" :label-width="secondLabelWidth">
              <sw-input @change="update" v-model="selectTargetData[0].option.galleryItems[index].caption" />
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
import { SwInput } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const seriesTabs = ref("图片1");
console.log(selectTargetData.value[0], "selectTargetData.value[0]");
const handleAdd = () => {
  if (has(selectTargetData.value[0].option, "galleryItems")) {
    const target = selectTargetData.value[0].option.galleryItems.find((it: any) => it.name === seriesTabs.value);
    if (target) {
      const data = JSON.parse(JSON.stringify(target));
      data.name = "图片" + (selectTargetData.value[0].option.galleryItems.length + 1);
      data.id = `${selectTargetData.value[0].option.galleryItems.length + 1}`;
      selectTargetData.value[0].option.galleryItems.push(data);
      seriesTabs.value = data.name;
      update();
    }
  }
};
const handleDel = () => {
  if (
    has(selectTargetData.value[0].option, "galleryItems") &&
    selectTargetData.value[0].option.galleryItems.length > 1
  ) {
    const index = selectTargetData.value[0].option.galleryItems.findIndex((it: any) => it.name === seriesTabs.value);

    if (index === selectTargetData.value[0].option.galleryItems.length - 1) {
      seriesTabs.value = selectTargetData.value[0].option.galleryItems[index - 1].name;
    }

    selectTargetData.value[0].option.galleryItems.splice(index, 1);

    selectTargetData.value[0].option.galleryItems.forEach((item: any, index: number) => {
      item.name = "图片" + (index + 1);
    });

    update();
  }
};
</script>
