<template>
  <el-form-item label="类型" :label-width="labelWidth" v-if="type === TypeAttrs.column && showyAxisSplitLineType">
    <el-select
      popper-class="sw-select-dropdown"
      v-model="selectTargetData[0].option.yAxisSplitLineType"
      placeholder="Select"
      style="width: 100%"
      @change="update"
    >
      <el-option v-for="item in lineType" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
  <el-form-item label="颜色" :label-width="labelWidth">
    <SwSingleColorPicker @change="update" v-model="axisSplitLineColor" />
  </el-form-item>
  <el-form-item label="粗细" :label-width="labelWidth">
    <SwInputNumber @change="update" v-model="axisSplitLineWidth" unit="px" :min="0" />
  </el-form-item>
</template>
<script setup lang="ts">
import { ref } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";

import { useUpdateInstance } from "../../../useUpdateInstance";
import { TypeAttrs, useAttrsByReverse } from "../useAttrsByReverse";

const { update, selectTargetData } = useUpdateInstance();
const { type, axisSplitLineColor, axisSplitLineWidth } = useAttrsByReverse();
const labelWidth = ref("73");
const lineType = ref([
  { label: "实线", value: "solid" },
  { label: "虚线", value: "dashed" },
  { label: "点线", value: "dotted" }
]);
withDefaults(
  defineProps<{
    showyAxisSplitLineType: boolean;
  }>(),
  {
    showyAxisSplitLineType: true
  }
);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 28px;
}
</style>
