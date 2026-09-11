<!-- 主项间隔边框 -->
<template>
  <SwCollapseItem title="数值标签" showIcon @change="update" v-model="selectTargetData[0].option.seriesLabelShow">
    <template #content>
      <el-form-item label="文本样式" label-width="73">
        <configTextStyle v-model="input" @change="handleConfigTextChange" />
      </el-form-item>
      <el-form-item label="文本位置" label-width="73">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.labelPosition"
          placeholder="Select"
          style="width: 100%"
          @change="update"
        >
          <el-option v-for="item in labelPosition" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import configTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "seriesLabelFontFamily",
  fontStyle: "seriesLabelFontStyle",
  fontWeight: "seriesLabelFontWeight",
  fontSize: "seriesLabelFontSize",
  color: "seriesLabelColor"
});
const labelPosition = ref([
  { label: "上", value: "top" },
  { label: "下", value: "bottom" },
  { label: "左", value: "left" },
  { label: "右", value: "right" },
  { label: "中间", value: "center" }
]);
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 28px;
}
</style>
