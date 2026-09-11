<template>
  <div class="ft-custom-select-style">
    <SwCollapseItem title="下拉框" open>
      <template #content>
        <el-form-item label="位置" :label-width="secondLabelWidth">
          <SwRadio
            direction="row"
            v-model="selectTargetData[0].option.dropDownPosition"
            :option="dropDownPosition"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.dropdownBackgroundColor" @change="update" />
        </el-form-item>
        <el-form-item label="最大高度" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.dropDownHeight" unit="px" @change="update" />
        </el-form-item>
        <el-form-item label="顶部偏移" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.topOffset" unit="px" :controls="false" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="滚动条" open>
      <template #content>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <SwInputNumber v-model.number="selectTargetData[0].option.scrollBarWidth" unit="px" />
        </el-form-item>
        <el-form-item label="轨道" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.scrollBgColor" @change="update" />
        </el-form-item>
        <el-form-item label="滑块" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.barBgColor" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="下拉选项" open>
      <template #content>
        <el-form-item label="选项高度" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.optionHeight" unit="px" />
        </el-form-item>
        <ItemSelectAlign
          label="对齐方式"
          :type="typeAttrs.flex"
          v-model="selectTargetData[0].option.defaultTextAlign"
          @change="update"
          :label-width="secondLabelWidth"
        />
        <el-form-item label="项间距" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.optionSpace" unit="px" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="默认样式" open>
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange">
            <template #append>
              <div style="flex: 1; margin-left: 8px" class="flex flex-justify-between">
                <SwInputNumber
                  width="68"
                  v-model="selectTargetData[0].option.defaultLetterSpacing"
                  unit="px"
                  bottomLabel="字距"
                  @change="update"
                />
                <SwInputNumber
                  width="60"
                  v-model="selectTargetData[0].option.defaultlineHeight"
                  unit="px"
                  bottomLabel="行距"
                  @change="update"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div style="width: 100%" class="flex flex-justify-between">
            <SwInputNumber v-model="selectTargetData[0].option.defaultLabelOffsetX" unit="px" bottomLabel="X" />
            <SwInputNumber v-model="selectTargetData[0].option.defaultLabelOffsetY" unit="px" bottomLabel="Y" />
          </div>
        </el-form-item>
        <SwCollapseItem title="背景" open>
          <template #content>
            <el-form-item label="填充方式" :label-width="45">
              <el-select
                popper-class="sw-select-dropdown"
                v-model="selectTargetData[0].option.defaultBackgroundType"
                @change="update"
                style="margin-left: 2px"
              >
                <el-option label="颜色" value="color" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>

            <el-form-item
              label="颜色"
              :label-width="thirdLabelWidth"
              v-if="selectTargetData[0].option.defaultBackgroundType == 'color'"
            >
              <SwSingleColorPicker v-model="selectTargetData[0].option.defaultBackground" @change="update" />
            </el-form-item>

            <el-form-item
              label="图片"
              :label-width="thirdLabelWidth"
              v-if="selectTargetData[0].option.defaultBackgroundType === 'custom'"
            >
              <SwUpload v-model="selectTargetData[0].option.defaultBackgroundImage" @change="update" @delete="update" />
            </el-form-item>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="悬浮样式" open>
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="hoverInput" @change="handleHoverTextChange">
            <template #append>
              <div style="flex: 1; margin-left: 8px" class="flex flex-justify-between">
                <SwInputNumber
                  width="68"
                  v-model="selectTargetData[0].option.hoverLetterSpacing"
                  unit="px"
                  bottomLabel="字距"
                  @change="update"
                />
                <SwInputNumber
                  width="60"
                  v-model="selectTargetData[0].option.hoverHeight"
                  unit="px"
                  bottomLabel="行距"
                  @change="update"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div style="width: 100%" class="flex flex-justify-between">
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.hoverLabelOffsetX"
              unit="px"
              bottomLabel="X"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.hoverLabelOffsetY"
              unit="px"
              bottomLabel="Y"
            />
          </div>
        </el-form-item>
        <SwCollapseItem title="背景" open>
          <template #content>
            <el-form-item label="填充方式" :label-width="45">
              <el-select
                popper-class="sw-select-dropdown"
                v-model="selectTargetData[0].option.hoverBackgroundType"
                @change="update"
                style="margin-left: 2px"
              >
                <el-option label="颜色" value="color" />
                <el-option label="自定义" value="custom" />
              </el-select>
            </el-form-item>

            <el-form-item
              label="颜色"
              :label-width="thirdLabelWidth"
              v-if="selectTargetData[0].option.hoverBackgroundType == 'color'"
            >
              <SwSingleColorPicker v-model="selectTargetData[0].option.hoverBackground" @change="update" />
            </el-form-item>

            <el-form-item
              label="图片"
              :label-width="thirdLabelWidth"
              v-if="selectTargetData[0].option.hoverBackgroundType === 'custom'"
            >
              <SwUpload v-model="selectTargetData[0].option.hoverBackgroundImage" @change="update" @delete="update" />
            </el-form-item>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio as SwRadio } from "@screenwright/ui/radio";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";
import ItemSelectAlign from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth, thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const dropDownPosition = ref([
  { label: "向上", value: "top" },
  { label: "向下", value: "bottom" }
]);
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "defaultFontFamily",
  fontStyle: "defaultFontStyle",
  fontWeight: "defaultFontWeight",
  fontSize: "defaultFontSize",
  color: "defaultColor"
});
const { input: hoverInput, handleConfigTextChange: handleHoverTextChange } = useFontStyleAttrs({
  fontFamily: "hoverFontFamily",
  fontStyle: "hoverFontStyle",
  fontWeight: "hoverFontWeight",
  fontSize: "hoverFontSize",
  color: "hoverColor"
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
