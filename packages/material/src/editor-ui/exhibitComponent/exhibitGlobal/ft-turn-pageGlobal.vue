<template>
  <div class="ft-turn-page-global">
    <el-form-item label="图片列表" :label-width="firstLabelWidth">
      <image-preview-dialog draggable :value="imageList" @update:value="handleImageChange" />
    </el-form-item>
    <el-form-item label="动画时长" :label-width="firstLabelWidth">
      <SwInputNumber v-model="selectTargetData[0].option.duration" @change="update" />
    </el-form-item>
    <el-form-item label="自动播放" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.autoPlay" @change="update" />
    </el-form-item>
    <el-form-item :label-width="firstLabelWidth">
      <template #label>
        <span
          >默认页码
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p>注意:默认页码不可超过图片列表的一半,否则会从第一页开始</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <SwInputNumber v-model="selectTargetData[0].option.defaultPage" :min="1" @change="update" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { SwInputNumber } from "@screenwright/ui";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import imagePreviewDialog from "../components/imagePreviewDialog.vue";
import type { ImageItem } from "../types";

const { selectTargetData, update } = useUpdateInstance();
const imageList = computed(() => {
  if (!selectTargetData.value[0].option.imageList) {
    return [];
  }
  const transformImageList = selectTargetData.value[0].option.imageList.map((v: any, index: number) => {
    const imgSrc = v.img;
    const json = {
      src: imgSrc,
      title: v.text,
      id: index,
      url: imgSrc,
      name: v.name
    };
    return json;
  }) as ImageItem[];
  console.log(transformImageList, "transformImageList");
  return transformImageList;
});
const handleImageChange = (newList: ImageItem[]) => {
  console.log(newList, "newList");
  selectTargetData.value[0].option.imageList = newList.map((v) => {
    return {
      img: v.src,
      text: v.title || v.name,
      name: v.name,
      id: v.id,
      type: "image"
    };
  });
  update();
};
</script>
