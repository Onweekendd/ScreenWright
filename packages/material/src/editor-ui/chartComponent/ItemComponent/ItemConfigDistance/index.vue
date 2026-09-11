<template>
  <el-form-item label="边距" :label-width="labelWidth">
    <configDistance v-bind="$attrs" />
  </el-form-item>
</template>
<script setup lang="ts">
import configDistance from "../../../components/configDistance/index.vue";

withDefaults(
  defineProps<{
    labelWidth?: string | number;
  }>(),
  {
    labelWidth: "100"
  }
);
</script>
