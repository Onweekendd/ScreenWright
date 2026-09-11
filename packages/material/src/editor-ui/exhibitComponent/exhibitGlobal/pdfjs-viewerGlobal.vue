<template>
  <div class="pdfjs-viewer-global">
    <div class="flex flex-center-between">
      <el-form-item label="加载全部" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.showAll" @change="update" />
      </el-form-item>
      <el-form-item label="显示控件" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.showPage" @change="update" />
      </el-form-item>
    </div>
    <el-form-item label="控件文本" :label-width="firstLabelWidth">
      <configTextStyle v-model="FontInput" @change="handleInputChange" />
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
    <el-form-item label="当前页" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.current"
        unit="页"
        :controls="false"
        :min="1"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="背景色" :label-width="firstLabelWidth">
      <sw-single-color-picker
        field="backgroundColor"
        v-model="selectTargetData[0].option.backgroundColor"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="PDF文件" :label-width="firstLabelWidth">
      <sw-upload
        v-model="selectTargetData[0].option.pdfUrl"
        :multiple="false"
        :showFileList="false"
        :fileType="FileType.file"
        :selectAssets="false"
        @change="update"
        @delete="update"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui";
import { SwSingleColorPicker } from "@screenwright/ui";
import { FileType } from "@editor/base/SwUpload/SwUpload";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const { input: FontInput, handleConfigTextChange: handleInputChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor"
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
