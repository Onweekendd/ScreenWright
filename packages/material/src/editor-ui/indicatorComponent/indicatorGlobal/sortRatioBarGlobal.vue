<template>
  <div class="sort-ratio-bar-global" v-if="selectTargetData[0].option.globalConfig">
    <el-form-item label="背景颜色" :label-width="firstLabelWidth">
      <SwSingleColorPicker v-model="selectTargetData[0].option.globalConfig.bgColor" @change="update" width="80" />
    </el-form-item>

    <el-form-item label="间隔" :label-width="firstLabelWidth">
      <sw-input-number controls @change="update" v-model="selectTargetData[0].option.globalConfig.interval" :min="0" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
