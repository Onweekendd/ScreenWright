<!-- 刻度样式 -->
<template>
  <sw-collapse-item title="刻度样式">
    <template #content>
      <el-form-item label="圆心位置" :label-width="secondLabelWidth">
        <div class="fullWidth flex flex-center flex-justify-between">
          <sw-input-number
            v-model.number="selectTargetData[0].option.gaugeCenterX"
            unit="%"
            bottomLabel="X"
            :min="0"
            :max="100"
            width="90"
            :controls="false"
            @change="update"
          />
          <sw-input-number
            v-model.number="selectTargetData[0].option.gaugeCenterY"
            unit="%"
            bottomLabel="Y"
            :min="0"
            :max="100"
            width="90"
            :controls="false"
            @change="update"
          />
        </div>
      </el-form-item>
      <el-form-item label="半径" :label-width="secondLabelWidth">
        <sw-slider v-model="selectTargetData[0].option.gaugeRadius" @change="update" />
      </el-form-item>
      <el-form-item label="长度" :label-width="secondLabelWidth">
        <sw-slider v-model="selectTargetData[0].option.gaugeLength" @change="update" />
      </el-form-item>
      <el-form-item label="颜色" :label-width="secondLabelWidth">
        <sw-single-color-picker v-model="selectTargetData[0].option.gaugeColor" @change="update" />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
