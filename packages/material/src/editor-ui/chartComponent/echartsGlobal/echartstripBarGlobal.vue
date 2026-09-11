<template>
  <div class="echart-bar-config">
    <!-- 边距组件配置 -->
    <ItemConfigDistance />
    <!-- 柱形样式配置 -->
    <ItemConfigStripStyle title="条形样式" />
    <!-- 数值标签配置 -->
    <ItemConfigNumber type="custom-suffix" />
    <!-- 图例配置 -->
    <ItemConfigLegend />
    <!-- 轮播动画配置 -->
    <ItemConfigDataLoop />
    <!-- 滚动条配置 -->
    <ItemConfigDataZoom type="bottom" />
  </div>
</template>
<script setup lang="ts">
import ItemConfigDataLoop from "../ItemComponent/ItemConfigDataLoop/index.vue";
import ItemConfigDataZoom from "../ItemComponent/ItemConfigDataZoom/index.vue";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemConfigLegend from "../ItemComponent/ItemConfigLegend/index.vue";
import ItemConfigNumber from "../ItemComponent/ItemConfigNumber/index.vue";
import ItemConfigStripStyle from "../ItemComponent/ItemConfigStripStyle/index.vue";
</script>
