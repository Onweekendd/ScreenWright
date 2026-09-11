<template>
  <el-form-item :label-width="labelWidth" label="映射">
    <div class="fullWidth flex flex-center-between">
      <sw-input
        v-model="selectTargetData[0].option.dataSeriesName[currentIndex]"
        bottomLabel="字段名"
        @change="update"
        width="90"
      />
      <sw-input
        v-model="selectTargetData[0].option.seriesTabsName[currentIndex].value"
        bottomLabel="显示名"
        @change="update"
        width="90"
      />
    </div>
  </el-form-item>
  <el-form-item :label-width="labelWidth" label="颜色">
    <Ft-color-picker
      v-if="props.type !== 'single'"
      :key="currentIndex"
      v-model:color="selectTargetData[0].option.seriesColor[currentIndex]"
      v-model:opacity="selectTargetData[0].option.seriesOpacity[currentIndex]"
      field="seriesColor"
      @change="update"
      :options="{ colorTypeOption: 'linear-gradient,single' }"
    />
    <Ft-single-color-picker
      v-else
      @change="update"
      v-model="selectTargetData[0].option.seriesColor[currentIndex]"
      field="seriesColor"
    />
  </el-form-item>
</template>
<script setup lang="ts">
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInput } from "@screenwright/ui/input";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { useUpdateInstance } from "../../../useUpdateInstance";

const props = withDefaults(
  defineProps<{
    type: string;
    currentIndex: number;
    labelWidth?: string;
  }>(),
  {
    type: "single",
    currentIndex: 0,
    labelWidth: "73"
  }
);
const { selectTargetData, update } = useUpdateInstance();
</script>
