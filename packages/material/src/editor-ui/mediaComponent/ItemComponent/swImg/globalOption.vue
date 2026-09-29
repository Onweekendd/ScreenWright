<template>
  <StatusSelector label="图片上传" :label-width="firstLabelWidth" :properties="['image']">
    <sw-upload v-model="imgValue" :multiple="false" :showFileList="false" @change="onFileChange" />
  </StatusSelector>

  <el-form-item label="鼠标事件" :label-width="firstLabelWidth">
    <el-checkbox v-model="selectTargetData[0].option.pointerEvents" @change="update" />
  </el-form-item>

  <el-form-item label="填充方式" :label-width="firstLabelWidth">
    <el-select popper-class="sw-select-dropdown" v-model="selectTargetData[0].option.objectFit" @change="update">
      <el-option v-for="item in objectFitOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>

  <StatusSelector label="透明度" :label-width="firstLabelWidth" :properties="['opacity']">
    <SwSlider v-model="selectTargetData[0].option.opacity" :max="1" :step="0.1" @change="update" />
  </StatusSelector>

  <el-form-item label="圆角" :label-width="firstLabelWidth">
    <sw-input-number v-model="selectTargetData[0].option.borderRadius" unit="px" :min="0" @change="update" />
  </el-form-item>

  <el-form-item label="混合模式" :label-width="firstLabelWidth">
    <el-select popper-class="sw-select-dropdown" v-model="selectTargetData[0].option.mixBlendMode" @change="update">
      <el-option v-for="item in mixBlendMode" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>

  <el-form-item label="背景" :label-width="firstLabelWidth">
    <sw-single-color-picker v-model="selectTargetData[0].option.background" colorTypeOption="linear-gradient" @change="update" />
  </el-form-item>

  <el-form-item label="变换" :label-width="firstLabelWidth">
    <sw-input v-model="selectTargetData[0].option.transform" placeholder="CSS transform" @change="update" />
  </el-form-item>

  <el-form-item label="切换过渡" :label-width="firstLabelWidth">
    <sw-input v-model="selectTargetData[0].option.transition" placeholder="如 opacity 300ms" @change="update" />
  </el-form-item>
</template>

<script setup lang="ts">
import { computed, toRaw } from "vue";

import type { ComponentMinioAsset, MenuItemForRender } from "@screenwright/types";
import { isPlainObject } from "lodash-es";

import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";
import type { SwUploadChangePayload } from "@editor/base/SwUpload/SwUpload";
import SwUpload from "@editor/base/SwUpload/index.vue";
import StatusSelector from "../../../attrsRender/components/statusAnimation/components/StatusSelector.vue";

import { firstLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import { mixBlendMode } from "../dict";

const { update, selectTargetData } = useUpdateInstance();

const objectFitOptions = [
  { label: "填充", value: "fill" },
  { label: "保持宽高比", value: "contain" },
  { label: "裁切", value: "cover" }
];

const imgValue = computed({
  get() {
    const data = selectTargetData.value[0].data;
    if (Array.isArray(data)) {
      return data[0] ? data[0].value : "";
    } else if (isPlainObject(data)) {
      return data.value;
    } else {
      return data;
    }
  },
  set(newValue) {
    const data = selectTargetData.value[0].data;
    if (Array.isArray(data)) {
      selectTargetData.value[0].data = [{ ...data[0], value: newValue }];
    } else if (isPlainObject(data)) {
      data.value = newValue;
    } else {
      selectTargetData.value[0].data = newValue;
    }
  }
});

/**
 * 文件上传完成 处理是资源从资产库获取的情况
 * @param value 文件信息
 */
const onFileChange = (value: SwUploadChangePayload | MenuItemForRender) => {
  selectTargetData.value[0].minioArr = [...(selectTargetData.value[0].minioArr || []), toRaw({ ...value })] as unknown as ComponentMinioAsset[];
  update();
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 28px;
}
</style>
