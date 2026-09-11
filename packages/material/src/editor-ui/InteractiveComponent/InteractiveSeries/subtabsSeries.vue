<template>
  <div class="subtabs-series">
    <el-form-item label="系列样式优先" :label-width="firstLabelWidth">
      <el-checkbox @change="update" v-model="selectTargetData[0].option.isSeriesFirst" />
    </el-form-item>
    <subtabsSeriesConfig />
  </div>
</template>
<script setup lang="ts">
import { firstLabelWidth } from "@editor/textComponent/textConfig/textConfig";
import { useUpdateInstance } from "../../useUpdateInstance";
import subtabsSeriesConfig from "../itemComponent/subtabsSeriesConfig/index.vue";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");
:deep(.el-color-picker__trigger) {
  border: none !important;
}
:deep(.el-select__wrapper) {
  min-height: 24px;
}
</style>
