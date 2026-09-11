<template>
  <div class="ft-countup-v2-suffix">
    <el-form-item label="后缀内容" :label-width="firstLabelWidth">
      <sw-input @change="update" v-model="selectTargetData[0].option.suffixText" />
    </el-form-item>
    <el-form-item label="样式" :label-width="firstLabelWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange" />
    </el-form-item>
    <el-form-item label="X间距" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.suffixSplitx" />
    </el-form-item>
    <el-form-item label="Y间距" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.suffixSplity" />
    </el-form-item>

    <SwCollapseItem title="字体渐变">
      <template #content>
        <el-form-item label="字体渐变" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.suffixSetFontLinear" @change="update" />
        </el-form-item>
        <el-form-item
          label="字体颜色"
          v-if="selectTargetData[0].option.suffixSetFontLinear"
          :label-width="secondLabelWidth"
        >
          <sw-color-picker
            field="textGradientColor"
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            v-model:color="selectTargetData[0].option.suffixFontLinearColor"
            :opacity="100"
            inputDisabled
            returnType="str"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInput } from "@screenwright/ui/input";
import { SwSlider } from "@screenwright/ui/slider";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "suffixFontFamily",
  fontStyle: "suffixFontStyle",
  fontWeight: "suffixFontWeight",
  fontSize: "suffixFontSize",
  color: "suffixColor"
});
</script>
