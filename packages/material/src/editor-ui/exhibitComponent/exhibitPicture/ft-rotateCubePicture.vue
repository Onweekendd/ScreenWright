<template>
  <div class="ft-rotate-cube-picture">
    <SwCoordinateTabs v-model="placardIndex" :option="coordinateOption" />
    <el-form-item label="图片" :label-width="firstLabelWidth">
      <sw-upload
        v-model="selectTargetData[0].option.faceImages[index].src"
        :multiple="false"
        :showFileList="false"
        @change="update"
        @delete="update"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { cloneDeep } from "lodash-es";

import { SwCoordinateTabs } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

interface FaceImage {
  src: string;
  title: string;
}

const placardIndex = ref("0");
const coordinateOption = ref([]);
const index = computed(() => Number(placardIndex.value));

const { selectTargetData, update } = useUpdateInstance();

const getCoordinateOption = () => {
  const face = cloneDeep(selectTargetData.value[0].option.faceImages);
  coordinateOption.value = face.map((item: FaceImage, index: number) => {
    return {
      label: item.title,
      value: String(index)
    };
  });
};

onMounted(() => {
  getCoordinateOption();
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
