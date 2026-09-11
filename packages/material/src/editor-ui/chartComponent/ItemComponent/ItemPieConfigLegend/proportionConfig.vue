<!-- 图例占比值配置 -->
<template>
  <SwCollapseItem @change="update" title="占比值" v-model="selectTargetData[0].option.legendPercentShow" show-icon>
    <template #content>
      <el-form-item label="小数位数" label-width="45">
        <SwInputNumber controls @change="update" v-model="selectTargetData[0].option.legendPercent" />
      </el-form-item>
      <el-form-item label="间距" label-width="45">
        <SwInputNumber
          @change="update"
          v-model="selectTargetData[0].option.legendPercentLeftPadding"
          unit="px"
          :controls="false"
        />
      </el-form-item>

      <el-form-item label="文本样式" label-width="45">
        <configTextStyle v-model="input" @change="handleConfigTextChange" />
      </el-form-item>

      <el-form-item label="颜色跟随" label-width="45">
        <el-checkbox v-model="selectTargetData[0].option.legendPercentColorFollow" @change="update" />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "legendPercentFontFamily",
  fontStyle: "legendPercentFontStyle",
  fontWeight: "legendPercentFontWeight",
  fontSize: "legendPercentFontSize",
  color: "legendPercentColor"
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
