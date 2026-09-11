<template>
  <el-form-item label="面板边距" :label-width="firstLabelWidth">
    <div class="legend-size-wrapper flex flex-justify-between">
      <SwInputNumber
        v-model="selectTargetData[0].option.paddingTop"
        :controls="false"
        unit="px"
        bottom-label="上下"
        width="100"
        @change="update"
      />
      <SwInputNumber
        v-model="selectTargetData[0].option.paddingLeft"
        :controls="false"
        unit="px"
        bottom-label="左右"
        width="100"
        @change="update"
      />
    </div>
  </el-form-item>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";
import { useUpdateInstance } from "@editor/useUpdateInstance";

import { firstLabelWidth } from "../../../../constants";

const { update, selectTargetData } = useUpdateInstance();
</script>

<style lang="scss" scoped>
.legend-size-wrapper {
  width: 100%;
}
</style>
