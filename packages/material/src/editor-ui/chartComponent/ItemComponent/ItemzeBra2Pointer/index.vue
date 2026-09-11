<template>
  <sw-collapse-item title="指示器" open>
    <template #content>
      <el-form-item label="粗细" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.tooltipAxisPointerWidth"
          unit="px"
          :min="0"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="颜色" :label-width="secondLabelWidth">
        <sw-single-color-picker
          v-model="selectTargetData[0].option.tooltipAxisPointerColor"
          field="tooltipAxisPointerColor"
          @change="update"
        />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
