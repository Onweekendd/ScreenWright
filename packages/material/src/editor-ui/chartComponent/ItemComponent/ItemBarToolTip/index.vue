<!-- 细长柱状图提示框配置 -->
<template>
  <div class="echart-thin-bar-tooltip">
    <el-form-item label="自动轮播">
      <el-checkbox v-model="selectTargetData[0].option.tooltipLoop" @change="update" />
    </el-form-item>
    <el-form-item label="单位">
      <sw-input v-model="selectTargetData[0].option.tooltipUnit" @change="update" />
    </el-form-item>
    <el-form-item label="保留小数">
      <sw-input-number v-model="selectTargetData[0].option.tooltipFixed" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
