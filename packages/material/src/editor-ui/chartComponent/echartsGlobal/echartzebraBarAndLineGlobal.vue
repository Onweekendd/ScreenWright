<template>
  <div class="echart-zebra-bar-and-line-global">
    <!-- 边距组件配置 -->
    <ItemConfigDistance />
    <!-- 图例组件配置 -->
    <ItemConfigLegend :showLegendSize="false" />
  </div>
</template>

<script setup lang="ts">
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemConfigLegend from "../ItemComponent/ItemConfigLegend/index.vue";
</script>
