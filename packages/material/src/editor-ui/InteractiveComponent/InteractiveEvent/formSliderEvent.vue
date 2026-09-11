<template>
  <div class="form-slider-event">
    <el-form-item label="触发类型" :label-width="firstLabelWidth">
      <div class="flex">
        <el-radio @change="update" v-model="selectTargetData[0].option.changeType" label="1">滑动结束</el-radio>
        <el-radio @change="update" v-model="selectTargetData[0].option.changeType" label="2">实时变化</el-radio>
      </div>
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include radio-style();
</style>
