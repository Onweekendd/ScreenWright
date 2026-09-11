<template>
  <div class="ft-countup-v2-prefix">
    <el-form-item label="前缀内容" :label-width="firstLabelWidth">
      <sw-input @change="update" v-model="selectTargetData[0].option.prefixText" />
    </el-form-item>
    <el-form-item label="文本样式" title="文本样式" :label-width="firstLabelWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange" />
    </el-form-item>
    <el-form-item label="X间距" :label-width="firstLabelWidth">
      <sw-slider @change="update" v-model="selectTargetData[0].option.prefixSplitx" />
    </el-form-item>
    <el-form-item label="Y间距" :label-width="firstLabelWidth">
      <sw-slider @change="update" v-model="selectTargetData[0].option.prefixSplity" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwInput as ftInput } from "@screenwright/ui/input";
import { SwSlider } from "@screenwright/ui/slider";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "prefixFontFamily",
  fontStyle: "prefixFontStyle",
  fontWeight: "prefixFontWeight",
  fontSize: "prefixFontSize",
  color: "prefixColor"
});
</script>
