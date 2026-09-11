<template>
  <sw-collapse-item title="整体布局" open>
    <template #content>
      <el-form-item label="边距" :label-width="thirdLabelWidth">
        <div class="flex fullWidth flex-justify-between">
          <sw-input-number
            v-model.number="selectTargetData[0].option.gridLeft[currentIndex]"
            bottomLabel="左"
            unit="%"
            :controls="false"
            width="90"
            @change="update"
          />
          <sw-input-number
            v-model.number="selectTargetData[0].option.gridRight[currentIndex]"
            bottomLabel="右"
            unit="%"
            :controls="false"
            width="90"
            @change="update"
          />
        </div>
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { thirdLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

defineProps<{
  currentIndex: number;
}>();
const { selectTargetData, update } = useUpdateInstance();
</script>
