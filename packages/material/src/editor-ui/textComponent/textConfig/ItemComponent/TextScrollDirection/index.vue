<template>
  <el-form-item label="滚动方向">
    <el-select
      popper-class="sw-select-dropdown"
      v-model="selectTargetData[0].option.speedPosition"
      @change="update"
    >
      <el-option v-for="item in textDeraction" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>
</template>

<script setup lang="ts">
import { useUpdateInstance } from "@editor/useUpdateInstance";

import { textDeraction } from "../../constants";

const { update, selectTargetData } = useUpdateInstance();
</script>
