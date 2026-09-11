<!-- 处理偏移组件 -->
<template>
  <el-form-item label="偏移" :label-width="labelWidth">
    <div class="fullWidth flex flex-center-between">
      <SwInputNumber
        @change="update"
        unit="px"
        bottom-label="X"
        width="90"
        v-model="selectTargetData[0].option.seriesLabelOffsetX"
      />
      <SwInputNumber
        @change="update"
        unit="px"
        bottom-label="Y"
        width="90"
        v-model="selectTargetData[0].option.seriesLabelOffsetY"
      />
    </div>
  </el-form-item>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";

import { useUpdateInstance } from "../../../useUpdateInstance";

interface Props {
  labelWidth?: string;
}
withDefaults(defineProps<Props>(), {
  labelWidth: "73"
});
const { selectTargetData, update } = useUpdateInstance();
</script>
