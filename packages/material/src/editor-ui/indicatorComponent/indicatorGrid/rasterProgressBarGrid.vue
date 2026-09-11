<template>
  <div class="raster-progress-bar-grid">
    <el-form-item label="间距" :label-width="firstLabelWidth">
      <SwSlider :max="1" :step="0.01" @change="update" v-model="selectTargetData[0].option.gridConfig.interval" />
    </el-form-item>
    <el-form-item label="分断数" :label-width="firstLabelWidth">
      <sw-input-number controls @change="update" v-model="selectTargetData[0].option.gridConfig.sectionNums" :min="1" />
    </el-form-item>
    <el-form-item label="圆角" :label-width="firstLabelWidth">
      <sw-input-number
        controls
        @change="update"
        v-model="selectTargetData[0].option.gridConfig.borderRadius"
        :min="0"
      />
    </el-form-item>
    <el-form-item label="前景色" :label-width="firstLabelWidth">
      <sw-color-picker
        :options="{ colorTypeOption: 'linear-gradient,single' }"
        v-model:color="selectTargetData[0].option.gridConfig.foregroundColor"
        v-model:opacity="selectTargetData[0].option.gridConfig.foregroundOpacity"
        field="foregroundColor"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="背景色" :label-width="firstLabelWidth">
      <sw-single-color-picker
        field="backgroundColor"
        v-model="selectTargetData[0].option.gridConfig.backgroundColor"
        :presetColor="selectTargetData[0].option.gridConfig.backgroundColor"
        @change="update"
      />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
