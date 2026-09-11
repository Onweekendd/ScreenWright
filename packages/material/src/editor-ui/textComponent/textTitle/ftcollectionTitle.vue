<template>
  <el-form-item label="文本样式" label-width="100">
    <configTextStyle v-model="input" @change="handleConfigTextChange" />
  </el-form-item>
  <el-form-item label="偏移" label-width="100">
    <div class="flex flex-center-between">
      <sw-input-number
        v-model="selectTargetData[0].option.textTranslateX"
        unit="px"
        :controls="false"
        bottomLabel="X"
        @change="update"
      />
      <sw-input-number
        v-model="selectTargetData[0].option.textTranslateY"
        unit="px"
        :controls="false"
        bottomLabel="Y"
        @change="update"
      />
    </div>
  </el-form-item>
  <el-form-item label="尺寸" label-width="100">
    <div class="flex">
      <sw-input-number :min="0" bottomLabel="宽" v-model="selectTargetData[0].option.titleWidth" @change="update" />
      <sw-input-number :min="0" bottomLabel="高" v-model="selectTargetData[0].option.titleHeight" @change="update" />
    </div>
  </el-form-item>
  <el-form-item label="背景填充方式" label-width="100">
    <el-select
      v-model="selectTargetData[0].option.titleBackgroundType"
      @change="update"
      popper-class="sw-select-dropdown"
    >
      <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
  <el-form-item :label="selectTargetData[0].option.titleBackgroundType === 'color' ? '颜色' : '图片'" label-width="100">
    <sw-single-color-picker
      field="background"
      v-model="selectTargetData[0].option.titleBackgroundColor"
      v-if="selectTargetData[0].option.titleBackgroundType === 'color'"
    />
    <sw-upload
      v-else
      v-model="selectTargetData[0].option.titleBackgroundImage"
      :multiple="false"
      :showFileList="false"
      @change="update"
    />
  </el-form-item>
</template>
<script setup lang="ts">
import { onMounted } from "vue";

import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import { useUpdateInstance } from "../../useUpdateInstance";
import { backgroundType } from "../textConfig/constants";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs();

onMounted(() => {
  if (selectTargetData.value[0].option.titleBackgroundImage === "none") {
    selectTargetData.value[0].option.titleBackgroundImage = "";
    update();
  }
});
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
