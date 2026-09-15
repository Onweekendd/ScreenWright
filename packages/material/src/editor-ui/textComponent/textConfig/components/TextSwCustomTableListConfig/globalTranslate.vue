<template>
  <el-form-item label="偏移" :label-width="firstLabelWidth" v-if="selectTargetData[0].option.globalConfig">
    <div class="input-wrap flex flex-center-between">
      <sw-input-number
        v-model="selectTargetData[0].option.globalConfig.globalTranslateX"
        unit="px"
        bottomLabel="X"
        :controls="false"
        @change="update"
        width="90"
      />
      <sw-input-number
        v-model="selectTargetData[0].option.globalConfig.globalTranslateY"
        unit="px"
        bottomLabel="Y"
        :controls="false"
        @change="update"
        width="90"
      />
    </div>
  </el-form-item>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";

import { firstLabelWidth } from "../../../../constants";
import { useUpdateInstance } from "../../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
.input-wrap {
  width: 100%;
}
</style>
