<!-- 排名图表全局配置 -->
<template>
  <div class="echart-rank-bar-global">
    <!-- 边距组件配置 -->
    <ItemConfigDistance />
    <!-- 柱状样式配置 -->
    <ItemBarStyle title="柱状样式" />
    <!-- 数值标签配置 -->
    <ItemechartmultiplyRankBarValueLabel />
    <!-- 轴标签配置 -->
    <ItemechartmultiplyRankBarAxisLabel />
    <!-- 轮播动画配置 -->
    <ItemConfigDataLoop />
  </div>
</template>

<script setup lang="ts">
import ItemBarStyle from "../ItemComponent/ItemBarStyle/index.vue";
import ItemConfigDataLoop from "../ItemComponent/ItemConfigDataLoop/index.vue";
import ItemConfigDistance from "../ItemComponent/ItemConfigDistance/index.vue";
import ItemechartmultiplyRankBarAxisLabel from "../ItemComponent/ItemechartmultiplyRankBarAxisLabel/index.vue";
import ItemechartmultiplyRankBarValueLabel from "../ItemComponent/ItemechartmultiplyRankBarValueLabel/index.vue";
</script>
