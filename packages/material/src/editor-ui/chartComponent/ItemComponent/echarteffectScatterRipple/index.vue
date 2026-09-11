<template>
  <sw-collapse-item title="波纹" open>
    <template #content>
      <el-form-item label="数量" :label-width="secondLabelWidth">
        <sw-input-number
          @change="update"
          v-model.number="selectTargetData[0].option.rippleEffectNumber"
          :controls="false"
          :min="0"
        />
      </el-form-item>
      <el-form-item label="周期" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.rippleEffectPeriod"
          unit="s"
          :min="0"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="缩放比例" :label-width="secondLabelWidth">
        <sw-input-number
          @change="update"
          v-model.number="selectTargetData[0].option.rippleEffectScale"
          :min="0"
          :controls="false"
        />
      </el-form-item>
      <el-form-item label="绘制方式" :label-width="secondLabelWidth">
        <sw-radio
          v-model="selectTargetData[0].option.rippleEffectBrushType"
          :option="rippleEffectBrushType"
          @change="update"
          direction="row"
        />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio } from "@screenwright/ui/radio";

import { rippleEffectBrushType, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
