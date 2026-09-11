<template>
  <div class="ft-custom-select-global">
    <el-form-item label="默认选中" :label-width="firstLabelWidth">
      <SwInputNumber v-model="selectTargetData[0].option.defaultIndex" @change="update" :min="0" controls />
    </el-form-item>
    <el-form-item label="占位字符" :label-width="firstLabelWidth">
      <SwInput v-model="selectTargetData[0].option.placeholder" @change="update" />
    </el-form-item>

    <ItemSelectAlign
      label="对齐方式"
      :type="typeAttrs.flex"
      v-model="selectTargetData[0].option.boxTextAlign"
      @change="update"
      :label-width="firstLabelWidth"
    />
    <el-form-item label="文本样式" :label-width="firstLabelWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange">
        <template #append>
          <div style="flex: 1; margin-left: 8px" class="flex flex-justify-between">
            <SwInputNumber
              width="82"
              v-model="selectTargetData[0].option.boxLetterSpacing"
              unit="px"
              bottomLabel="字距"
            />
            <SwInputNumber width="60" v-model="selectTargetData[0].option.boxHeight" unit="px" bottomLabel="行距" />
          </div>
        </template>
      </configTextStyle>
    </el-form-item>

    <el-form-item label="偏移" :label-width="firstLabelWidth">
      <div style="width: 100%" class="flex flex-justify-between">
        <SwInputNumber v-model="selectTargetData[0].option.boxLabelOffsetX" unit="px" bottomLabel="X" />
        <SwInputNumber v-model="selectTargetData[0].option.boxLabelOffsetY" unit="px" bottomLabel="Y" />
      </div>
    </el-form-item>
    <SwCollapseItem title="背景" open>
      <template #content>
        <el-form-item label="填充方式" :label-width="secondLabelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.boxBackgroundType"
            @change="update"
          >
            <el-option label="颜色" value="color" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item
          label="颜色"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.boxBackgroundType == 'color'"
        >
          <SwSingleColorPicker v-model="selectTargetData[0].option.boxBackground" @change="update" />
        </el-form-item>

        <el-form-item
          label="图片"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.boxBackgroundType === 'custom'"
        >
          <SwUpload v-model="selectTargetData[0].option.boxBackgroundImage" @change="update" @delete="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="描边" open>
      <template #content>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.boxBorderWidth" unit="px" @change="update" />
        </el-form-item>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.boxBorderColor" @change="update" />
        </el-form-item>
        <el-form-item label="圆角" :label-width="secondLabelWidth">
          <SwSlider v-model="selectTargetData[0].option.boxRadius" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="下拉图标" open>
      <template #content>
        <el-form-item label="图片" :label-width="secondLabelWidth">
          <SwUpload v-model="selectTargetData[0].option.dropDownIcon" @change="update" @delete="update" />
        </el-form-item>
        <el-form-item label="颜色" :label-width="secondLabelWidth" v-if="!selectTargetData[0].option.dropDownIcon">
          <SwSingleColorPicker v-model="selectTargetData[0].option.contentColor" @change="update" />
        </el-form-item>
        <el-form-item label="尺寸" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.dropDownIconSize" unit="px" @change="update" />
        </el-form-item>
        <el-form-item label="右边距" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.rightMargin" unit="px" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput as SwInput } from "@screenwright/ui/input";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider as SwSlider } from "@screenwright/ui/slider";
import SwUpload from "@editor/base/SwUpload/index.vue";
import ItemSelectAlign from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "boxFontFamily",
  fontStyle: "boxFontStyle",
  fontWeight: "boxFontWeight",
  fontSize: "boxFontSize",
  color: "boxColor"
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 24px;
}
</style>
