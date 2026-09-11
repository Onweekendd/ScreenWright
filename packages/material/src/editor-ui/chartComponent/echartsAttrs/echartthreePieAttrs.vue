<template>
  <sw-collapse-item title="图形2" open>
    <template #content>
      <el-form-item label="内半径">
        <sw-input-number v-model.number="selectTargetData[0].option.size" @change="update" :controls="true" />
      </el-form-item>
      <el-form-item label="图形距离">
        <sw-input-number v-model.number="selectTargetData[0].option.distance" @change="update" :controls="true" />
      </el-form-item>
      <el-form-item label="高度">
        <sw-input-number v-model.number="selectTargetData[0].option.boxHeight" @change="update" :controls="true" />
      </el-form-item>
      <el-form-item label="固定高度">
        <el-switch v-model="selectTargetData[0].option.fixedHeight" @change="update" class="ft-switch" />
      </el-form-item>
    </template>
  </sw-collapse-item>
  <sw-collapse-item title="动画" open>
    <template #content>
      <el-form-item label="自动旋转">
        <el-switch class="ft-switch" v-model="selectTargetData[0].option.autoRotate" @change="update" />
      </el-form-item>
      <el-form-item label="旋转速度">
        <sw-input-number :controls="true" v-model="selectTargetData[0].option.autoRotateSpeed" @change="update" />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
