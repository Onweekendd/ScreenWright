<template>
  <SwCollapseItem @change="update" title="提示框" open>
    <template #content>
      <el-form-item label="是否显示" label-width="73">
        <el-switch v-model="selectTargetData[0].option.tooltip.show" @change="update" class="ft-switch" />
      </el-form-item>
      <el-form-item label="背景色" label-width="73">
        <SwSingleColorPicker v-model="selectTargetData[0].option.tooltip.backgroundColor" @change="update" />
      </el-form-item>
      <el-form-item label="文字颜色" label-width="73">
        <SwSingleColorPicker v-model="selectTargetData[0].option.tooltip.color" @change="update" />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
