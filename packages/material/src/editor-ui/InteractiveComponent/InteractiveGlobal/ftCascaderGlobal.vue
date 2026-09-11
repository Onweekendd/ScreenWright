<template>
  <div class="ft-cascader-global">
    <el-form-item label="占位字符" :label-width="firstLabelWidth">
      <SwInput v-model="selectTargetData[0].option.placeholder" @change="update" />
    </el-form-item>
    <el-form-item label="文本" :label-width="firstLabelWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange">
        <template #append>
          <SwInputNumber
            v-model="selectTargetData[0].option.letterSpacing"
            @change="update"
            bottomLabel="字距"
            unit="px"
            width="60"
            style="margin-left: 12px"
          />
          <SwInputNumber
            v-model="selectTargetData[0].option.lineHeight"
            @change="update"
            bottomLabel="行距"
            unit="px"
            width="60"
            style="margin-left: 12px"
          />
        </template>
      </configTextStyle>
    </el-form-item>
    <ItemSelectAlign
      label="对齐方式"
      :type="typeAttrs.defaultWithThree"
      v-model="selectTargetData[0].option.textAlign"
      @change="update"
      :label-width="firstLabelWidth"
    />
    <SwCollapseItem title="背景" open>
      <template #content>
        <el-form-item label="填充方式" :label-width="secondLabelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.backgroundType"
            @change="update"
          >
            <el-option label="颜色" value="color" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item
          :label-width="secondLabelWidth"
          label="颜色"
          v-if="selectTargetData[0].option.backgroundType == 'color'"
        >
          <SwSingleColorPicker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
        </el-form-item>
        <el-form-item
          label="图片"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.backgroundType == 'custom'"
        >
          <SwUpload v-model="selectTargetData[0].option.backgroundImage" @delete="update" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="描边" open>
      <template #content>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.borderWidth" unit="px" @change="update" />
        </el-form-item>

        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.borderColor" @change="update" />
        </el-form-item>
        <el-form-item label="圆角" :label-width="secondLabelWidth">
          <SwSlider v-model="selectTargetData[0].option.borderRadius" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="下拉图标" open>
      <template #content>
        <el-form-item label="图片" :label-width="secondLabelWidth">
          <SwUpload v-model="selectTargetData[0].option.dropDownIcon" @change="update" @delete="update" />
        </el-form-item>
        <el-form-item label="尺寸" :label-width="secondLabelWidth">
          <SwInputNumber v-model.number="selectTargetData[0].option.dropDownIconSize" unit="px" @change="update" />
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
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "color"
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
