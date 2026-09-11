<template>
  <el-row :gutter="8" type="flex">
    <el-col :span="4">
      <div class="grid">组件名称</div>
    </el-col>

    <el-col :span="4">
      <div class="grid">动画效果</div>
    </el-col>

    <el-col :span="4">
      <div class="grid">方向</div>
    </el-col>

    <el-col :span="4">
      <div class="grid">速率</div>
    </el-col>

    <el-col :span="4">
      <div class="grid">持续时间(s)</div>
    </el-col>

    <el-col :span="4">
      <div class="grid">延迟时间(s)</div>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { ElCol, ElRow } from "element-plus";

// 这个组件是纯展示组件，不需要任何逻辑
</script>

<style lang="scss" scoped>
.el-row {
  width: 100%;
  height: 36px;
  border-bottom: 1px solid rgba(13, 7, 7, 0.6);
  margin-left: 0px !important;
  .grid {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
  }
}
</style>
