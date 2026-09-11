<template>
  <sw-collapse-item title="词云" open>
    <template #content>
      <el-form-item label="最大个数" label-width="73">
        <sw-input-number v-model="selectTargetData[0].option.maxNumber" :controls="true" @change="update" />
      </el-form-item>
      <el-form-item label="速度" label-width="73">
        <sw-input-number v-model="selectTargetData[0].option.speed" :controls="true" @change="update" />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { useUpdateInstance } from "../../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
