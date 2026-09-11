<template>
  <div class="ft-filter-global">
    <el-form-item label="形状" :label-width="firstLabelWidth">
      <el-select
        @change="handleShapeChange"
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.shape"
      >
        <el-option
          v-for="item in selectTargetData[0].option.shapeOption"
          :key="item.value"
          :label="item.name"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="圆角" :label-width="firstLabelWidth" v-if="selectTargetData[0].option.shape === 'rectangle'">
      <SwInputNumber v-model="selectTargetData[0].option.borderRadius" :min="0" @change="update" unit="px" />
    </el-form-item>
    <el-form-item label="svg文件" :label-width="firstLabelWidth" v-if="selectTargetData[0].option.shape === 'custom'">
      <SwUpload
        :accept="'.svg'"
        v-model="selectTargetData[0].option.svgUrl"
        @change="handleSvgChange"
        @delete="handleDeleteSvg"
      />
    </el-form-item>
  </div>
</template>
<script lang="ts" setup>
import { SwInputNumber } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import { setMinioUrl } from "@screenwright/composables";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const getSvgPath = async (url: string) => {
  let result = "";
  const svgUrl = setMinioUrl(url);
  const str = await fetch(svgUrl).then((response) => response.text());
  const parser = new DOMParser();
  const doc = parser.parseFromString(str, "image/svg+xml");
  const paths = doc.querySelectorAll("path");
  paths.forEach((path) => {
    result = path.getAttribute("d") as string;
  });
  return result;
};
const handleShapeChange = async () => {
  if (selectTargetData.value[0].option.shape === "custom") {
    const result = await getSvgPath(selectTargetData.value[0].option.svgUrl);
    selectTargetData.value[0].option.path = result || "";
  }

  update();
};
const handleDeleteSvg = () => {
  selectTargetData.value[0].option.svgUrl = "";
  selectTargetData.value[0].option.path = "";
  update();
};
const handleSvgChange = async () => {
  const result = await getSvgPath(selectTargetData.value[0].option.svgUrl);
  selectTargetData.value[0].option.path = result || "";
  update();
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
