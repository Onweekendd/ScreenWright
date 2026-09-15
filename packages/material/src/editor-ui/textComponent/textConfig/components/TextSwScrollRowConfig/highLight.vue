<template>
  <sw-collapse-item title="选中高亮" showIcon @change="update" v-model="selectTargetData[0].option.selectedShow">
    <template #content>
      <el-form-item label="选中模式" :label-width="73">
        <sw-radio
          v-model="selectTargetData[0].option.selectedMode"
          direction="row"
          :option="selectedMode"
          @change="update"
        />
      </el-form-item>
      <sw-collapse-item
        title="行内文本"
        :label-width="36"
        showIcon
        @change="update"
        v-model="selectTargetData[0].option.textStyleShow"
      >
        <template #content>
          <el-form-item label="文本样式" :label-width="36">
            <configTextStyle style="margin-left: 10px" v-model="input" @change="handleConfigTextChange">
              <template #append>
                <sw-input-number
                  v-model.number="selectTargetData[0].option.selectedHeight"
                  unit="px"
                  bottomLabel="行距"
                  :controls="false"
                  @change="update"
                />
                <sw-input-number
                  v-model.number="selectTargetData[0].option.selectedletterSpacing"
                  unit="px"
                  bottomLabel="字距"
                  :controls="false"
                  @change="update"
                />
              </template>
            </configTextStyle>
          </el-form-item>
        </template>
      </sw-collapse-item>
      <sw-collapse-item title="阴影" showIcon @change="update" v-model="selectTargetData[0].option.shadowShow">
        <template #content>
          <ItemTextShadow v-model="textShadowInput" @change="handleConfigTextShadowChange" :label-width="36" />
        </template>
      </sw-collapse-item>
      <sw-collapse-item title="背景">
        <template #content>
          <el-form-item label="填充方式" title="填充方式" :label-width="36">
            <el-select
              v-model="selectTargetData[0].option.selectedBgType"
              popper-class="sw-select-dropdown"
              @change="update"
            >
              <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="颜色" v-if="selectTargetData[0].option.selectedBgType === 'color'" :label-width="36">
            <sw-color-picker
              :options="{ colorTypeOption: 'linear-gradient,single' }"
              v-model:color="selectTargetData[0].option.selectedBgColor"
              field="selectedBg"
              :input-disabled="true"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="图片" v-if="selectTargetData[0].option.selectedBgType === 'custom'" :label-width="36">
            <sw-upload v-model="selectTargetData[0].option.selectedBgImage" @change="update" @delete="update" />
          </el-form-item>
        </template>
      </sw-collapse-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio } from "@screenwright/ui/radio";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import { useUpdateInstance } from "../../../../useUpdateInstance";
import { backgroundType } from "../../constants";
import { selectedMode } from "../../constants";
import ItemTextShadow from "../../ItemComponent/ItemTextShadow/index.vue";
import { useItemTextShadowAttrs } from "../../ItemComponent/ItemTextShadow/useItemTextShadow";

const { selectTargetData, update } = useUpdateInstance();
const { input: textShadowInput, handleConfigTextShadowChange } = useItemTextShadowAttrs({
  preFied: "",
  color: "shadowColor",
  x: "shadowX",
  y: "shadowY",
  blur: "shadowFuzzy"
});
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "selectedFontFamily",
  fontStyle: "selectedFontStyle",
  fontWeight: "selectedFontWeight",
  fontSize: "selectedFontSize",
  color: "selectedColor"
});
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
  margin-right: 12px;
}
</style>
