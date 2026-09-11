<template>
  <el-form-item label="文本样式" label-width="45">
    <configTextStyle v-model="input" @change="handleConfigTextChange" />
  </el-form-item>
</template>
<script setup lang="ts">
import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";

const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "seriesLabelPercentFontFamily",
  fontStyle: "seriesLabelPercentFontStyle",
  fontWeight: "seriesLabelPercentFontWeight",
  fontSize: "seriesLabelPercentFontSize",
  color: "seriesLabelPercentColor"
});
</script>
