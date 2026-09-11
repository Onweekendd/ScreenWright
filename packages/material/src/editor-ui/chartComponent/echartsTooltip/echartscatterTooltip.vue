<template>
  <el-form-item label="悬停触发" :label-width="firstLabelWidth">
    <el-checkbox v-model="selectTargetData[0].option.tooltipTriggerOn" @change="update" />
  </el-form-item>
  <!-- 提示框 -->
  <ItemZebra2Tooltip />
  <!-- 指示器 -->
  <ItemZebra2Pointer />
</template>

<script setup lang="ts">
import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import ItemZebra2Pointer from "../ItemComponent/ItemzeBra2Pointer/index.vue";
import ItemZebra2Tooltip from "../ItemComponent/ItemZebra2Tooltip/index.vue";

const { update, selectTargetData } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
