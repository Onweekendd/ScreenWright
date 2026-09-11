<template>
  <SwCollapseItem title="悬停设置">
    <template #content>
      <el-form-item label="启用" :label-width="secondLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isHovered" @change="update" />
      </el-form-item>
      <el-form-item label="字体" :label-width="secondLabelWidth">
        <configTextStyle v-model="input" @change="handleConfigTextChange" :isShowFontStyle="false" />
      </el-form-item>
      <el-form-item label="背景" :label-width="secondLabelWidth">
        <SwUpload v-model="selectTargetData[0].option.hoverBgImage" @delete="update" @change="update" />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import SwUpload from "@editor/base/SwUpload/index.vue";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "hoverFontFamily",
  fontStyle: "legendFontStyle",
  fontWeight: "legendFontWeight",
  fontSize: "hoverFontSize",
  color: "hoverFontColor"
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
</style>
