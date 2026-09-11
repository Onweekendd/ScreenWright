<template>
  <sw-collapse-item title="数据标记" open>
    <template #content>
      <el-form-item label="边框宽度" :label-width="secondLabelWidth">
        <sw-input-number
          @change="update"
          v-model.number="selectTargetData[0].option.borderWidth"
          unit="px"
          :min="0"
          :controls="false"
        />
      </el-form-item>
      <el-form-item label="边框颜色" :label-width="secondLabelWidth">
        <sw-single-color-picker @change="update" v-model="selectTargetData[0].option.borderColor" />
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

const { update, selectTargetData } = useUpdateInstance();
</script>
