<template>
  <div class="echart-line-and-bar">
    <!-- 边距组件配置 -->
    <ItemConfigDistance />
    <!-- 柱状样式配置 -->
    <ItemConfigStripStyle title="柱状样式" :isBarBorderRadius="false" barStack="barStack" />
    <!-- 图例配置 -->
    <ItemConfigLegend />
    <!-- 轮播动画配置 -->
    <ItemConfigDataLoop />
  </div>
</template>
<script setup lang="ts">
import ItemConfigDataLoop from "../ItemComponent/ItemConfigDataLoop/index.vue";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemConfigLegend from "../ItemComponent/ItemConfigLegend/index.vue";
import ItemConfigStripStyle from "../ItemComponent/ItemConfigStripStyle/index.vue";
</script>
