<template>
  <sw-collapse-item title="类目" v-model="selectTargetData[0].option.seriesLabelNameShow[currentIndex]" showIcon>
    <template #content>
      <el-form-item label="文本样式" title="文本样式" :label-width="fourthLabelWidth">
        <ConfigTextStyle v-model="seriesLabelNameInput" @change="handleSeriesLabelNameChange" />
      </el-form-item>
    </template>
  </sw-collapse-item>
  <sw-collapse-item title="值" v-model="selectTargetData[0].option.seriesLabelValueShow[currentIndex]" showIcon>
    <template #content>
      <el-form-item label="文本样式" title="文本样式" :label-width="fourthLabelWidth">
        <ConfigTextStyle v-model="seriesLabelValueInput" @change="handleSeriesLabelValueChange" />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import ConfigTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { fourthLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const props = defineProps<{ currentIndex: number }>();
const { selectTargetData } = useUpdateInstance();

const { input: seriesLabelNameInput, handleConfigTextChange: handleSeriesLabelNameChange } = useFontStyleAttrs(
  {
    fontFamily: "seriesLabelNameFontFamily",
    fontSize: "seriesLabelNameFontSize",
    color: "seriesLabelNameColor",
    fontStyle: "seriesLabelNameFontStyle",
    fontWeight: "seriesLabelNameFontWeight"
  },
  props.currentIndex
);

const { input: seriesLabelValueInput, handleConfigTextChange: handleSeriesLabelValueChange } = useFontStyleAttrs(
  {
    fontFamily: "seriesLabelValueFontFamily",
    fontSize: "seriesLabelValueFontSize",
    color: "seriesLabelValueColor",
    fontStyle: "seriesLabelValueFontStyle",
    fontWeight: "seriesLabelValueFontWeight"
  },
  props.currentIndex
);
</script>
