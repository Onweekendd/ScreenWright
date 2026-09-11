<template>
  <div calss="echart-zebra-bar-and-line-tooltip">
    <el-form-item label="自动轮播" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.tooltipLoop" @change="update" />
    </el-form-item>
    <el-form-item label="显示系列名" :label-width="firstLabelWidth" v-if="selectTargetData[0].option.tooltipLoop">
      <el-checkbox v-model="selectTargetData[0].option.tooltipSeriesName" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
