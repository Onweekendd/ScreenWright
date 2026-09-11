<template>
  <div class="echart-area-line-tooltip">
    <el-form-item label="自动轮播" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.tooltipLoop" @change="update" />
    </el-form-item>
    <el-form-item label="悬停触发" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.tooltipTriggerOn" @change="update" />
    </el-form-item>
    <el-form-item label="停留时间" :label-width="firstLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.tooltipLoopInterval"
        unit="s"
        :min="1"
        :controls="false"
        @change="update"
      />
    </el-form-item>
    <!-- 提示框组件 -->
    <ItemZebra2Tooltip />
    <!-- 指示器组件 -->
    <ItemZebra2Pointer />
  </div>
</template>

<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import ItemZebra2Pointer from "../ItemComponent/ItemzeBra2Pointer/index.vue";
import ItemZebra2Tooltip from "../ItemComponent/ItemZebra2Tooltip/index.vue";

const { selectTargetData, update } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
