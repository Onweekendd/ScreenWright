<!-- 饼图真实值配置 -->
<template>
  <SwCollapseItem @change="update" title="真实值" v-model="selectTargetData[0].option.legendValueShow" showIcon>
    <template #content>
      <SwCollapseItem title="后缀" open>
        <template #content>
          <el-form-item label="内容" :label-width="fourthLabelWidth">
            <SwInput @change="update" v-model="selectTargetData[0].option.legendUnit" />
          </el-form-item>
          <el-form-item label="字号" :label-width="fourthLabelWidth">
            <SwInputNumber @change="update" controls v-model="selectTargetData[0].option.legendUnitFontSize" />
          </el-form-item>
          <el-form-item label="间距" :label-width="fourthLabelWidth">
            <SwInputNumber @change="update" controls v-model="selectTargetData[0].option.legendUnitLeftPadding" />
          </el-form-item>
        </template>
      </SwCollapseItem>
      <el-form-item label="间距" :label-width="thirdLabelWidth">
        <SwInputNumber @change="update" unit="px" v-model="selectTargetData[0].option.legendValueLeftPadding" />
      </el-form-item>
      <el-form-item label="颜色跟随" :label-width="thirdLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.legendValueColorFollow" @change="update" />
      </el-form-item>
      <!-- 真实值的文本样式 -->
      <el-form-item label="文本样式" :label-width="thirdLabelWidth">
        <configTextStyle v-model="input" @change="handleConfigTextChange" />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { fourthLabelWidth, thirdLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "legendValueFontFamily",
  fontStyle: "legendValueFontStyle",
  fontWeight: "legendValueFontWeight",
  fontSize: "legendValueFontSize",
  color: "legendValueColor"
});
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
