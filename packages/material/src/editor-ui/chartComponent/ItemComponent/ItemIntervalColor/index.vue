<!-- 间隔颜色 -->
<template>
  <el-form-item label="间隔颜色" :label-width="secondLabelWidth">
    <sw-single-color-picker v-model="selectTargetData[0].option.intervalColor" field="intervalColor" @change="update" />
  </el-form-item>
</template>
<script setup lang="ts">
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
