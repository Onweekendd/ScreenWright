<template>
  <div class="echart-funnel-config">
    <!-- 边距组件配置 -->
    <ItemConfigDistance />
    <!-- 数值标签 -->
    <ItemFunnelNumberLabel />
    <!-- 图例配置 -->
    <ItemConfigLegend />
  </div>
</template>
<script setup lang="ts">
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemConfigLegend from "../ItemComponent/ItemConfigLegend/index.vue";
import ItemFunnelNumberLabel from "../ItemComponent/ItemFunnelNumberLabel/index.vue";
</script>
