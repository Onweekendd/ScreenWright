<template>
  <el-form-item :label-width="labelWidth" :label="label">
    <el-checkbox v-model="selectTargetData[0].option.isSort" @change="update" />
  </el-form-item>
</template>
<script setup lang="ts">
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
withDefaults(
  defineProps<{
    labelWidth: string;
    label: string;
  }>(),
  {
    labelWidth: "73",
    label: "是否排序"
  }
);
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
