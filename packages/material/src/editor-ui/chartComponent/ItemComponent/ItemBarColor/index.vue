<!-- 柱体颜色 -->
<template>
  <el-form-item label="柱体颜色" :label-width="secondLabelWidth">
    <sw-color-picker
      v-model:color="selectTargetData[0].option.seriesColor"
      v-model:opacity="selectTargetData[0].option.seriesOpacity"
      field="seriesColor"
      :options="{ colorTypeOption: 'linear-gradient,single' }"
      @change="update"
    />
  </el-form-item>
</template>

<script setup lang="ts">
import { SwColorPicker } from "@screenwright/ui/color-picker";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
