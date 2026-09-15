<template>
  <sw-collapse-item title="跑马灯设置" v-model="selectTargetData[0].option.scroll" @change="update" showIcon>
    <template #content>
      <el-form-item label="滚动速度" :label-width="73">
        <sw-input-number v-model="selectTargetData[0].option.speed" @change="update" />
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
