<template>
  <sw-collapse-item title="高亮样式" open>
    <template #content>
      <el-form-item label="柱体颜色" :label-width="secondLabelWidth">
        <sw-color-picker
          v-model:color="selectTargetData[0].option.seriesHoverColor"
          v-model:opacity="selectTargetData[0].option.seriesHoverOpacity"
          :options="{ colorTypeOption: 'linear-gradient,single' }"
          @change="update"
          input-disabled
        />
      </el-form-item>
      <el-form-item label="头部颜色" :label-width="secondLabelWidth">
        <sw-single-color-picker v-model="selectTargetData[0].option.seriesHoverTopColor" @change="update" />
      </el-form-item>
      <el-form-item label="底部颜色" :label-width="secondLabelWidth">
        <sw-single-color-picker v-model="selectTargetData[0].option.seriesHoverBottomColor" @change="update" />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
