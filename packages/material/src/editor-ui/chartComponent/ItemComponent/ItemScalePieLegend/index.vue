<template>
  <sw-collapse-item title="图例" showIcon v-model="selectTargetData[0].option.legendShow">
    <template #content>
      <el-form-item label="图标尺寸" :label-width="labelWidth">
        <sw-input-number
          v-model="selectTargetData[0].option.legendItemWidthAndHeight"
          :controls="false"
          unit="px"
          :min="0"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="间距" :label-width="labelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.legendTextLeftPadding"
          unit="px"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="文本样式" :label-width="labelWidth">
        <configTextStyle v-model="input" @change="handleConfigTextChange" />
      </el-form-item>
      <legendOrient />
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import legendOrient from "../../../components/configLegend/legendOrient.vue";
import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "legendFontFamily",
  fontStyle: "legendFontStyle",
  fontWeight: "legendFontWeight",
  fontSize: "legendFontSize",
  color: "legendColor"
});
const { selectTargetData, update } = useUpdateInstance();
const labelWidth = ref("73");
</script>
