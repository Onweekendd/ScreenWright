<template>
  <div class="ft-page-turning-style">
    <SwCollapseItem title="阴影" show-icon v-model="selectTargetData[0].option.shadowShow" @change="update">
      <template #content>
        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" style="width: 100%">
            <FrontColorPicker
              v-model="selectTargetData[0].option.shadowColor"
              style="position: relative; top: 6px"
              @confirm="update"
            />
            <SwInputNumber width="50" v-model="selectTargetData[0].option.shadowX" bottomLabel="X" @change="update" />
            <SwInputNumber width="50" v-model="selectTargetData[0].option.shadowY" bottomLabel="Y" @change="update" />
            <SwInputNumber
              width="50"
              v-model="selectTargetData[0].option.shadowFuzzy"
              bottomLabel="模糊"
              @change="update"
            />
          </div>
        </el-form-item>

        <el-form-item label="字体间距" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.letterSpacing" :min="0" controls @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="当前页">
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange" :isShowColorStyle="false" />
        </el-form-item>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.color" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="分隔符">
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="inputSplit" @change="handleSpiltChange" :isShowColorStyle="false" />
        </el-form-item>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.colorLine" @change="update" />
        </el-form-item>

        <el-form-item label="字体间距" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.split" :min="0" controls @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="总页数">
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="pageInput" @change="handleInputChange" :isShowColorStyle="false" />
        </el-form-item>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.colorTotal" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ScreenwrightColorPicker as FrontColorPicker } from "@screenwright/ui";
import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "@editor/textComponent/textConfig/textConfig";
import { useUpdateInstance } from "../../useUpdateInstance";

// import SwUpload from "@editor/base/SwUpload/index.vue"

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor"
});

const { input: inputSplit, handleConfigTextChange: handleSpiltChange } = useFontStyleAttrs({
  fontFamily: "fontFamilyLine",
  fontStyle: "fontStyleLine",
  fontWeight: "fontWeightLine",
  fontSize: "fontSizeLine",
  color: "fontColor"
});

const { input: pageInput, handleConfigTextChange: handleInputChange } = useFontStyleAttrs({
  fontFamily: "fontFamilyTotal",
  fontStyle: "fontStyleTotal",
  fontWeight: "fontWeightTotal",
  fontSize: "fontSizeTotal",
  color: "fontColor"
});
</script>
