<template>
  <div class="echartgrowthRateBar-config">
    <!-- 边距组件配置 -->
    <ItemConfigDistance />
    <!-- 柱体宽度 -->
    <echartgrowthRateBarStyle />
    <!-- 图例 -->
    <ItemConfigLegend :isShowLegendOrient="false" :isShowLegendSelectedMode="false" :legendItemGapShow="true" />
  </div>
</template>
<script setup lang="ts">
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemConfigLegend from "../ItemComponent/ItemConfigLegend/index.vue";
import echartgrowthRateBarStyle from "../ItemComponent/ItemechartgrowthRateBarStyle/index.vue";
</script>
