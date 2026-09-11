<template>
  <div class="iot-mutual-global">
    <sw-collapse-item title="字体配置">
      <template #content>
        <el-form-item label="字体" :label-width="secondLabelWidth">
          <configTextStyle :isShowFontStyle="false" v-model="fontInput" @change="fontChange" />
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="selectTargetData[0].option.textTranslateX"
              unit="px"
              bottomLabel="X"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.textTranslateY"
              unit="px"
              bottomLabel="Y"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="背景" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.bgImage"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item label="悬浮指针" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.isCursorPointer" @change="update" />
        </el-form-item>
        <el-form-item label="点击效果" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.isClickBubble" @change="update" />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="悬停配置">
      <template #content>
        <el-form-item label="启用" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.isHovered" @change="update" />
        </el-form-item>
        <el-form-item label="字体" :label-width="secondLabelWidth">
          <configTextStyle :isShowFontStyle="false" v-model="hoverFontInput" @change="hoverFontChange" />
        </el-form-item>
        <el-form-item label="背景" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.hoverBgImage"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const { input: fontInput, handleConfigTextChange: fontChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor"
});

const { input: hoverFontInput, handleConfigTextChange: hoverFontChange } = useFontStyleAttrs({
  fontFamily: "hoverFontFamily",
  fontStyle: "hoverFontStyle",
  fontWeight: "hoverFontWeight",
  fontSize: "hoverFontSize",
  color: "hoverFontColor"
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
