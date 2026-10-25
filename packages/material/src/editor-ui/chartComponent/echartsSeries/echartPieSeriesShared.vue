<!-- 环状饼图-系列设置 -->
<template>
  <div class="echartthree-quarters-pie-series">
    <el-form-item label="顺序" label-width="100">
      <el-select
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.seriesOrder"
        @change="update"
      >
        <el-option v-for="item in dataOrder" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <ItemSeries :type="props.colorType" />
  </div>
</template>

<script setup lang="ts">
import { useUpdateInstance } from "../../useUpdateInstance";
import ItemSeries from "../ItemComponent/ItemSeries/index.vue";

const { selectTargetData, update } = useUpdateInstance();
const dataOrder = [
  { label: "数据返回顺序", value: "default" },
  { label: "从大到小", value: "desc" },
  { label: "从小到大", value: "asc" }
];
const props = withDefaults(
  defineProps<{
    colorType?: string;
  }>(),
  {
    colorType: "linear-gradient,single"
  }
);
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
