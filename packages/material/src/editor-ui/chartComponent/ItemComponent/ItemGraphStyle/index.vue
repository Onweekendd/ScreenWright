<!-- 主项间隔边框 -->
<template>
  <SwCollapseItem title="数值标签" showIcon @change="update" v-model="selectTargetData[0].option.seriesLabelShow">
    <template #content>
      <el-form-item label="文本样式" :label-width="secondLabelWidth">
        <configTextStyle v-model="input" @change="handleConfigTextChange" />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "seriesLabelFontFamily",
  fontStyle: "seriesLabelFontStyle",
  fontWeight: "seriesLabelFontWeight",
  fontSize: "seriesLabelFontSize",
  color: "seriesLabelColor"
});
</script>
