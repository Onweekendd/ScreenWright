<!-- Itemechartsankey全局配置 -->
<template>
  <SwCollapseItem @change="update" title="全局样式" v-model="selectTargetData[0].option.seriesLabelShow" showIcon>
    <template #content>
      <el-form-item label="节点宽度" label-width="73">
        <SwInputNumber @change="update" controls v-model="selectTargetData[0].option.seriesLabel.nodeWidth" :min="0" />
      </el-form-item>
      <el-form-item label="节点间隔" label-width="73">
        <SwInputNumber @change="update" controls v-model="selectTargetData[0].option.series.nodeGap" :min="0" />
      </el-form-item>
      <el-form-item label="可拖拽" label-width="73">
        <el-checkbox v-model="selectTargetData[0].option.series.draggable" @change="update" />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
