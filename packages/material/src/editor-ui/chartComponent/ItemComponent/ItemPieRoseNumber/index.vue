<!-- echartpluralRosePie类型的数值标签 -->
<template>
  <SwCollapseItem @change="update" v-model="selectTargetData[0].option.seriesLabelShow" title="数值标签" showIcon>
    <template #content>
      <el-form-item label="文本样式" :label-width="labelWidth">
        <configTextStyle v-model="input" @change="handleConfigTextChange" />
      </el-form-item>
      <!-- 偏移 -->
      <ItemConfigOffsetDis />
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { useUpdateInstance } from "../../../useUpdateInstance";
import ItemConfigOffsetDis from "../../ItemComponent/ItemConfigOffsetDis/index.vue";

const labelWidth = ref("73");
const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "seriesLabelFontFamily",
  fontStyle: "seriesLabelFontStyle",
  fontWeight: "seriesLabelFontWeight",
  fontSize: "seriesLabelFontSize",
  color: "seriesLabelColor"
});
</script>
