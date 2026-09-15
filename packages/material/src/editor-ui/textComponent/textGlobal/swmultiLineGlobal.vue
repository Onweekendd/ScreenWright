<!-- 多行文本 -->
<template>
  <div class="ft-multi-line-global">
    <el-form-item :label-width="firstLabelWidth" label="多行显示">
      <el-checkbox v-model="selectTargetData[0].option.whiteSpace" @change="update" />
    </el-form-item>
    <!-- 边距 -->
    <PaddingAttr />
    <el-form-item :label-width="firstLabelWidth" label="文本样式">
      <configTextStyle v-model="input" @change="handleChange" :isShowColorStyle="false" />
      <!-- <SwLabelType v-model="selectTargetData[0].option" @change="update" />
      <textFontStyle v-model="selectTargetData[0].option" @change="update" /> -->
    </el-form-item>
    <!-- 字体填充 -->
    <selectedTextType />
    <el-form-item :label-width="firstLabelWidth" label="字体间距">
      <sw-input-number v-model="selectTargetData[0].option.split" controls @change="update" />
    </el-form-item>
    <el-form-item :label-width="firstLabelWidth" label="字体行距">
      <sw-input-number v-model="selectTargetData[0].option.lineHeight" controls :min="10" @change="update" />
    </el-form-item>
    <el-form-item :label-width="firstLabelWidth" label="首行缩进">
      <sw-input-number v-model="selectTargetData[0].option.textIndent" controls @change="update" />
    </el-form-item>
    <!-- 对齐方式 -->
    <ItemSelectAlign
      label="水平对齐"
      :type="typeAttrs.default"
      v-model="selectTargetData[0].option.textAlign"
      @change="update"
      :label-width="firstLabelWidth"
    />
    <!-- 垂直对齐 -->
    <ItemSelectAlign
      :type="typeAttrs.vertical"
      v-model="selectTargetData[0].option.textAlignVertical"
      @change="update"
      label="垂直对齐"
      :label-width="firstLabelWidth"
    />
    <!-- 前缀图标 -->
    <PrefixIcon />
    <!-- 阴影 -->
    <Shadow :labelWidth="secondLabelWidth" />
    <!-- 动画 -->
    <sw-collapse-item
      v-if="selectTargetData[0].option.type && selectTargetData[0].option.type === 'scroll'"
      @change="update"
      title="动画设置"
      show-icon
      v-model="selectTargetData[0].option.scroll"
    >
      <template #content>
        <el-form-item label="滚动速度" :labelWidth="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.speed" @change="update" />
        </el-form-item>
        <el-form-item label="滚动方向" :labelWidth="secondLabelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.textDeraction"
            @change="update"
          >
            <el-option :label="item.label" :value="item.value" v-for="item in textDeraction" :key="item.value" />
          </el-select>
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
// import SwLabelType from "@screenwright/ui/label-type";
// import textFontStyle from "@editor/components/configTextStyle/textFontStyle.vue";
import configTextStyle from "@editor/components/configTextStyle/index.vue";

import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import PaddingAttr from "../textConfig/components/TextFtMultiLine/paddingAttr.vue";
import PrefixIcon from "../textConfig/components/TextFtMultiLine/prefixIcon.vue";
import selectedTextType from "../textConfig/components/TextFtMultiLine/selectedTextType.vue";
import Shadow from "../textConfig/components/TextFtMultiLine/shadow.vue";
import ItemSelectAlign from "../textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "../textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

const { update, selectTargetData } = useUpdateInstance();
const textDeraction = [
  { label: "向左", value: "ToLeft" },
  { label: "向右", value: "ToRight" },
  { label: "向上", value: "ToTop" },
  { label: "向下", value: "ToBottom" }
];
const input = ref({
  fontSize: selectTargetData.value[0].option.fontSize,
  fontFamily: selectTargetData.value[0].option.fontFamily,
  fontWeight: selectTargetData.value[0].option.fontWeight,
  fontStyle: selectTargetData.value[0].option.fontStyle,
  color: selectTargetData.value[0].option.color
});
const handleChange = (key: string, value: any) => {
  selectTargetData.value[0].option.color = value.color;
  selectTargetData.value[0].option.fontSize = value.fontSize;
  selectTargetData.value[0].option.fontFamily = value.fontFamily;
  selectTargetData.value[0].option.fontWeight = value.fontWeight;
  selectTargetData.value[0].option.fontStyle = value.fontStyle;
  update();
};
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

:deep(.inputBox) {
  overflow: hidden;
}
</style>
