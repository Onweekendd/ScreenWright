<!-- 文本框 -->
<template>
  <div class="text-ft-text">
    <el-form-item label="文本内容" v-if="!Array.isArray(selectTargetData[0].data)">
      <sw-input v-model="selectTargetData[0].value" />
    </el-form-item>
    <el-form-item label="是否换行">
      <el-checkbox v-model="selectTargetData[0].option.iswrap" @change="update" />
    </el-form-item>
    <el-form-item label="文本样式" :label-width="73">
      <SwLabelType v-model="selectTargetData[0].option" @change="update" />
      <textFontStyle v-model="selectTargetData[0].option" @change="update" />
    </el-form-item>
    <el-form-item label="字体填充">
      <el-select
        v-model="selectTargetData[0].option.selectedTextType"
        popper-class="sw-select-dropdown"
        @change="update"
      >
        <el-option v-for="item in textColorType" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="颜色" v-if="selectTargetData[0].option.selectedTextType === 'normal'">
      <sw-single-color-picker v-model="selectTargetData[0].option.color" @change="update" />
    </el-form-item>
    <el-form-item label="字体背景">
      <sw-single-color-picker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
    </el-form-item>
    <el-form-item label="颜色" v-if="selectTargetData[0].option.selectedTextType === 'gradient'">
      <sw-single-color-picker v-model="selectTargetData[0].option.selectedTextColor" />
    </el-form-item>
    <el-form-item label="字体间距">
      <sw-input-number v-model="selectTargetData[0].option.split" :min="0" controls @change="update" />
    </el-form-item>
    <el-form-item label="字体行高">
      <sw-input-number v-model="selectTargetData[0].option.lineHeight" :min="1" controls @change="update" />
    </el-form-item>
    <el-form-item label="字体方向" v-if="selectTargetData[0].component.name !== 'ft-text2'">
      <sw-radio v-model="selectTargetData[0].option.writingMode" direction="row" :option="writingList" />
    </el-form-item>
    <el-form-item label="垂直排版" v-if="selectTargetData[0].option.writingMode === 'tb-rl'">
      <sw-radio v-model="selectTargetData[0].option.textOrientation" direction="row" :option="textOrientation" />
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
    <el-form-item label="鼠标事件">
      <el-checkbox v-model="selectTargetData[0].option.pointerEvents" @change="update" />
    </el-form-item>
    <!-- 超链设置 -->
    <Link v-if="selectTargetData[0].option.type && selectTargetData[0].option.type === 'link'" />
    <!-- 阴影 -->
    <shadow />
    <!-- 跑马灯设置 -->
    <scroll v-if="selectTargetData[0].option.type && selectTargetData[0].option.type === 'scroll'" />
  </div>
</template>
<script setup lang="ts">
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber as swInputNumber } from "@screenwright/ui/input-number";
import { SwLabelType } from "@screenwright/ui/label-type";
import { SwRadio } from "@screenwright/ui/radio";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import textFontStyle from "@editor/components/configTextStyle/textFontStyle.vue";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import { textColorType } from "../../constants";
import ItemSelectAlign from "./../../ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "./../../ItemComponent/ItemSelectAlign/ItemSelectAlign";
import Link from "./link.vue";
import { textOrientation, writingList } from "./option";
import scroll from "./scroll.vue";
import shadow from "./shadow.vue";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
