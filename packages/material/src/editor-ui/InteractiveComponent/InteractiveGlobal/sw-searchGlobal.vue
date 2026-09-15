<template>
  <div class="ft-search-global">
    <el-form-item label="占位字符" :label-width="firstLabelWidth">
      <SwInput @change="update" v-model="selectTargetData[0].option.placeholder" />
    </el-form-item>
    <SwCollapseItem title="文字" open>
      <template #content>
        <el-form-item label="缩进" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.textIndent" @change="update" unit="px" />
        </el-form-item>

        <el-form-item label="提示文字" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>

        <el-form-item label="输入文字" :label-width="secondLabelWidth">
          <configTextStyle v-model="inputDefault" @change="handleInputTextChange" />
        </el-form-item>
      </template>
    </SwCollapseItem>
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

        <template v-if="selectTargetData[0].option.backgroundType == 'custom'">
          <el-form-item label="类型" :label-width="secondLabelWidth">
            <el-select
              popper-class="sw-select-dropdown"
              v-model="selectTargetData[0].option.backgroundImageType"
              @change="update"
            >
              <el-option label="适应" value="100% 100%" />
              <el-option label="原比例" value="contain" />
              <el-option label="裁切" value="cover" />
            </el-select>
          </el-form-item>
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <SwUpload v-model="selectTargetData[0].option.backgroundImage" @delete="update" @change="update" />
          </el-form-item>
        </template>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="描边" open>
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.borderColor" @change="update" width="80" />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <SwInputNumber
            v-model="selectTargetData[0].option.borderWidth"
            :min="0"
            :max="100"
            unit="px"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="圆角" :label-width="secondLabelWidth">
          <SwSlider v-model="selectTargetData[0].option.borderRadius" unit="px" @change="update" />
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

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamilyTip",
  fontStyle: "fontStyleTip",
  fontWeight: "fontWeightTip",
  fontSize: "fontSizeTip",
  color: "fontColorTip"
});
const { input: inputDefault, handleConfigTextChange: handleInputTextChange } = useFontStyleAttrs({
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
</style>
