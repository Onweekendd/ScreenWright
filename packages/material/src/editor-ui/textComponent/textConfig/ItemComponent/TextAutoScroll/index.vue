<template>
  <div class="flex flex-wrap">
    <el-form-item label="自动滚动" label-width="100">
      <el-checkbox v-model="selectTargetData[0].option.scroll" @change="update" />
    </el-form-item>
    <el-form-item label="显示滚动条" style="margin-left: 16px" label-width="100">
      <el-checkbox v-model="selectTargetData[0].option.scrollBar" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { useUpdateInstance } from "@editor/useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
</style>
