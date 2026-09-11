<template>
  <div class="config-data-zoom">
    <el-form-item label="显示个数" :labelWidth="labelWidth">
      <SwInputNumber v-model="selectTargetData[0].option.dataLoopDisplayRows" controls width="100%" @change="update" />
    </el-form-item>

    <el-form-item label="宽度" :labelWidth="labelWidth">
      <SwSlider v-model="selectTargetData[0].option.moveHandleSize" @change="update" />
    </el-form-item>
    <el-form-item label="颜色" :labelWidth="labelWidth">
      <SwSingleColorPicker v-model="selectTargetData[0].option.moveHandleColor" @change="update" />
    </el-form-item>
    <el-form-item label="高亮颜色" :labelWidth="labelWidth">
      <SwSingleColorPicker v-model="selectTargetData[0].option.moveHandleEmphasisColor" @change="update" />
    </el-form-item>
    <el-form-item label="右边距" :labelWidth="labelWidth" v-if="type === 'right'">
      <SwSlider v-model="selectTargetData[0].option.dataZoomRight" @change="update" />
    </el-form-item>
    <el-form-item label="底边距" :labelWidth="labelWidth" v-if="type === 'bottom'">
      <SwSlider v-model="selectTargetData[0].option.dataZoomBottom" @change="update" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import { useUpdateInstance } from "../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
interface Props {
  labelWidth?: string;
  type?: "right" | "bottom";
}
withDefaults(defineProps<Props>(), {
  labelWidth: "73",
  type: "right"
});
</script>
