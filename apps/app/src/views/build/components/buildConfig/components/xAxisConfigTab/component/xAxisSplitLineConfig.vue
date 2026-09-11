<template>
  <el-form-item label="类型" :label-width="labelWidth" v-if="type === TypeAttrs.row && showAxisSplitLineType">
    <el-select
      popper-class="sw-select-dropdown"
      v-model="axisSplitLineType"
      placeholder="Select"
      style="width: 100%"
    >
      <el-option v-for="item in lineType" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
  <el-form-item
    :label="showAxisSplitLineType ? '间隔' : '虚线间隔'"
    v-if="showAxisSplitLineIntervalLabel"
    :label-width="labelWidth"
  >
    <SwInputNumber v-model="axisSplitLineInterval" :min="0" @change="update" />
  </el-form-item>
  <el-form-item label="颜色" :label-width="labelWidth">
    <SwSingleColorPicker v-model="axisSplitLineColor" @change="update" />
  </el-form-item>
  <el-form-item label="粗细" :label-width="labelWidth">
    <SwInputNumber v-model="axisSplitLineWidth" unit="px" :min="0" @change="update" />
  </el-form-item>
</template>
<script setup lang="ts">
import { ref } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";

import { useUpdateInstance } from "../../../useUpdateInstance";
import { TypeAttrs, useAttrsByReverse } from "../useAttrsByReverse";

withDefaults(
  defineProps<{
    axisSplitLineIntervalLabel?: string;
    showAxisSplitLineType?: boolean;
    showAxisSplitLineIntervalLabel?: boolean;
  }>(),
  {
    axisSplitLineIntervalLabel: "间隔",
    showAxisSplitLineType: true,
    showAxisSplitLineIntervalLabel: true
  }
);
const { type, axisSplitLineType, axisSplitLineColor, axisSplitLineInterval, axisSplitLineWidth } = useAttrsByReverse();
const { update } = useUpdateInstance();
const labelWidth = ref("73");
const lineType = ref([
  { label: "实线", value: "solid" },
  { label: "虚线", value: "dashed" },
  { label: "点线", value: "dotted" }
]);
</script>
