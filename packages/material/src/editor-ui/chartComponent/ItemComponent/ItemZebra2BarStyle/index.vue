<template>
  <sw-collapse-item title="柱状样式" open>
    <template #content>
      <el-form-item label="柱子宽度" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="currentOption.barWidth"
          unit="px"
          :min="0"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="柱间间距" :label-width="secondLabelWidth">
        <sw-slider v-model="currentOption.barCategoryGap" @change="update" />
      </el-form-item>
      <el-form-item label="斑马格高度" :label-width="secondLabelWidth">
        <sw-slider v-model="currentOption.barBlockItemHeight" :min="5" :step="1" @change="update" />
      </el-form-item>
      <el-form-item label="斑马格间隔" :label-width="secondLabelWidth">
        <sw-slider v-model="currentOption.barBlockItemInterval" :min="1" @change="update" />
      </el-form-item>
      <el-form-item label="斑马格边角" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="currentOption.barBlockItemRadio"
          unit="px"
          :min="0"
          :controls="false"
          @change="update"
        />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const currentOption = computed(() => {
  return selectTargetData.value[0].option;
});
</script>
