<template>
  <div class="ft-data-container-global">
    <el-form-item
      label="文本内容"
      :label-width="firstLabelWidth"
      v-if="selectTargetData[0] && selectTargetData[0].option"
    >
      <sw-input v-model="selectTargetData[0].option.text" placeholder="请输入系列名称" @change="update" />
    </el-form-item>
    <el-form-item label="文本样式" :label-width="firstLabelWidth">
      <ConfigTextStyle v-model="input" @change="handleConfigTextChange" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { SwInput } from "@screenwright/ui";

import ConfigTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth } from "@editor/constants";
import { useUpdateInstance } from "@editor/useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
console.log(selectTargetData.value[0], "selectTargetData.value[0]");

const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontSize: "fontSize",
  color: "color",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight"
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
