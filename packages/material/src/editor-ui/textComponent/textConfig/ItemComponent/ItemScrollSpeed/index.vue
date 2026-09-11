<template>
  <el-form-item label="滚动速度" label-width="73">
    <sw-input-number v-model="selectTargetData[0].option.speed" :controls="true" @change="update" />
  </el-form-item>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";
import { useUpdateInstance } from "@editor/useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
</style>
