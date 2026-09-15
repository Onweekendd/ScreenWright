<template>
  <div class="ft-datetime-global">
    <el-form-item label="时间格式" :label-width="firstLabelWidth">
      <el-select v-model="selectTargetData[0].option.format" popper-class="sw-select-dropdown" @change="update">
        <el-option v-for="item in formatList" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="自定义格式" :label-width="firstLabelWidth">
      <sw-input v-model="selectTargetData[0].option.format" @change="update" />
    </el-form-item>
    <el-form-item label="文本样式" :label-width="firstLabelWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange" />
      <!-- <SwLabelType v-model="selectTargetData[0].option" @change="update" />
      <textFontStyle v-model="selectTargetData[0].option" @change="update" /> -->
    </el-form-item>
    <el-form-item label="字体间距" :label-width="firstLabelWidth">
      <sw-input-number v-model="selectTargetData[0].option.split" controls @change="update" />
    </el-form-item>
    <el-form-item label="字体背景" :label-width="firstLabelWidth">
      <sw-single-color-picker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
    </el-form-item>
    <ItemSelectAlign
      label="水平对齐"
      v-model="selectTargetData[0].option.textAlign"
      :type="typeAttrs.default"
      @change="update"
      :label-width="firstLabelWidth"
    />
    <ItemSelectAlign
      label="垂直对齐"
      v-model="selectTargetData[0].option.textAlignVertical"
      :type="typeAttrs.vertical"
      @change="update"
      :label-width="firstLabelWidth"
    />
  </div>
</template>
<script setup lang="ts">
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import { formatList } from "./../textConfig/constants";
import ItemSelectAlign from "./../textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "./../textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

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
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
