<template>
  <div class="single-selected-style-config">
    <SwCollapseItem title="选中框" open>
      <template #content>
        <el-form-item label="边框颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.checkboxBorderColorIsChecked" @change="update" />
        </el-form-item>
        <el-form-item label="背景颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.checkboxBackgroundColorIsChecked" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="文字" open>
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>

        <el-form-item label="字体间距" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.labelLetterSpacingIsChecked" controls />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="勾选" open>
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.checkboxCheckColor" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "labelFontFamilyIsChecked",
  fontStyle: "labelFontStyleIsChecked",
  fontWeight: "labelFontWeightIsChecked",
  fontSize: "labelFontSizeIsChecked",
  color: "labelColorIsChecked"
});
</script>
