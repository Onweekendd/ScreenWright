<template>
  <div class="multi-subtabsSeries">
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
@include common-element-style(".el-select__wrapper");
</style>
