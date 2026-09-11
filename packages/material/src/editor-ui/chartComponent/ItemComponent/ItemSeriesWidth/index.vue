<template>
  <el-form-item label="柱体宽度" :label-width="secondLabelWidth">
    <sw-slider v-model="selectTargetData[0].option.seriesWidth" :max="40" :min="1" @change="update" />
  </el-form-item>
</template>
<script setup lang="ts">
import { SwSlider } from "@screenwright/ui/slider";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
