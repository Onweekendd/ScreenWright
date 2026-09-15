<template>
  <el-form-item label="显示个数" label-width="100">
    <sw-input-number v-model.number="selectTargetData[0].option.cardLen" :controls="true" :min="0" />
  </el-form-item>
  <el-form-item label="边距" label-width="100">
    <div class="flex flex-justify-between cardPadding">
      <sw-input-number
        v-for="(item, index) in selectTargetData[0].option.cardPadding"
        :key="index"
        v-model.number="selectTargetData[0].option.cardPadding[index]"
        :bottomLabel="['上', '右', '下', '左'][index]"
        :min="0"
        width="42"
        :controls="false"
        @change="update"
      />
    </div>
  </el-form-item>
  <el-form-item label="资源平铺方式" label-width="100">
    <el-select
      v-model="selectTargetData[0].option.cardObjectFit"
      @change="update"
      popper-class="sw-select-dropdown"
    >
      <el-option v-for="item in objectFit" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
  <el-form-item label="卡片间距" label-width="100">
    <sw-input-number v-model.number="selectTargetData[0].option.cardMarginRight" :controls="true" :min="0" />
  </el-form-item>
  <el-form-item label="背景填充方式" label-width="100">
    <el-select
      v-model="selectTargetData[0].option.cardBackgroundType"
      @change="update"
      popper-class="sw-select-dropdown"
    >
      <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
  <el-form-item :label="selectTargetData[0].option.cardBackgroundType === 'color' ? '颜色' : '图片'" label-width="100">
    <sw-single-color-picker
      field="background"
      v-model="selectTargetData[0].option.cardBackgroundColor"
      v-if="selectTargetData[0].option.cardBackgroundType === 'color'"
    />
    <sw-upload
      v-else
      v-model="selectTargetData[0].option.cardBackgroundImage"
      :multiple="false"
      :showFileList="false"
      @change="update"
      @delete="update"
    />
  </el-form-item>
  <el-form-item label="背景平铺方式" label-width="100">
    <el-select
      v-model="selectTargetData[0].option.cardBgObjectFit"
      @change="update"
      popper-class="sw-select-dropdown"
    >
      <el-option v-for="item in backgroundImageType" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
</template>

<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { useUpdateInstance } from "../../useUpdateInstance";
import { backgroundImageType, backgroundType, objectFit } from "../textConfig/constants";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style scoped lang="scss">
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.cardPadding {
  width: 100%;
}
</style>
