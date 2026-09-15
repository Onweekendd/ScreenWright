<!-- 多行文本 -->
<template>
  <div class="text-ft-multi-line">
    <el-form-item label="多行显示">
      <el-checkbox v-model="selectTargetData[0].option.whiteSpace" @change="update" />
    </el-form-item>
    <!-- 边距 -->
    <PaddingAttr />
    <el-form-item label="文本样式">
      <SwLabelType v-model="selectTargetData[0].option" @change="update" />
      <textFontStyle v-model="selectTargetData[0].option" @change="update" />
    </el-form-item>
    <!-- 字体填充 -->
    <selectedTextType />
    <el-form-item label="字体间距">
      <sw-input-number v-model="selectTargetData[0].option.split" controls @change="update" />
    </el-form-item>
    <el-form-item label="字体行距">
      <sw-input-number v-model="selectTargetData[0].option.lineHeight" controls :min="10" @change="update" />
    </el-form-item>
    <el-form-item label="首行缩进" v-if="selectTargetData[0].option.textIndent >= 0">
      <sw-input-number v-model="selectTargetData[0].option.textIndent" controls @change="update" />
    </el-form-item>
    <!-- 对齐方式 -->
    <ItemSelectAlign :type="typeAttrs.default" v-model="selectTargetData[0].option.textAlign" @change="update" />
    <!-- 垂直对齐 -->
    <ItemSelectAlign
      :type="typeAttrs.vertical"
      v-model="selectTargetData[0].option.textAlignVertical"
      @change="update"
    />
    <!-- 前缀图标 -->
    <PrefixIcon />
    <!-- 阴影 -->
    <Shadow />
    <!-- 动画 -->
    <Animate />
  </div>
</template>

<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwLabelType } from "@screenwright/ui/label-type";
import textFontStyle from "@editor/components/configTextStyle/textFontStyle.vue";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import ItemSelectAlign from "../../ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "../../ItemComponent/ItemSelectAlign/ItemSelectAlign";
import Animate from "./animate.vue";
import PaddingAttr from "./paddingAttr.vue";
import PrefixIcon from "./prefixIcon.vue";
import selectedTextType from "./selectedTextType.vue";
import Shadow from "./shadow.vue";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
:deep(.inputBox) {
  overflow: hidden;
}
</style>
