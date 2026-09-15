<template>
  <el-form-item label="边距" :label-width="100">
    <div class="flex">
      <sw-input-number
        v-model.number="selectTargetData[0].option.lineMarginTop"
        bottomLabel="上"
        :controls="false"
        @change="update"
      />
      <sw-input-number
        v-model.number="selectTargetData[0].option.lineMarginBottom"
        bottomLabel="下"
        :controls="false"
        @change="update"
      />
      <sw-input-number
        v-model.number="selectTargetData[0].option.lineMarginLeft"
        bottomLabel="左"
        :controls="false"
        @change="update"
      />
      <sw-input-number
        v-model.number="selectTargetData[0].option.lineMarginRight"
        bottomLabel="右"
        :controls="false"
        @change="update"
      />
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";

import { useUpdateInstance } from "../../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
.inputBox + .inputBox {
  margin-left: 16px;
}
</style>
