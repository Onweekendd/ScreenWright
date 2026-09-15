<template>
  <div class="ft-cascader-style">
    <SwCollapseItem title="下拉框" open>
      <template #content>
        <el-form-item label="下拉框背景" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.dropdownBackgroundColor" @change="update" />
        </el-form-item>

        <el-form-item label="下拉框高度" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.dropdownMaxHeight" unit="px" @change="update" />
        </el-form-item>
        <el-form-item label="顶部偏移" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.dropdownMarginTop" unit="px" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="滚动条">
      <template #content>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.scrollBarWidth" unit="px" @change="update" />
        </el-form-item>

        <el-form-item label="轨道" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.scrollBackgroundColor" @change="update" />
        </el-form-item>
        <el-form-item label="滑块" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.scrollBarColor" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="下拉选项">
      <template #content>
        <el-form-item label="选项高度" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.menuHeight" unit="px" @change="update" />
        </el-form-item>
        <el-form-item label="左间距" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.menuMarginLeft" unit="px" @change="update" />
        </el-form-item>
        <el-form-item label="项间距" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.menuMarginTop" unit="px" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="默认样式">
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange">
            <template #append>
              <div style="flex: 1; margin-left: 8px" class="flex flex-justify-between">
                <SwInputNumber
                  width="68"
                  v-model="selectTargetData[0].option.menuDefaultLetterSpacing"
                  unit="px"
                  bottomLabel="字距"
                  @change="update"
                />
                <SwInputNumber
                  width="60"
                  v-model="selectTargetData[0].option.menuDefaultLineHeight"
                  unit="px"
                  bottomLabel="行距"
                  @change="update"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>
        <SwCollapseItem title="背景">
          <template #content>
            <el-form-item label="填充方式" title="填充方式" :label-width="parseInt(thirdLabelWidth) - 10">
              <el-select
                popper-class="sw-select-dropdown"
                v-model="selectTargetData[0].option.menuDefaultBackgroundType"
                @change="update"
                style="margin-left: 8px"
              >
                <el-option label="颜色" value="color" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
            <el-form-item
              label="颜色"
              :label-width="thirdLabelWidth"
              v-if="selectTargetData[0].option.menuDefaultBackgroundType == 'color'"
            >
              <SwSingleColorPicker v-model="selectTargetData[0].option.menuDefaultBackgroundColor" @change="update" />
            </el-form-item>

            <el-form-item
              label="图片"
              :label-width="thirdLabelWidth"
              v-if="selectTargetData[0].option.menuDefaultBackgroundType === 'custom'"
            >
              <SwUpload
                v-model="selectTargetData[0].option.menuDefaultBackgroundImage"
                @change="update"
                @delete="update"
              />
            </el-form-item>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="悬浮样式">
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="hoverInput" @change="handleHoverTextChange">
            <template #append>
              <div style="flex: 1; margin-left: 8px" class="flex flex-justify-between">
                <SwInputNumber
                  width="68"
                  v-model="selectTargetData[0].option.menuHoverLetterSpacing"
                  unit="px"
                  bottomLabel="字距"
                  @change="update"
                />
                <SwInputNumber
                  width="60"
                  v-model="selectTargetData[0].option.menuHoverLineHeight"
                  unit="px"
                  bottomLabel="行距"
                  @change="update"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>
        <SwCollapseItem title="背景">
          <template #content>
            <el-form-item label="填充方式" title="填充方式" :label-width="parseInt(thirdLabelWidth) - 10">
              <el-select
                popper-class="sw-select-dropdown"
                v-model="selectTargetData[0].option.menuHoverBackgroundType"
                @change="update"
                style="margin-left: 8px"
              >
                <el-option label="颜色" value="color" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>
            <el-form-item
              label="颜色"
              :label-width="thirdLabelWidth"
              v-if="selectTargetData[0].option.menuHoverBackgroundType == 'color'"
            >
              <SwSingleColorPicker v-model="selectTargetData[0].option.menuHoverBackgroundColor" @change="update" />
            </el-form-item>
            <el-form-item
              label="图片"
              :label-width="thirdLabelWidth"
              v-if="selectTargetData[0].option.menuHoverBackgroundType === 'custom'"
            >
              <SwUpload
                v-model="selectTargetData[0].option.menuHoverBackgroundImage"
                @change="update"
                @delete="update"
              />
            </el-form-item>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth, thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "menuDefaultFontFamily",
  fontStyle: "menuDefaultFontStyle",
  fontWeight: "menuDefaultFontWeight",
  fontSize: "menuDefaultFontSize",
  color: "menuDefaultColor"
});

const { input: hoverInput, handleConfigTextChange: handleHoverTextChange } = useFontStyleAttrs({
  fontFamily: "menuHoverFontFamily",
  fontStyle: "menuHoverFontStyle",
  fontWeight: "menuHoverFontWeight",
  fontSize: "menuHoverFontSize",
  color: "menuHoverColor"
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 24px;
}
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
