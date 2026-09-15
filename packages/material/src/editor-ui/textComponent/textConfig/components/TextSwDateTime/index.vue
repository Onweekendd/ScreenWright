<template>
  <div class="text-ft-status-text">
    <el-form-item label="时间格式">
      <el-select v-model="selectTargetData[0].option.format" popper-class="sw-select-dropdown" @change="update">
        <el-option v-for="item in formatList" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="自定义格式">
      <sw-input v-model="selectTargetData[0].option.format" @change="update" />
    </el-form-item>
    <el-form-item label="文本样式">
      <SwLabelType v-model="selectTargetData[0].option" @change="update" />
      <textFontStyle v-model="selectTargetData[0].option" @change="update" />
    </el-form-item>
    <el-form-item label="字体间距">
      <sw-input-number v-model="selectTargetData[0].option.split" controls @change="update" />
    </el-form-item>
    <el-form-item label="字体背景">
      <sw-single-color-picker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
    </el-form-item>
    <ItemSelectAlign
      label="水平对齐"
      v-model="selectTargetData[0].option.textAlign"
      :type="typeAttrs.default"
      @change="update"
    />
    <ItemSelectAlign
      label="垂直对齐"
      v-model="selectTargetData[0].option.textAlignVertical"
      :type="typeAttrs.vertical"
      @change="update"
    />
  </div>
</template>
<script setup lang="ts">
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber as ftInputNumber } from "@screenwright/ui/input-number";
import { SwLabelType } from "@screenwright/ui/label-type";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import textFontStyle from "@editor/components/configTextStyle/textFontStyle.vue";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import ItemSelectAlign from "./../../ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "./../../ItemComponent/ItemSelectAlign/ItemSelectAlign";
import { formatList } from "./option";

const { update, selectTargetData } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
