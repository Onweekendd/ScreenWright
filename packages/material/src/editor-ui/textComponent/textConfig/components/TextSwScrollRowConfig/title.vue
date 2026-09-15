<template>
  <sw-collapse-item title="表头设置" showIcon v-model="selectTargetData[0].option.headerShow" @change="update">
    <template #content>
      <el-form-item label="边框显隐" :label-width="labelWidth">
        <el-checkbox v-model="selectTargetData[0].option.borderShow" @change="update" />
      </el-form-item>
      <el-form-item label="行高" :label-width="labelWidth">
        <sw-input-number
          v-model="selectTargetData[0].option.headerlineHeight"
          unit="px"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="文本样式" :label-width="labelWidth">
        <configTextStyle v-model="input" @change="handleConfigTextChange">
          <template #append>
            <sw-input-number
              v-model.number="selectTargetData[0].option.headerHeight"
              unit="px"
              bottomLabel="行距"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.headerletterSpacing"
              unit="px"
              bottomLabel="字距"
              :controls="false"
              @change="update"
            />
          </template>
        </configTextStyle>
      </el-form-item>
      <ItemSelectAlign
        :type="typeAttrs.default"
        v-model="selectTargetData[0].option.headerTextAlign"
        @change="update"
      />
      <sw-collapse-item title="背景">
        <template #content>
          <el-form-item label="填充方式" title="填充方式" :label-width="38">
            <el-select
              v-model="selectTargetData[0].option.backgroundType"
              popper-class="sw-select-dropdown"
              @change="update"
              style="margin-left: 10px"
            >
              <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="颜色" v-if="selectTargetData[0].option.backgroundType === 'color'" :label-width="34">
            <sw-single-color-picker
              field="tableHeaderBackground"
              v-model="selectTargetData[0].option.headerBackground"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="图片" v-if="selectTargetData[0].option.backgroundType === 'custom'" :label-width="48">
            <sw-upload
              v-model="selectTargetData[0].option.backgroundImage"
              :multiple="false"
              :showFileList="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>
        </template>
      </sw-collapse-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import { useUpdateInstance } from "../../../../useUpdateInstance";
import { backgroundType } from "../../constants";
import ItemSelectAlign from "../../ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "../../ItemComponent/ItemSelectAlign/ItemSelectAlign";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "headerFontFamily",
  fontStyle: "headerFontStyle",
  fontWeight: "headerFontWeight",
  fontSize: "headerFontSize",
  color: "headerColor"
});
const labelWidth = 73;
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
